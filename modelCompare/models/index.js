import completionModels from './completionModels.js';
import chatModels from './chatModels.js';

// 多模型实例管理
const llmMgr = {
  completion: {},
  chat: {},
};

function modelInit(completionLlmList = [], chatLlmList = []) {
  for (const name of completionLlmList) {
    if (!llmMgr.completion[name]) {
      llmMgr.completion[name] = new completionModels[name]();
    }
  }
  for (const name of chatLlmList) {
    if (!llmMgr.chat[name]) {
      llmMgr.chat[name] = chatModels[name];
    }
  }
  return llmMgr;
}

/**
 * @description 串行调用多模型，并把所有模型结果拼接到data中
 * @param {object} data
 * @param {string} prefix
 * @param {string} infill
 * @param {string} suffix
 * @param {string} relevantFile
 * @param {string} relevantFileList
 * @param {string} filePath
 * @param {string} template
 */
async function sendCompletionFetch(data) {
  const promises = [];
  // 调用续写模型完成代码补全任务
  for (const name in llmMgr.completion) {
    promises.push(
      llmMgr.completion[name]
        .sendRequest({
          ...data,
          prompt: data.prefix,
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices && data.choices[0] && data.choices[0].text !== undefined) {
            return {model: data.model, text: llmMgr.completion[name].handelResponce(data.choices[0].text)};
          } else if (data.status_code === 0) {
            // hipilot模型不是标准格式，做特殊处理
            return {model: 'hipilot', text: data.choices[0].message.content};
          } else {
            return {};
          }
        })
        .catch((error) => {
          console.error("[error] send completion request error: [", name, "]", error);
          return {};
        })
    );
  }
  // 调用chat模型完成代码补全任务
  for (const name in llmMgr.chat) {
    promises.push(
      llmMgr.chat[name](data)
        .then((res) => res.json())
        .then((data) => {
          if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content !== undefined) {
            return {model: data.model, text: llmMgr.completion[name].handelResponce(data.choices[0].message.content)};
          } else {
            return {};
          }
        })
        .catch((error) => {
          console.error("[error] send chat request error: [", name, "]", error);
          return {};
        })
    );
  }

  // 执行所有续写模型，拿到续写结果
  const res = await Promise.allSettled(promises);
  const resList = res.reduce((result, item) => {
    if (item.status !== "fulfilled") {
      return result;
    }

    const { model, text } = item.value;
    if (model) {
      result[model] = text;
    }
    return result;

    // const { model, choices, status_code } = item.value;
    // const choice = choices && choices[0];

    // // openai标准格式
    // if (model && choice) {
    //   if (choice.text !== undefined) {
    //     // completion格式
    //     result[model] = choice.text;
    //   } else if (choice.message && choice.message.content !== undefined) {
    //     // chat格式
    //     result[model] = choice.message.content;
    //   }
    // }
    // // hipilot模型不是标准格式，做特殊处理
    // // else if (status_code === 0 && choice && choice.message && choice.message.content !== undefined) {
    // else if (status_code === 0) {
    //   result["hipilot"] = choice.message.content;
    // }

    // return result;
  }, {});

  resList["copilot"] = data.infill;
  if (data.multiRes) {
    Object.assign(data.multiRes, resList);
  } else {
    data.multiRes = resList;
  }
  return data;
}

export default {modelInit, sendCompletionFetch}