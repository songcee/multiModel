import fs from 'fs';
import chatModels from './models/chatModels.js';
import { formatPercentage } from './util/util.js';

// 对比不同文件、不同输入顺序修改此处即可
const fileName = 'typescript_result';
const modelSort = ['deepseek-chat', 'CodeQwen1.5-7B', 'hipilot',];


const resStr = fs.readFileSync(`file/modelRes/${fileName}.json`, 'utf8');
const resArr = JSON.parse(resStr).slice(0, 3);

console.log(`${fileName}.json 共`, resArr.length, '条数据');
// 记录结果
const finalResult = {
  hipilot: 0,
  codeqwen: 0,
  deepseek: 0,
  copilot: 0,
};
Promise.allSettled(
  resArr.map((item) => {
    return new Promise((resolve, reject) => {
      compare(item).then(resolve).catch(reject);
    });
  })
)
  .then(() => {
    console.log(
      '[finalResult]',
      `${fileName}.json ${finalResult.copilot}条续写片段，
      模型输入顺序：${modelSort}
      hipilot正确率${formatPercentage(finalResult.hipilot / finalResult.copilot)}（${finalResult.hipilot}/${finalResult.copilot}），
      codeqwen正确率${formatPercentage(finalResult.codeqwen / finalResult.copilot)}（${finalResult.codeqwen}/${finalResult.copilot}），
      deepseek16B正确率${formatPercentage(finalResult.deepseek / finalResult.copilot)}（${finalResult.deepseek}/${finalResult.copilot}）`
    );
  })
  .catch((error) => {
    console.log('[error] An error occurred during comparisons:', error);
  });

function compare(data) {
  finalResult.copilot++;
  return new Promise((resolve, reject) => {
    data.myMessage = generatePrompt(data.multiRes);
    chatModels
      .qwenModel(data)
      .then((res) => res.json())
      .then((result) => {
        console.log(result.choices[0].message.content)
        const res = JSON.parse(result.choices[0].message.content);
        if (res.indexOf('CodeQwen1.5-7B') > -1) {
          finalResult.codeqwen++;
        }
        if (res.indexOf('deepseek-chat') > -1) {
          finalResult.deepseek++;
        }
        if (res.indexOf('hipilot') > -1) {
          finalResult.hipilot++;
        }
        resolve(result);
      })
      .catch((error) => {
        console.log('[error] send completion request error:', error);
        reject(error);
      });
  });
}

function generatePrompt(data) {
  // 将data对象按照modelSort顺序调整后作为prompt输入
  const sortedData = {};
  modelSort.forEach((model) => {
    if (data[model]) {
      sortedData[model] = data[model];
    }
  });

  return [
    {
      role: 'system',
      content: `### 角色
你是一位高级前端开发工程师，熟练掌握vue、react、javascript、typescript等前端技术框架，善于代码编写和代码对比。
### 背景
根据代码上下文，copilot已经在光标位置正确的补全了代码，并且我们确定copilot生成的代码段就是正确的代码段，现在我们尝试使用其他模型也在光标处补全代码并生成了多个代码段。
### 任务
你的职责是根据copilot生成的代码段，从其他几个代码段中找出一样正确的代码段，不管输入什么，你用数组格式输出你认为正确的代码段的名字，可以是多个代码段，不用输出代码段的内容。`,
    },
    {
      role: 'user',
      content: `我会给你一个object格式的数据，里面包含了生成的几种代码片段，并且会再给你一个我们认为完全正确的代码片段。你需要根据我们提供的完全正确的代码片段，从key为其他值的代码段中查找最符合正确代码片段的片段。按照下面的判断规则找出正确的代码段并用数组格式输出你认为正确的代码段的名字，可以是多个代码段，如果找不出则返回空数组。

### 判断规则
1. 代码段的内容和copilot前一部分内容一模一样，则认为是正确的代码段
2. 对比的时候忽略代码段最后的括号（如：[]{}()等），分号（如：;:等），换行符（如空格、\r、\n、
等），其余内容和copilot一模一样，则认为是正确的代码段
3. copilot有可能返回多行代码，如果其他代码段只是返回了单行或者几行，但是对应行的内容是和copilot一样的，认为是正确的代码段
4. 代码段中包含（\`\`\`+技术栈）或者// Start Generation Here的，先把这些内容去掉再比较内容
5. 如果生成的代码段中只有注释或者全是中文，根据语义比较，相近的也认为是正确的代码段

### 示例
#### 输入：
生成的代码为：{"hipilot": ".push(curr.segmentName);","CodeQwen1.5-7B": ".push(key);\r","deepseek-chat": ".push(curr.segmentName);",}。标准的代码为：".push(key);"。
#### 输出：
["CodeQwen1.5-7B"]
`,
    },
    {
      role: 'user',
      content: `现在生成的代码为：${JSON.stringify(sortedData)} 。标准的代码为："${data.copilot}"。请在生成的代码找出正确的代码段名字数组，可多选，不要说其他内容`,
    },
  ];
}
