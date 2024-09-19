// 手动打印日志到指定目录
const fs = require('fs');
const vscode = require('vscode');
const path = require('path');
import { formatTime } from './util';

// 放到用户目录下
const basePath = vscode.extensions
  .getExtension('github.copilot')
  ?.extensionPath.split('.vscode')[0];
const fileName = 'copilot.log';
const filePath = path.join(...basePath.split('\\'), '.vscode', fileName);

function log(type, ...args) {
  const currentTime = formatTime();
  const logMessage = `[${currentTime}] [${type}] ${args.map((arg) => JSON.stringify(arg)).join('|||')} \n`;
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) {
      console.error('[qwen] Failed to write to log file.', err);
    }
  });
}
export default log;
