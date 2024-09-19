import { token, session } from './auth';
import completionModels from './models/completionModels';
import SSEDataStorage from './models/sseDataStorage';
import requestCollection from './requestCollection';
import modelScore from './score';
import log from './log';
import { getFileName, get16BitHash, getMultiModelConfiguration, getCurrentTimestamp } from './util';

// 多模型接入
const thsLlmManager = {
  // 全局上下文
  ctx: null,
  token,
  session,
  requestCollection,
  log,
  util: {
    get16BitHash,
  },
  init(ctx) {
    this.ctx = ctx;
    const completionLlmList = getMultiModelConfiguration();
    this.llmInit(completionLlmList);
    const interval = setInterval(() => {
      if (this.ctx.get(qa).fetch) {
        clearInterval(interval);
        console.log(`[${getCurrentTimestamp()}] [qwen] ctx`, this.ctx.get(qa).fetch);
        // this.proxyFetch();
      }
    }, 10);
  },
  // 控制调用不同大模型，实例控制调用不同模型
  llmMgr: {},
  // 用到的续写模型初始化，后续只需要调用send即可批量发送
  llmInit(llmList) {
    for (const name of llmList) {
      this.llmMgr[name] = new completionModels[name]();
    }
  },
  sendCopilotFetch(name, params) {
    return this.llmMgr[name] && this.llmMgr[name].sendRequest(this.ctx, params);
  },
  improveText(finishReason, text) {
    if (finishReason === 'length') {
      // 当返回结果过长时，往往是因为模型生成了多余的内容，这时候只需要返回第一行即可
      const textArr = text.split('\n');
      if (['', '\n'].includes(textArr[0].trim())) {
        return textArr.slice(0, 2).join('\\n');
      } else {
        return textArr[0];
      }
    } else {
      return text;
    }
  },
  async send(params) {
    // 当copilot环境未初始化完成时，不执行续写流程
    if (!this.ctx) return;
    // 创建SSEDataStorage实例
    const storage = new SSEDataStorage();
    const resCache = {};
    const promises = [];

    // console.time('[qwen]--- total time');
    // console.time('[qwen]--- model request time');
    const fileName = getFileName();
    const requestId = get16BitHash(Math.random().toString());
    for (const name in this.llmMgr) {
      resCache[name] = { response: this.llmMgr[name].sendRequest(this.ctx, params), data: null };
      promises.push(
        resCache[name].response
          .then(async (response) => {
            // 把response流式数据存储到storage中，因为需要在拼接续写结果和copilot内部处理时都需要用到response.body()流式读取方法
            await storage.storeSSEData(name, response);
            return await storage.processStoredSSE(name, requestId);
          })
          .then((streamResult) => {
            resCache[name].data = streamResult.result;
            resCache[name].finishReason = streamResult.finishReason;
            resCache[name].response = streamResult.response;
          })
          .catch((error) => {
            // console.error(`[qwen]--- Error fetching data for ${name}:`, error);
            resCache[name].data = '';
          })
      );
    }

    // 执行所有续写模型，拿到续写结果
    await Promise.all(promises);
    // console.timeEnd('[qwen]--- model request time');
    console.log(`[${getCurrentTimestamp()}] [qwen]--- completion model results: `, resCache);
    this.log('triggerCompletion', { requestId, request: params, responses: resCache, timestamp: getCurrentTimestamp() });

    // 对结果进行评分，选出最优结果
    const highScore = await modelScore(params, resCache, fileName);
    if (highScore.response) {
      this.log('showCompletion', {
        requestId,
        model: highScore.name,
        text: highScore.data,
        finishReason: highScore.finishReason,
        timestamp: getCurrentTimestamp()
      });
    }
    // console.timeEnd('[qwen]--- total time');
    return highScore;
  },
};

global.thsLlmManager = thsLlmManager;
