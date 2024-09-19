const fs = require('fs');
const path = require('path');
// 用于采集补全请求体和响应体
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
        request: this._requestCache[obj.requestId],
      });
      delete this._requestCache[obj.requestId];
    }
  },
  accepted(requestId) {
    if (!requestId || !this._requestList[requestId]) {
      return;
    }
    const filePath = path.join(
      'E:',
      'Work',
      'ths',
      'Code',
      'Copilot',
      'modelCompare',
      this._generateFileName()
    );
    fs.writeFile(filePath, JSON.stringify(this._requestList[requestId]), (err) => {
      if (err) {
        console.error('[qwen] 写入文件时出错:', err);
      } else {
        console.log('[qwen] requestList数据已成功写入文件');
      }
    });
  },
  _generateFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}.${minutes}.${seconds}.json`;
  },
};
export default requestCollection;
