/**
 * 对多模型续写结果进行评分处理的函数
 * 这里会针对不同模型返回内容是否为空、finish_reason值等先做一遍对比和过滤，再交由chat模型最评分
 * @param {object} reqParams 续写请求参数，从中取出prompt和suffix的最近10行，用于构建评分prompt
 *  {object} resData 续写内容，需要对resData[name].data值做评分.{data, finishReason, response}
 * @param {string} fileName 当前续写文件的文件名，用于构建评分prompt
 * @returns {object}
 * @returns {string} return.name 选中的高质量的模型名称，没有结果时返回空字符串
 * @returns {string} return.data 续写代码片段
 * @returns {string} return.response 续写接口response对象
 * @returns {string} [return.finishReason] 续写完成原因（可选）
 */
import { qwenModel } from './models/chatModels';
async function modelScore(reqParams, resData, fileName) {
  const prefix = reqParams.prompt.split('\n').slice(-10).join('\n');
  const suffix = reqParams.suffix.split('\n').slice(0, 10).join('\n');

  // 需要评分的数据集
  const needScoreList = [];
  // 所有模型均未返回有效数据或只有一个模型返回有效数据，则直接返回；
  // 过滤结果为空的数据集
  for (const name in resData) {
    // 如果data为空或不存在则不参与比较
    if (!resData[name]?.data?.replace(/\n/g, '').trim()) {
      continue;
    }
    // 需要评分的数据集
    needScoreList.push({ name, ...resData[name] });
  }
  if (!needScoreList.length) {
    console.log('[qwen]--- 所有模型均未返回有效数据');
    return { name: '', data: '' };
  } else if (needScoreList.length === 1) {
    console.log('[qwen]--- 只有一个模型返回有效数据', needScoreList[0].name);
    return { ...needScoreList[0] };
  }

  // 找出finishReason不为'length'的数量，等于1则直接返回，大于1或等于0则需要模型比较
  const finishReasonIsLength = needScoreList.filter((item) => item.finishReason !== 'length');
  if (finishReasonIsLength.length === 1) {
    console.log('[qwen]--- 只有一个模型finish_reason不为length', finishReasonIsLength[0].name);
    return { ...finishReasonIsLength[0] };
  } else {
    // 构建prompt，让大模型选择最合适的结果
    const prompt = buildPrompt(fileName, prefix, suffix, needScoreList);

    try {
      let score = await qwenModel(prompt);
      console.log('[qwen]--- score model return: ', score);

      score = score.replace('片段', '').trim();
      console.log('[qwen]--- highest score model is: ', needScoreList[score - 1].name);
      if (score && needScoreList[score - 1]) {
        return { ...needScoreList[score - 1] };
      } else {
        // 模型返回处理异常，则默认返回第一个
        return { ...needScoreList[0] };
      }
    } catch (error) {
      // console.log('[qwen]--- score model error: ', error);
      return { ...needScoreList[0] };
    }
  }
}

function buildPrompt(fileName, prefix, suffix, needScoreList) {
  return `你是一位优秀的程序员，你正在编写代码。当前代码文件名为${fileName}。当前光标位置的代码上文是：\`\`\`${prefix}\`\`\`
代码的下文是：\`\`\`${suffix}\`\`\`
现在有多个大模型给你提示出了补全光标位置的代码片段如下：
${needScoreList.map((item, index) => `片段${index + 1}: \`\`\`${item.data}\`\`\``).join('\n')}
第一步：找出符合当前技术栈语法规范的代码片段；
第二步：从这些符合语法规范的代码片段中找出最合适的代码片段；
最后：只返回代码片段的序号，如果都不符合则返回“无”，不用返回其他内容`;
}

export default modelScore;
