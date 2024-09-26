## 简介
该模块使用copilot采纳的数据集作为源数据，自动调用不同续写模型并记录结果，通过chat模型按照copilot的采纳片段作为正确答案评价续写内容的有效性

## 运行
1、读取file/cleanCode中的文件并调用多模型返回续写内容

    可修改变量：completionLlmList、chatLlmList、readFileList、maxlength、requestInterval
    执行命令：node index.js
2、读取file/modelRes中的文件并追加调用新模型，写入续写内容

    可修改变量：completionLlmList、chatLlmList、readFileList、maxlength、requestInterval
    执行命令：node additionalModel.js

3、调用chat模型对file/modelRes中的续写结果做评分

    可修改变量：fileName、modelSort
    执行命令：node compareModel.js

## 入口文件说明
<b>index.js</b>

    场景：读取源数据并快速调用模型生成结果集
    说明：通过读取file/cleanCode中的文件，调用不同续写模型并把续写结果写入file/modelRes同名文件下，注意：每次调用脚本为覆盖式，会丢失原有数据。

<b>additionalModel.js</b>

    场景：读取结果集中的数据，并追加调用新模型并记入结果
    说明：通过读取file/modelRes中的文件，调用新的模型并在原有数据中记入新模型的结果，注意：每次调用结果只增加新模型的内容，不会影响原有数据。

<b>compareModel.js</b>

    场景：通过chat模型比较续写结果与copilot结果的相识性
    说明：通过读取file/modelRes中的文件，，以copilot的采纳片段作为正确答案，调用chat模型完成相似性比较。