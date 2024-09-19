// 取消禁用 TLS 证书验证
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
}

import completionModels from './models/completionModels.js';
import chatModels from './models/chatModels.js';
import fs from 'fs';

// 默认使用的续写模型
const completionLlmList = ['hipilotModel', 'codeqwenModel', 'deepseekModel'];
const chatLlmList = [];
const fileName = 'java_result';
const maxlength = 1000;
const requestInterval = 1000;

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
        .catch((error) => {
          console.error('[error] send chat request error: [', name, ']', error);
          return {};
        })
    );
  }

  // 执行所有续写模型，拿到续写结果
  const res = await Promise.allSettled(promises);
  const resList = res.reduce((result, item) => {
    if (item.status !== 'fulfilled') {
      return result;
    }
    
    const { model, choices, status_code } = item.value;
    const choice = choices && choices[0];
    
    // openai标准格式
    if (model && choice) {
      if (choice.text !== undefined) {
        // completion格式
        result[model] = choice.text;
      } else if (choice.message && choice.message.content !== undefined) {
        // chat格式
        result[model] = choice.message.content;
      }
    }
    // hipilot模型不是标准格式，做特殊处理
    // else if (status_code === 0 && choice && choice.message && choice.message.content !== undefined) {
    else if (status_code === 0) {
      result['hipilot'] = choice.message.content;
    }
    
    return result;
  }, {});

  resList['copilot'] = data.infill;
  return Object.assign(data, { multiRes: resList });
}

async function processCodeList() {
  const codeListStr = fs.readFileSync(`file/cleanCode/${fileName}.json`, 'utf8');
  const codeListArr = codeListStr.trim().split('\n').map((code) => JSON.parse(code.trim()));
  const resList = [];
  console.log('[info] total code list:', codeListArr.length);

  for (const [index, code] of codeListArr.entries()) {
    if (index > maxlength) break;
    console.log('[info] begin send completion request:', index);
    resList.push(await sendCompletionFetch(code));
    fs.writeFileSync(`file/modelRes/${fileName}.json`, JSON.stringify(resList));
    await new Promise(resolve => setTimeout(resolve, requestInterval));
  }

  console.log('[info] end send completion request', resList.length);
}

// 模型初始化
modelInit();
processCodeList();
