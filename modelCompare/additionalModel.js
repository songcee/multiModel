import modelMgr from './models/index.js';
import fs from 'fs';

// 需要追加使用的续写模型
const completionLlmList = ['codeqwen15Model'];
const chatLlmList = [];
const readFileList = [
  // 'cpp_result',
  // 'go_result',
  // 'test',
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
const maxlength = 10000;
// 每次请求之间时间间隔
const requestInterval = 0.1 * 1000;

async function processCodeList() {
  for (const fileName of readFileList) {
    let codeListArr = [];
    try {
      const codeListStr = fs.readFileSync(`file/modelRes/${fileName}.json`, 'utf8');
      codeListArr = JSON.parse(codeListStr);
    } catch (e) {
      console.error('[error] read file error: [', fileName, ']', e);
      continue;
    }
    console.log(`[info] ${fileName}.json total code list: ${codeListArr.length}`);

    for (let [index, codeData] of codeListArr.entries()) {
      if (index >= maxlength) break;
      for (const llm of completionLlmList) {
        // 通过llm名称获取到模型实际名称
        const modelName = modelMgrObj.completion[llm].model;
        console.log(`[info] ${fileName}.json begin send ${modelName} completion request: ${index}`);
        if (!codeData.multiRes[modelName]) {
          const res = await modelMgr.sendCompletionFetch(codeData);
          codeData.multiRes = res.multiRes;
          fs.writeFileSync(`file/modelRes/${fileName}.json`, JSON.stringify(codeListArr));
          await new Promise((resolve) => setTimeout(resolve, requestInterval));
        }
      }
    }
    console.log(`[info] end send completion request for ${fileName}`);
  }
}
// 模型初始化
const modelMgrObj = modelMgr.modelInit(completionLlmList, chatLlmList);
processCodeList();
