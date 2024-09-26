// 取消禁用 TLS 证书验证
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
}
import modelMgr from './models/index.js';
import fs from 'fs';

// 默认使用的续写模型
const completionLlmList = ['hipilotModel', 'deepseek16bModel', 'codeqwen25Model'];
const chatLlmList = [];
// 输入的文件
const readFileList = [
  // 'test',
  // 'cpp_result',
  // 'go_result',
  'java_result',
  'javascript_result',
  // 'kotlin_result',
  // 'objective-c_result',
  // 'objective-cpp_result',
  // 'python_result', // error
  // 'swift_result',
  // 'typescript_result',
  // 'typescriptreact_result',
  // 'vue_result',
];
// 单文件最大读取数量
const maxlength = 1000;
// 每次请求之间时间间隔
const requestInterval = 10 * 1000;

async function processCodeList() {
  for (const fileName of readFileList) {
    let codeListArr = [];
    try {
      const codeListStr = fs.readFileSync(`file/cleanCode/${fileName}.json`, 'utf8');
      codeListArr = codeListStr
        .trim()
        .split('\n')
        .map((code) => JSON.parse(code.trim()));
    } catch (e) {
      console.error('[error] read file error: [', fileName, ']', e);
      continue;
    }
    const resList = [];
    console.log(`[info] ${fileName}.json total code list: ${codeListArr.length}`);

    for (const [index, codeData] of codeListArr.entries()) {
      if (index >= maxlength) break;
      console.log(`[info] ${fileName}.json begin send completion request: ${index}`);
      resList.push(await modelMgr.sendCompletionFetch(codeData));
      fs.writeFileSync(`file/modelRes/${fileName}.json`, JSON.stringify(resList));
      await new Promise((resolve) => setTimeout(resolve, requestInterval));
    }

    console.log('[info] end send completion request for', fileName, resList.length);
  }
}

// 模型初始化
modelMgr.modelInit(completionLlmList, chatLlmList);
processCodeList();
