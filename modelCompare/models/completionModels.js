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
    this.headers = data.headers || { 'Content-Type': 'application/json' };
  }

  get model() {
    return this.model;
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
  handelResponce(text) {
    return text;
  }
}

class codeqwen15Model extends openaiModel {
  constructor() {
    super({
      url: 'https://hithink-oslm.myhexin.com/deepseekcoder/v1/completions',
      // url: 'https://hithink-oslm.myhexin.com/codeqwen/v1/completions',
      model: 'CodeQwen1.5-7B',
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<fim_prefix>${params.prompt}<fim_suffix>${params.suffix}<fim_middle>`,
      max_tokens: 300,
    });
  }
}
class codeqwen25Model extends openaiModel {
  constructor() {
    super({
      url: 'https://hithink-oslm.myhexin.com/codeqwen/v1/completions',
      model: 'CodeQwen2.5-7B',
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<|fim_prefix|>${params.prompt}<|fim_suffix|>${params.suffix}<|fim_middle|>`,
      // stop: ['\n\n\n', '\n\n'],
      max_tokens: 300,
    });
  }
  handelResponce(text) {
    const splitArr = ['<|file_sep|>', '<|fim_pad|>', '<|fim_prefix|>', '<|cursor|>'];
    for (let i = 0; i < splitArr.length; i++) {
      if (text.indexOf(splitArr[i]) > -1) {
        text = text.split(splitArr[i])[0];
      }
    }
    return text;
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
    // 内网接口
    // super({
    //   url: 'https://hipilot.myhexin.com/code-cvn/v1/completions',
    //   model: 'hipilot',
    //   headers: {
    //     token:
    //       'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBJZCI6IjYxMzJlZDIxNjk5ZDQ2NzZiZTkzNzg0ZmU3ODY4MWNlIiwiZW1haWwiOiJ5dXhpbnhpbkBteWhleGluLmNvbSIsImN1cnJlbnRUaW1lIjoxNzI2Mjk0NzEyOTQ5LCJleHAiOjE3Mjg4ODY3MTJ9.fiC1gYPHsj9_7foPFCgS732RHzfLbv_VAakVSUmo4_E',
    //     appid: '6132ed21699d4676be93784fe78681ce',
    //     'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
    //     'Content-Type': 'application/json',
    //     Accept: '*/*',
    //     Host: 'hipilot.myhexin.com',
    //     Connection: 'keep-alive',
    //   },
    // });
    // 外网接口
    super({
      url: 'https://rtahz.10jqka.com.cn/code-cvn/v1/completions',
      model: 'hipilot',
      headers: {
        token:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBJZCI6ImY0YmExYWRjZWIxNDRhYWM5ODdkYTc4ZTA3ZTNlZGExIiwiY3VycmVudFRpbWUiOjE3MjY3MzAwNTU5MTUsImlhdCI6MTcyNjczMDA1NSwiZXhwIjoxNzI5MzIyMDU1fQ.BfktcgG6yw1_Uook8U0EUHgMaS_otzt_OWzLep8Y1As',
        appid: '6132ed21699d4676be93784fe78681ce',
        'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
        'Content-Type': 'application/json',
        Accept: '*/*',
        Connection: 'keep-alive',
      },
    });
  }

  generateprompt(params = {}) {
    let recentFile = [];
    if (params.relevantFile) {
      params.relevantFile.split('<file_path>').forEach((file) => {
        if (!file) return true;
        // file中会有多个\n，截取第一个\n前后的内容，分别存储
        const fileSplit = file.split('\n');
        const filePath = fileSplit.splice(0, 1).join('\n');
        recentFile.push({
          file_path: filePath,
          file_content: fileSplit.join('\n'),
        });
      });
    }
    return {
      trace_id: 'af1388b3-7e34-40a7-98db-9030504eac95',
      session_id: '63dc2d3c-d118-4b98-bdaf-5449318e6fa9',
      user_id: 'yuxinxin@myhexin.com',
      remote_svc: 'vscode',
      remote_ip: '192.168.31.84',
      remote_mac: '3c:a6:f6:1b:28:14',
      remote_version: '1.28.0-20240904',
      scene: 'completion',
      n: 1,
      stream: false,
      suffix: params.suffix,
      prompt: params.prompt,
      language: params.template,
      max_tokens: params.max_tokens || 64,
      single: false,
      file_path: params.filePath,
      recent_file: recentFile.length > 0 ? recentFile : void 0,
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
  codeqwen15Model,
  codeqwen25Model,
  deepseekModel,
  deepseek16bModel,
  codellamaModel,
  codestralModel,
  hipilotModel,
};
