var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a;
const crypto$1 = require("crypto");
const token = {
  // 自定义token
  getToken() {
    const tid = this._tokenUtil.generateRandomString();
    const expireTime = this._tokenUtil.generateEpoch15MinLater();
    const ip = this._tokenUtil.generateFakeIp();
    const asn = this._tokenUtil.generateFakeAsn();
    return {
      annotations_enabled: false,
      chat_enabled: true,
      chat_jetbrains_enabled: true,
      code_quote_enabled: true,
      codesearch: false,
      copilot_ide_agent_chat_gpt4_small_prompt: false,
      copilotignore_enabled: false,
      endpoints: {
        api: "https://api.githubcopilot.com",
        "origin-tracker": "https://origin-tracker.githubusercontent.com",
        proxy: "https://copilot-proxy.githubusercontent.com",
        telemetry: "https://copilot-telemetry-service.githubusercontent.com"
      },
      expires_at: expireTime,
      individual: true,
      nes_enabled: false,
      prompt_8k: true,
      public_suggestions: "disabled",
      refresh_in: 1500,
      sku: "monthly_subscriber",
      snippy_load_test_enabled: false,
      telemetry: "disabled",
      token: `tid=${tid};exp=${expireTime};sku=monthly_subscriber;st=dotcom;chat=1;8kp=1;ip=${ip};asn=${asn}`,
      tracking_id: tid,
      vsc_electron_fetcher: false
    };
  },
  _tokenUtil: {
    generateRandomString(length = 32) {
      const lettersAndDigits = "abcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += lettersAndDigits.charAt(Math.floor(Math.random() * lettersAndDigits.length));
      }
      return result;
    },
    generateFakeAsn() {
      const asnNumber = Math.floor(Math.random() * 99999) + 1;
      const hashPart = crypto$1.randomBytes(32).toString("hex");
      return `AS${asnNumber}:${hashPart}`;
    },
    generateFakeIp() {
      return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
    },
    generateEpoch15MinLater() {
      const currentTime = Math.floor(Date.now() / 1e3);
      const fifteenMinutes = 15 * 60;
      return currentTime + fifteenMinutes;
    }
  }
};
const session = {
  getSession() {
    return {
      id: "839101bacdf8150e",
      account: { label: "goodboy", id: 36431534 },
      scopes: ["user:email"],
      accessToken: "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"
    };
  }
};
class openaiModel {
  constructor(data = {}) {
    __publicField(this, "headers", {});
    __publicField(this, "url", "");
    __publicField(this, "model", "");
    __publicField(this, "prompt", "");
    __publicField(this, "max_tokens", 16);
    __publicField(this, "temperature", 0);
    __publicField(this, "top_p", 1);
    __publicField(this, "n", 1);
    __publicField(this, "stop", "");
    __publicField(this, "stream", true);
    this.url = data.url || "";
    this.model = data.model || "";
    this.headers = data.headers || { "Content-Type": "application/json" };
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
      stop: params.stop || ["\n"],
      stream: true
    };
  }
  // 模拟copilot发送请求，并只返回fetch第一段结果给copilot，续上后续流程
  sendRequest(ctx, data = {}) {
    return ctx.get(qa).fetch(this.url, {
      method: "post",
      headers: this.headers,
      body: JSON.stringify(this.generateprompt(data))
    });
  }
}
class codeqwenModel extends openaiModel {
  constructor() {
    super({
      url: "https://hithink-oslm.myhexin.com/codeqwen/v1/completions",
      model: "CodeQwen1.5-7B"
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<fim_prefix>${params.prompt}<fim_suffix>${params.suffix}<fim_middle>`,
      max_tokens: 300
    });
  }
}
class deepseekModel extends openaiModel {
  constructor() {
    super({
      url: "https://api.deepseek.com/beta/completions",
      model: "deepseek-coder",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer sk-e869cdf4837a4e0393673874646fa2f9"
      }
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: params.prompt,
      suffix: params.suffix,
      max_tokens: 100,
      // deepseek的n必须为1
      n: 1
    });
  }
}
class deepseek16bModel extends openaiModel {
  constructor() {
    super({
      url: "https://hithink-oslm.myhexin.com/deepseekcoder/v1/completions",
      model: "DeepSeek-Coder-V2-Lite-Base"
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<｜fim▁begin｜>${params.prompt}<｜fim▁hole｜>${params.suffix}<｜fim▁end｜>`,
      max_tokens: 100,
      // deepseek的n必须为1
      n: 1
    });
  }
}
class codellamaModel extends openaiModel {
  constructor() {
    super({
      url: "https://hithink-oslm.myhexin.com/codellama/v1/completions",
      model: "CodeLlama-7b-Instruct-hf"
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: `<PRE>${params.prompt}<SUF>${params.suffix}<MID>`
    });
  }
}
class codestralModel extends openaiModel {
  constructor() {
    super({
      url: "https://api.mistral.ai/v1/fim/completions",
      model: "codestral-latest",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer JTeM6uPzfcqfn1nsk8JrxfVF8pOB54Ty"
      }
    });
  }
  generateprompt(params) {
    return Object.assign(super.generateprompt(params), {
      prompt: params.prompt,
      suffix: params.suffix
    });
  }
}
const completionModels = { codeqwenModel, deepseekModel, deepseek16bModel, codellamaModel, codestralModel };
class SSEDataStorage {
  constructor() {
    this.storedData = {};
  }
  clearSSEData() {
    this.storedData = {};
  }
  // 方法用于存储来自fetch响应的SSE数据
  async storeSSEData(name, response) {
    if (!response.ok) {
      throw new Error(`Model ${name} HTTP error! status: ${response.status}`);
    }
    const chunks = await response.body();
    chunks.setEncoding("utf8");
    const storedData = [];
    for await (let chunk of chunks) {
      storedData.push(chunk);
    }
    this.storedData[name] = storedData;
  }
  // 方法用于处理存储的SSE数据
  async getSSEData(name, requestId) {
    const fakeResponse = {
      status: 200,
      statusText: "success",
      headers: {
        get(type) {
          switch (type) {
            case "x-request-id":
              return requestId;
            default:
              return "";
          }
        }
      },
      body: () => {
        return {
          // 模拟setEncoding方法
          setEncoding: () => {
          },
          destroy: () => {
            this.clearSSEData();
          },
          [Symbol.asyncIterator]: (async function* () {
            for (const chunk of this.storedData[name]) {
              yield chunk;
            }
          }).bind(this)
        };
      }
    };
    return fakeResponse;
  }
  // 流式接口response处理并返回拼接后的结果
  async processSSEData(response, requestId) {
    var _a2, _b, _c, _d, _e;
    let streams = await response.body();
    streams.setEncoding("utf8");
    let result = "";
    let finishReason = "";
    e: for await (let stream of streams) {
      let chunks = stream.split(`data: `);
      for (const chunk of chunks) {
        let line = chunk.trim();
        if (line === "") continue;
        else if (line === "[DONE]") break e;
        try {
          const json = JSON.parse(line);
          if (json.choices && ((_a2 = json.choices[0]) == null ? void 0 : _a2.text)) {
            result += json.choices[0].text;
          } else if (json.choices && ((_c = (_b = json.choices[0]) == null ? void 0 : _b.delta) == null ? void 0 : _c.content)) {
            result += json.choices[0].delta.content;
          }
          if ((_d = json.choices[0]) == null ? void 0 : _d.finish_reason) {
            finishReason = (_e = json.choices[0]) == null ? void 0 : _e.finish_reason;
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          finishReason = "length";
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
const fs$1 = require("fs");
const path$2 = require("path");
const requestCollection = {
  // 每次发起completions请求都会把请求头id和请求体暂存，用于续写接口响应后把请求体和响应体对应起来，请求头id为X-Request-Id和headerRequestId
  _requestCache: {},
  // 所有completions请求的请求体和响应体列表，在续写被采纳后对应的数据会被写入本地文件存储
  _requestList: {},
  setRequestCache(id, value) {
    this._requestCache[id] = value;
  },
  addRequestList(obj) {
    if (this._requestCache[obj.requestId]) {
      this._requestList[obj.requestId] = Object.assign({}, obj, {
        request: this._requestCache[obj.requestId]
      });
      delete this._requestCache[obj.requestId];
    }
  },
  accepted(requestId) {
    if (!requestId || !this._requestList[requestId]) {
      return;
    }
    const filePath2 = path$2.join(
      "E:",
      "Work",
      "ths",
      "Code",
      "Copilot",
      "modelCompare",
      this._generateFileName()
    );
    fs$1.writeFile(filePath2, JSON.stringify(this._requestList[requestId]), (err) => {
      if (err) {
        console.error("[qwen] 写入文件时出错:", err);
      } else {
        console.log("[qwen] requestList数据已成功写入文件");
      }
    });
  },
  _generateFileName() {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}.${minutes}.${seconds}.json`;
  }
};
async function qwenModel(prompt) {
  var _a2, _b;
  try {
    const res = await fetch("http://hithink-oslm.myhexin.com/qwen2/v1/chat/completions", {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Qwen2-72B-RLHF",
        messages: [
          {
            content: prompt,
            role: "system"
          }
        ],
        frequency_penalty: 0,
        max_tokens: 16,
        presence_penalty: 0,
        response_format: {
          type: "text"
        },
        stop: null,
        stream: false,
        stream_options: null,
        temperature: 1,
        top_p: 1,
        tools: null,
        tool_choice: "none",
        logprobs: false,
        top_logprobs: null
      })
    });
    const data = await res.json();
    return (_b = (_a2 = data == null ? void 0 : data.choices[0]) == null ? void 0 : _a2.message) == null ? void 0 : _b.content;
  } catch (error) {
    return 1;
  }
}
async function modelScore(reqParams, resData, fileName2) {
  var _a2, _b;
  const prefix = reqParams.prompt.split("\n").slice(-10).join("\n");
  const suffix = reqParams.suffix.split("\n").slice(0, 10).join("\n");
  const needScoreList = [];
  for (const name in resData) {
    if (!((_b = (_a2 = resData[name]) == null ? void 0 : _a2.data) == null ? void 0 : _b.replace(/\n/g, "").trim())) {
      continue;
    }
    needScoreList.push({ name, ...resData[name] });
  }
  if (!needScoreList.length) {
    console.log("[qwen]--- 所有模型均未返回有效数据");
    return { name: "", data: "" };
  } else if (needScoreList.length === 1) {
    console.log("[qwen]--- 只有一个模型返回有效数据", needScoreList[0].name);
    return { ...needScoreList[0] };
  }
  const finishReasonIsLength = needScoreList.filter((item) => item.finishReason !== "length");
  if (finishReasonIsLength.length === 1) {
    console.log("[qwen]--- 只有一个模型finish_reason不为length", finishReasonIsLength[0].name);
    return { ...finishReasonIsLength[0] };
  } else {
    const prompt = buildPrompt(fileName2, prefix, suffix, needScoreList);
    try {
      let score = await qwenModel(prompt);
      console.log("[qwen]--- score model return: ", score);
      score = score.replace("片段", "").trim();
      console.log("[qwen]--- highest score model is: ", needScoreList[score - 1].name);
      if (score && needScoreList[score - 1]) {
        return { ...needScoreList[score - 1] };
      } else {
        return { ...needScoreList[0] };
      }
    } catch (error) {
      return { ...needScoreList[0] };
    }
  }
}
function buildPrompt(fileName2, prefix, suffix, needScoreList) {
  return `你是一位优秀的程序员，你正在编写代码。当前代码文件名为${fileName2}。当前光标位置的代码上文是：\`\`\`${prefix}\`\`\`
代码的下文是：\`\`\`${suffix}\`\`\`
现在有多个大模型给你提示出了补全光标位置的代码片段如下：
${needScoreList.map((item, index) => `片段${index + 1}: \`\`\`${item.data}\`\`\``).join("\n")}
第一步：找出符合当前技术栈语法规范的代码片段；
第二步：从这些符合语法规范的代码片段中找出最合适的代码片段；
最后：只返回代码片段的序号，如果都不符合则返回“无”，不用返回其他内容`;
}
const crypto = require("crypto");
const vscode$1 = require("vscode");
const path$1 = require("path");
function getFileName() {
  const fileAbsPath = vscode$1.window.activeTextEditor.document.fileName;
  return path$1.basename(fileAbsPath);
}
function getMultiModelConfiguration() {
  const defaultLlmList = ["deepseekModel", "codeqwenModel", "deepseek16bModel"];
  const config = vscode$1.workspace.getConfiguration("multiModel");
  const currentList = config.get("list", ["codeqwenModel"]) || defaultLlmList;
  return currentList;
}
vscode$1.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("multiModel.list")) {
    const currentList = getMultiModelConfiguration();
    console.log("[info] multiModel.list:", currentList);
  }
});
function get16BitHash(str) {
  if (!str) return "";
  const hash = crypto.createHash("md5");
  hash.update(str);
  const hashHex = hash.digest("hex");
  return hashHex.substring(0, 16);
}
function formatTime(timestamp) {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
const fs = require("fs");
const vscode = require("vscode");
const path = require("path");
const basePath = (_a = vscode.extensions.getExtension("github.copilot")) == null ? void 0 : _a.extensionPath.split(".vscode")[0];
const fileName = "copilot.log";
const filePath = path.join(...basePath.split("\\"), ".vscode", fileName);
function log(type, ...args) {
  const time = formatTime();
  const logMessage = `${time} [${type}] ${args.map((arg) => JSON.stringify(arg)).join("|||")} 
`;
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) {
      console.error("[qwen] Failed to write to log file.", err);
    }
  });
}
const thsLlmManager = {
  // 全局上下文
  ctx: null,
  token,
  session,
  requestCollection,
  log,
  util: {
    get16BitHash
  },
  init(ctx) {
    this.ctx = ctx;
    completionLlmList = getMultiModelConfiguration();
    this.llmInit(completionLlmList);
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
    if (finishReason === "length") {
      const textArr = text.split("\n");
      if (["", "\n"].includes(textArr[0].trim())) {
        return textArr.slice(0, 2).join("\\n");
      } else {
        return textArr[0];
      }
    } else {
      return text;
    }
  },
  async send(params) {
    if (!this.ctx) return;
    const storage = new SSEDataStorage();
    const resCache = {};
    const promises = [];
    const fileName2 = getFileName();
    const requestId = get16BitHash(Math.random().toString());
    for (const name in this.llmMgr) {
      resCache[name] = { response: this.llmMgr[name].sendRequest(this.ctx, params), data: null };
      promises.push(
        resCache[name].response.then(async (response) => {
          await storage.storeSSEData(name, response);
          return await storage.processStoredSSE(name, requestId);
        }).then((streamResult) => {
          resCache[name].data = streamResult.result;
          resCache[name].finishReason = streamResult.finishReason;
          resCache[name].response = streamResult.response;
        }).catch((error) => {
          resCache[name].data = "";
        })
      );
    }
    await Promise.all(promises);
    console.log("[qwen]--- completion model results: ", resCache);
    this.log("triggerCompletion", { requestId, request: params, responses: resCache });
    const highScore = await modelScore(params, resCache, fileName2);
    if (highScore.response) {
      this.log("showCompletion", {
        requestId,
        model: highScore.name,
        text: highScore.data,
        finishReason: highScore.finishReason
      });
    }
    return highScore;
  }
};
global.thsLlmManager = thsLlmManager;
