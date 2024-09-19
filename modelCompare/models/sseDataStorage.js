// SSEDataStorage 类用于存储和处理服务器发送事件（SSE）数据
class SSEDataStorage {
  constructor() {
    // 用于存储SSE数据块，数据格式为{name: []}
    this.storedData = {};
  }

  clearSSEData() {
    this.storedData = {};
  }

  // 方法用于存储来自fetch响应的SSE数据
  async storeSSEData(name, response) {
    if (!response.ok) {
      // 有可能是模型挂了
      throw new Error(`Model ${name} HTTP error! status: ${response.status}`);
    }
    const chunks = await response.body();
    chunks.setEncoding('utf8');
    const storedData = [];
    for await (let chunk of chunks) {
      storedData.push(chunk);
    }
    this.storedData[name] = storedData;
  }

  // 方法用于处理存储的SSE数据
  async getSSEData(name, requestId) {
    // 创建一个模拟的响应对象，其body是一个异步迭代器
    const fakeResponse = {
      status: 200,
      statusText: 'success',
      headers: {
        get(type) {
          switch (type) {
            case 'x-request-id':
              return requestId;
            default:
              return '';
          }
        },
      },
      body: () => {
        return {
          // 模拟setEncoding方法
          setEncoding: () => {},
          destroy: () => {
            this.clearSSEData();
          },
          [Symbol.asyncIterator]: async function* () {
            for (const chunk of this.storedData[name]) {
              yield chunk;
            }
          }.bind(this),
        };
      },
    };
    // 使用原有的processSSE函数处理模拟响应
    return fakeResponse;
  }

  // 流式接口response处理并返回拼接后的结果
  async processSSEData(response, requestId) {
    let streams = await response.body();
    streams.setEncoding('utf8');
    let result = '';
    let finishReason = '';
    e: for await (let stream of streams) {
      let chunks = stream.split(`data: `);
      for (const chunk of chunks) {
        let line = chunk.trim();
        if (line === '') continue;
        else if (line === '[DONE]') break e;
        try {
          // Remove 'data: ' prefix and parse the JSON
          const json = JSON.parse(line);

          // 兼容流式数据格式
          if (json.choices && json.choices[0]?.text) {
            result += json.choices[0].text;
          } else if (json.choices && json.choices[0]?.delta?.content) {
            result += json.choices[0].delta.content;
          }

          // 读取结束续写原因，用于分析续写质量
          if (json.choices[0]?.finish_reason) {
            finishReason = json.choices[0]?.finish_reason;
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          // 如果异常了，直接中断流式读取并直接返回已拼接的内容，finishReason按照最低质量返回
          finishReason = 'length';
          this.clearSSEData();
          break e;
        }
      }
    }
    return { result, finishReason, response };
  }

  async processStoredSSE(name, requestId) {
    const response = await this.getSSEData(name, requestId);
    return this.processSSEData(response);
  }
}
export default SSEDataStorage;
