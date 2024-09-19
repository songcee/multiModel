import fetch from 'node-fetch';
/**
 * 续写模型类，用于续写代码
 * openaiModel是一个基类，定义openai通用格式下的模型类，定义了模型的通用属性和方法，
 * 只要是支持openai通用格式的新模型都可以继承这个类，并重写generateprompt方法来生成特定模型的prompt。
 */
class openaiModel {
  headers = {};
  url = '';
  model = '';
  prompt = '';
  max_tokens = 16;
  temperature = 0;
  top_p = 1;
  n = 1;
  stop = '';
  stream = false;

  constructor(data = {}) {
    this.url = data.url;
    this.model = data.model;
    this.headers = data.headers;
  }

  generateprompt(params = {}) {
    return {
      model: this.model,
      prompt: `<fim_prefix>${params.prompt}<fim_suffix>${params.suffix}<fim_middle>`,
      suffix: void 0,
      max_tokens: params.max_tokens || 16,
      temperature: params.temperature || 0,
      top_p: params.top_p || 1,
      n: params.n || 1,
      stop: params.stop || ['\n\n\n', '\n\n', '\n'],
      stream: false,
    };
  }
  sendRequest(data = {}) {
    const body = JSON.stringify(this.generateprompt(data));
    return fetch(this.url, {
      method: 'post',
      headers: this.headers,
      body,
    });
  }
}

class codeqwenModel extends openaiModel {
  constructor() {
    super({
      url: 'https://hithink-oslm.myhexin.com/codeqwen/v1/completions',
      model: 'CodeQwen1.5-7B',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<fim_prefix>${params.prompt}<fim_suffix>${params.suffix}<fim_middle>`,
      max_tokens: 300,
    });
  }
}
class deepseekModel extends openaiModel {
  constructor() {
    super({
      url: 'https://api.deepseek.com/beta/completions',
      model: 'deepseek-coder',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer sk-e869cdf4837a4e0393673874646fa2f9',
      },
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: params.prompt,
      suffix: params.suffix,
      max_tokens: 100,
      // deepseek的n必须为1
      n: 1,
    });
  }
}
class deepseek16bModel extends openaiModel {
  constructor() {
    super({
      url: 'https://hithink-oslm.myhexin.com/deepseekcoder/v1/completions',
      model: 'deepseek-chat-lite',
      // model: 'DeepSeek-Coder-V2-Lite-Base',
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<｜fim▁begin｜>${params.prompt}<｜fim▁hole｜>${params.suffix}<｜fim▁end｜>`,
      max_tokens: 100,
      // deepseek的n必须为1
      n: 1,
    });
  }
}
class codellamaModel extends openaiModel {
  constructor() {
    super({
      url: 'https://hithink-oslm.myhexin.com/codellama/v1/completions',
      model: 'CodeLlama-7b-Instruct-hf',
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<PRE>${params.prompt}<SUF>${params.suffix}<MID>`,
    });
  }
}
class codestralModel extends openaiModel {
  constructor() {
    super({
      url: 'https://api.mistral.ai/v1/fim/completions',
      model: 'codestral-latest',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer JTeM6uPzfcqfn1nsk8JrxfVF8pOB54Ty',
      },
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: params.prompt,
      suffix: params.suffix,
    });
  }
}
class hipilotModel extends openaiModel {
  constructor() {
    super({
      url: 'https://hipilot.myhexin.com/code-cvn/v1/completions',
      model: 'hipilot',
      headers: {
        token:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBJZCI6IjYxMzJlZDIxNjk5ZDQ2NzZiZTkzNzg0ZmU3ODY4MWNlIiwiZW1haWwiOiJ5dXhpbnhpbkBteWhleGluLmNvbSIsImN1cnJlbnRUaW1lIjoxNzI2Mjk0NzEyOTQ5LCJleHAiOjE3Mjg4ODY3MTJ9.fiC1gYPHsj9_7foPFCgS732RHzfLbv_VAakVSUmo4_E',
        appid: '6132ed21699d4676be93784fe78681ce',
        'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
        'Content-Type': 'application/json',
        Accept: '*/*',
        Host: 'hipilot.myhexin.com',
        Connection: 'keep-alive',
      },
    });
  }

  generateprompt(params = {}) {
    return {
      trace_id: 'af1388b3-7e34-40a7-98db-9030504eac95',
      session_id: '63dc2d3c-d118-4b98-bdaf-5449318e6fa9',
      user_id: 'yuxinxin@myhexin.com',
      scene: 'completion',
      prompt: params.prompt,
      suffix: params.suffix,
      stream: false,
      remote_svc: 'vscode',
      remote_ip: '192.168.31.84',
      remote_mac: '3c:a6:f6:1b:28:14',
      max_tokens: params.max_tokens || 32,
      remote_version: '1.28.0-20240904',
      language: 'js',
      file_path: '/Users/yuxinxin/workspace/code-review/ai-addstock-front/src/utils/common.ts',
      file_suffix: 'ts',
      single: false,
    };
  }
  sendRequest(data = {}) {
    const body = JSON.stringify(this.generateprompt(data));
    return fetch(this.url, {
      method: 'post',
      headers: this.headers,
      body,
    });
  }
}

export default {
  codeqwenModel,
  deepseekModel,
  deepseek16bModel,
  codellamaModel,
  codestralModel,
  hipilotModel,
};
