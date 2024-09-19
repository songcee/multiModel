import { readFileSync, readdirSync } from 'fs';
// 使用正则通过空格切分字符串 2024-08-21 22:30:30 [text] aaa
function parseString(str) {
  const regex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(.*?)\] (.*)/;
  const match = str.match(regex);
  if (match) {
    return {
      date: match[1],
      text: match[2],
      detail: JSON.parse(match[3]),
    };
  }
  return null;
}
// 将数字保留2为百分数
function formatPercentage(value) {
  return (value * 100).toFixed(2) + '%';
}
// 读取data目录下的所有文件，都按行解析内容并返回所有结果
function readFiles() {
  const files = readdirSync('./data');
  const result = [];
  files.forEach((file) => {
    // 如果不是log文件则跳过
    if (!file.endsWith('.log')) return;
    const filePath = `./data/${file}`;
    const data = parseLogFile(filePath);
    result.push(...data);
  });
  return result;
}
// 读取文件，并按行解析文件内容
function parseLogFile(path) {
  const logFile = readFileSync(path, 'utf-8');
  const logLines = logFile.split('\n');
  const logData = logLines.map(parseString).filter(Boolean);
  return logData;
}
// 数据计算
/**
 * 发送请求次数、参数 triggerCompletion
 * 续写展示次数、内容、行数、是哪个模型的 showCompletion
 * 续写采纳次数、内容、行数、是哪个模型的 acceptCompletion
 * vscode真正显示的内容 vscodeShowCompletion
 * @param {*} logData
 * @returns
 */
const showCompletionCache = {};
function calculateData(logData) {
  const data = {
    triggerCompletion: 0,
    triggerDetail: {
      deepseekModel: {},
      codeqwenModel: {},
      deepseek16bModel: {},
    },
    showCompletion: 0,
    showDetail: {
      deepseekModel: {},
      codeqwenModel: {},
      deepseek16bModel: {},
    },
    vscodeShowCompletion: 0,
    vscodeShowDetail: {
      deepseekModel: {},
      codeqwenModel: {},
      deepseek16bModel: {},
    },
    acceptCompletion: 0,
    acceptDetail: {
      deepseekModel: {},
      codeqwenModel: {},
      deepseek16bModel: {},
    },
  };
  logData.forEach((item) => {
    data[item.text] = (data[item.text] || 0) + 1;
    switch (item.text) {
      case 'triggerCompletion':
        for (let key in item.detail.responses) {
          const finishReason = item.detail.responses[key]['finishReason'] || 'error';
          data.triggerDetail[key][`finishReason-${finishReason}`] =
            (data.triggerDetail[key][`finishReason-${finishReason}`] || 0) + 1;
        }
        break;
      case 'showCompletion':
        const finishReason = item.detail.finishReason || 'error';
        const model = item.detail.model;
        const textLength = item.detail.text.split('\n').length;
        showCompletionCache[item.detail.requestId] = model;
        data.showDetail[model]['total'] = (data.showDetail[model]['total'] || 0) + 1;
        data.showDetail[model][`finishReason-${finishReason}`] =
          (data.showDetail[model][`finishReason-${finishReason}`] || 0) + 1;
        data.showDetail[model]['totalTextLength'] =
          (data.showDetail[model]['totalTextLength'] || 0) + textLength;
        break;
      default:
        break;
    }
  });
  logData.forEach((item) => {
    let headerRequestId, showModel;
    switch (item.text) {
      case 'vscodeShowCompletion':
        const insertText = item.detail[0].insertText;
        headerRequestId =
          item.detail[0]?.command?.arguments[0]?.telemetry?.properties?.headerRequestId;
        showModel = showCompletionCache[headerRequestId];
        data.vscodeShowDetail[showModel].total = (data.vscodeShowDetail[showModel].total || 0) + 1;
        data.vscodeShowDetail[showModel].totalTextLength =
          (data.vscodeShowDetail[showModel].totalTextLength || 0) + insertText.split('\n').length;
        break;
      case 'acceptCompletion':
        const text = item.detail.text;
        headerRequestId = item.detail?.telemetry?.telemetry?.properties?.headerRequestId;
        showModel = showCompletionCache[headerRequestId];
        data.acceptDetail[showModel].total = (data.acceptDetail[showModel].total || 0) + 1;
        data.acceptDetail[showModel].totalTextLength =
          (data.acceptDetail[showModel].totalTextLength || 0) + text.split('\n').length;
        break;
      default:
        break;
    }
  });
  return data;
}
// 得到结论
function getResult(data) {
  const triggerText = `触发请求次数：${data.triggerCompletion}\n`;
  const deepseekTriggerTimes =
    data.triggerDetail.deepseekModel['finishReason-stop'] +
    data.triggerDetail.deepseekModel['finishReason-length'];
  const triggerReason = `请求结束原因为stop比例为：\n---deepseek: ${formatPercentage(
    data.triggerDetail.deepseekModel['finishReason-stop'] / deepseekTriggerTimes
  )};\n---deepseek16b: ${formatPercentage(
    data.triggerDetail.deepseek16bModel['finishReason-stop'] / data.triggerCompletion
  )};\n---codeqwen: ${formatPercentage(
    data.triggerDetail.codeqwenModel['finishReason-stop'] / data.triggerCompletion
  )};\n`;

  const returnText = `请求成功响应次数：${data.showCompletion}\n`;
  const returnChoose = `---选中deepseekModel次数： ${data.showDetail.deepseekModel.total}
---选中deepseek16bModel次数：${data.showDetail.deepseek16bModel.total}
---选中codeqwenModel次数：${data.showDetail.codeqwenModel.total}\n`;

  const showText = `vscode显示次数：${data.vscodeShowCompletion}
---deepseekModel显示${data.vscodeShowDetail.deepseekModel.total}次，共${data.vscodeShowDetail.deepseekModel.totalTextLength}行
---deepseek16bModel显示${data.vscodeShowDetail.deepseek16bModel.total}次，共${data.vscodeShowDetail.deepseek16bModel.totalTextLength}行
---codeqwenModel显示${data.vscodeShowDetail.codeqwenModel.total}次，共${data.vscodeShowDetail.codeqwenModel.totalTextLength}行\n`;

  const acceptText = `采纳次数：${data.acceptCompletion}，采纳率
---deepseekModel采纳${data.acceptDetail.deepseekModel.total}次，采纳率${formatPercentage(
    data.acceptDetail.deepseekModel.total / data.vscodeShowDetail.deepseekModel.total
  )}，共${data.acceptDetail.deepseekModel.totalTextLength}行
---deepseek16bModel采纳${data.acceptDetail.deepseek16bModel.total}次，采纳率${formatPercentage(
    data.acceptDetail.deepseek16bModel.total / data.vscodeShowDetail.deepseek16bModel.total
  )}，共${data.acceptDetail.deepseek16bModel.totalTextLength}行
---codeqwenModel采纳${data.acceptDetail.codeqwenModel.total}次，采纳率${formatPercentage(
    data.acceptDetail.codeqwenModel.total / data.vscodeShowDetail.codeqwenModel.total
  )}，共${data.acceptDetail.codeqwenModel.totalTextLength}行\n`;
  return triggerText + triggerReason + returnText + returnChoose + showText + acceptText;
}

const logData = readFiles();
const data = calculateData(logData);
const res = getResult(data);
console.log(data);
console.log(res);
