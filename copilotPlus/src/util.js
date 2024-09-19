const crypto = require('crypto');
const vscode = require('vscode');
const path = require('path');
// 获取当前打开文件的文件名
function getFileName() {
  const fileAbsPath = vscode.window.activeTextEditor.document.fileName;
  return path.basename(fileAbsPath);
}
// 读取vscode配置
function getMultiModelConfiguration() {
  // 默认使用的续写模型
  // const defaultLlmList = ['deepseekModel', 'codeqwenModel', 'deepseek16bModel'];
  const defaultLlmList = ['codeqwenModel'];
  const config = vscode.workspace.getConfiguration('multiModel');
  // 直接使用默认列表作为默认值
  const currentList = config.get('list', defaultLlmList);
  return currentList;
}
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration('multiModel.list')) {
    const currentList = getMultiModelConfiguration();
    console.log('[info] multiModel.list:', currentList);
  }
});

// 将字符串转为16位hash
function get16BitHash(str) {
  if (!str) return '';
  // 创建MD5哈希对象
  const hash = crypto.createHash('md5');
  // 更新哈希对象
  hash.update(str);
  // 计算哈希值并转换为十六进制字符串
  const hashHex = hash.digest('hex');
  // 截取前16位
  return hashHex.substring(0, 16);
}
// 时间格式化
function formatTime(timestamp) {
  const now = timestamp ? new Date(timestamp) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export { get16BitHash, getFileName, formatTime, getMultiModelConfiguration };
