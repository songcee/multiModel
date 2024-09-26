// 因为modelRes中的文件过大，所以需要随机获取100条数据进行比较
import fs from 'fs';

const fileName = 'java_result';

const resStr = fs.readFileSync(`file/modelRes/${fileName}.json`, 'utf8');
const resArr = JSON.parse(resStr);
const resLength = resArr.length;
// 从resArr中随机获取100条数据
const randomResArr = [];
for (let i = 0; i < 100; i++) {
  const randomIndex = Math.floor(Math.random() * resLength);
  randomResArr.push(resArr[randomIndex]);
}

// 写入到文件中
fs.writeFileSync(`file/modelRes/zrandom_${fileName}.json`, JSON.stringify(randomResArr));
