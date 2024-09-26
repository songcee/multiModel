import fs from 'fs';
import chatModels from './models/chatModels.js';
import { formatPercentage } from './util/util.js';

// 对比不同文件、不同输入顺序修改此处即可
const fileList = ['zrandom_javascript_result'];
var modelList = ['CodeQwen2.5-7B', 'CodeQwen1.5-7B', 'hipilot'];
// 'deepseek-chat-lite',
// multiCompare();
singleCompare();

async function fetchSingleCompare(data, finalResult) {
  finalResult.copilot++;
  // for (const model of modelList) {
  // 循环请求，拿到多个promise的结果
  const validModel = modelList.filter((model) => (data.multiRes[model] ? model : false));
  console.log('validModel', validModel);
  for (const model of validModel) {
    data.myMessage = generatSinglePrompt(data, model);
    await new Promise((resolve, reject) => {
      chatModels
        .qwenModel(data)
        .then((res) => res.json())
        .then((result) => {
          const res = result.choices[0].message.content;
          console.log('res', res);
          if (res === 'true') {
            finalResult[model]++;
          }
          resolve();
        })
        .catch((error) => {
          console.log('[error] send completion request error:', error);
          reject();
        });
    });
  }
  // }
}

function generatSinglePrompt(data, model) {
  return [
    {
      role: 'system',
      content: `### 角色
你是一位高级开发工程师，精通各种语言，例如JavaScript、Java、C++等，善于代码编写和代码对比。
### 背景
根据代码上下文，copilot已经在光标位置正确的补全了代码，并且我们确定copilot生成的代码段就是正确的代码段，现在我们尝试使用其他模型也在光标处补全代码并生成了多个代码段，然后由你来确认这段代码是否正确。
### 任务
你的职责是以copilot代码段为完全正确的代码段，对比我输入的代码段是否也正确，如果正确输出true，否则输出false，你只能输出true或false。`,
    },
    {
      role: 'user',
      content: `我会给你2个代码段，其中copilot代码段是完全正确的代码片段，另外一个代码段就是需要比较的代码段。你需要根据我们提供的完全正确的代码片段，判断需要比较的代码段中是否也是正确的代码段。按照下面的判断规则评判是否为正确的代码段，正确输出true，否则输出false。

### 判断规则
1. 代码段的内容和copilot前一部分内容一模一样，则认为是正确的代码段
2. 对比的时候忽略代码段最后的括号（如：[]{}()等），分号（如：;:等），换行符（如空格、\r、\n、
等），其余内容和copilot一模一样，则认为是正确的代码段
3. copilot有可能返回多行代码，如果其他代码段只是返回了单行或者几行，但是对应行的内容是和copilot一样的，认为是正确的代码段
4. 代码段中包含（\`\`\`+技术栈）或者// Start Generation Here的，先把这些内容去掉再比较内容
5. 如果生成的代码段中只有注释或者全是中文，根据语义比较，相近的也认为是正确的代码段

### 示例1
#### 输入：
copilot代码段为：".push(key);"，需要比较的代码段为：".push(key);\r"
#### 输出：
true

### 示例2
#### 输入：
copilot代码段为：".push(key);"，需要比较的代码段为：".push(curr.segmentName);"
#### 输出：
false
`,
    },
    {
      role: 'user',
      content: `copilot代码段为：${data.multiRes.copilot}，需要比较的代码段为："${data.multiRes[model]}"。请输出true或false，不要说其他内容`,
    },
  ];
}

async function singleCompare() {
  for (const fileName of fileList) {
    const resStr = fs.readFileSync(`file/modelRes/${fileName}.json`, 'utf8');
    const resArr = JSON.parse(resStr);

    console.log(`${fileName}.json 共`, resArr.length, '条数据');
    // 初始化记录结果
    const finalResult = {
      copilot: 0,
      ...Object.fromEntries(modelList.map((model) => [model, 0])),
    };
    let i = 0;
    for (const item of resArr) {
      console.log(i++);
      try {
        await fetchSingleCompare(item, finalResult);
      } catch (error) {
        console.log(`[error] An error occurred during comparison for item:`, error);
        // 跳过失败项，继续执行下一项
        continue;
      }
    }
    console.log('finalResult', finalResult);
  }
}

function fetchMultiCompare(data, finalResult) {
  finalResult.copilot++;
  return new Promise((resolve, reject) => {
    data.myMessage = generatMultiPrompt(data.multiRes);
    chatModels
      .qwenModel(data)
      .then((res) => res.json())
      .then((result) => {
        // console.log(result.choices[0].message.content);
        const res = JSON.parse(result.choices[0].message.content);
        for (const model of modelList) {
          if (res.indexOf(model) > -1) {
            finalResult[model]++;
          }
        }
        resolve(result);
      })
      .catch((error) => {
        console.log('[error] send completion request error:', error);
        reject(error);
      });
  });
}

function generatMultiPrompt(data) {
  // 将data对象按照modelList顺序调整后作为prompt输入
  const sortedData = {};
  modelList.forEach((model) => {
    if (data[model]) {
      sortedData[model] = data[model];
    }
  });

  return [
    {
      role: 'system',
      content: `### 角色
你是一位高级开发工程师，精通各种语言，例如JavaScript、Java、C++等，善于代码编写和代码对比。
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
生成的代码为：{"hipilot": ".push(curr.segmentName);","CodeQwen2.5-7B": ".push(key);\r","deepseek-chat-lite-lite": ".push(curr.segmentName);",}。标准的代码为：".push(key);"。
#### 输出：
["CodeQwen2.5-7B"]
`,
    },
    {
      role: 'user',
      content: `现在生成的代码为：${JSON.stringify(sortedData)} 。标准的代码为："${
        data.copilot
      }"。请在生成的代码找出正确的代码段名字数组，可多选，不要说其他内容`,
    },
  ];
}

async function multiCompare() {
  for (const fileName of fileList) {
    const resStr = fs.readFileSync(`file/modelRes/${fileName}.json`, 'utf8');
    const resArr = JSON.parse(resStr);

    console.log(`${fileName}.json 共`, resArr.length, '条数据');
    // 为了避免modelList顺序导致模型对比结果的偏差，这里将modelList按照输入顺序并调整顺序
    const originalModelList = [...modelList]; // 保存原始的modelList
    for (let i = 0; i < originalModelList.length; i++) {
      // 初始化记录结果
      const finalResult = {
        copilot: 0,
        ...Object.fromEntries(modelList.map((model) => [model, 0])),
      };
      for (const item of resArr) {
        try {
          await fetchMultiCompare(item, finalResult);
        } catch (error) {
          console.log(`[error] An error occurred during comparison for item:`, error);
          // 跳过失败项，继续执行下一项
          continue;
        }
      }

      const consoleText = modelList
        .map(
          (model) =>
            `${model}正确率${formatPercentage(finalResult[model] / finalResult.copilot)}（${
              finalResult[model]
            }/${finalResult.copilot}）`
        )
        .join('\n');
      // 把结果写入到result.txt文件中
      fs.appendFileSync(
        'file/modelRes/result.txt',
        `[finalResult] ${fileName}.json ${finalResult.copilot}条续写片段，
  模型输入顺序：${modelList}
  ${consoleText}\n`
      );

      // 调整顺序，并继续执行
      modelList = [...modelList.slice(1), modelList[0]];
    }
    modelList = originalModelList;
  }
}
