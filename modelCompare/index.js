// 取消禁用 TLS 证书验证
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  // console.warn('警告: NODE_TLS_REJECT_UNAUTHORIZED 被设置为 0，这会使 HTTPS 连接不安全。');
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
}


import completionModels from './models/completionModels.js';
import chatModels from './models/chatModels.js';
import fs from 'fs';

// 默认使用的续写模型
const completionLlmList = ['hipilotModel', 'codeqwenModel', 'deepseekModel'];
const chatLlmList = [];
const fileName = 'java_result';
// 多模型实例管理
const llmMgr = {
  completion: {},
  chat: {},
};
function modelInit() {
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
}
// 这里其实用ts更好
/**
 *
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
          prompt: data.prefix,
          suffix: data.suffix,
          max_tokens: 300,
        })
        .then((res) => res.json())
        .then((result) => result)
        .catch((error) => {
          console.error('[error] send completion request error: [', name, ']', error);
          return {};
        })
    );
  }
  // 调用chat模型完成代码补全任务
  for (const name in llmMgr.chat) {
    promises.push(
      llmMgr.chat[name](data)
        .then((res) => res.json())
        .then((result) => result)
        .catch((error) => {
          console.error('[error] send chat request error: [', name, ']', error);
          return {};
        })
    );
  }

  // 执行所有续写模型，拿到续写结果
  const res = await Promise.all(promises);
  // 将执行结果和入参组合并返回
  const resList = res.reduce((result, item) => {
    if (item.model && item.choices && item.choices[0]) {
      if (item.choices[0].text || item.choices[0].text === '') {
        // 续写模型
        result[item.model] = item.choices[0].text;
      } else if (item.choices[0].message || item.choices[0].message === '') {
        // chat模型
        result[item.model] = item.choices[0].message.content;
      }
    }
    // hipilot模型不是标准格式，需要特殊处理
    if (item.status_code === 0) {
      result['hipilot'] = item.choices[0].message.content;
    }
    return result;
  }, {});
  resList['copilot'] = data.infill;
  return Object.assign(data, { multiRes: resList });
}

// 模型初始化
modelInit();

// 读取本地代码库
const codeListStr = fs.readFileSync(`file/cleanCode/${fileName}.json`, 'utf8');
const codeListArr = codeListStr
  .trim()
  .split('\n')
  .map((code) => JSON.parse(code.trim()));
const resList = [];
console.log('[info] total code list:', codeListArr.length);
const maxlength = 1000;
const requestInterval = 1000;
// 调用模型触发续写请求
for (let index in codeListArr) {
  if (index > maxlength) {
    break;
  }
  console.log('[info] begin send completion request:', index);
  resList.push(await sendCompletionFetch(codeListArr[index]));
  // 将结果写入本地文件
  fs.writeFileSync(`file/modelRes/${fileName}.json`, JSON.stringify(resList));
  // 1s调用一次接口
  await new Promise(resolve => setTimeout(resolve, requestInterval));
}
console.log('[info] end send completion request', resList.length);
