async function processSSE(response) {
  let streams = await response.body();
  streams.setEncoding('utf8');
  let result = '';
  let finishReason = '';
  e: for await (let stream of streams) {
    let chunks = stream.split(`data: `);
    for (const chunk of chunks) {
      let line = chunk.trim();
      if (line === '') continue;
      else if (line === '[DONE]') break e;
      try {
        // Remove 'data: ' prefix and parse the JSON
        const json = JSON.parse(line);

        // 兼容流式数据格式
        if (json.choices && json.choices[0]?.text) {
          result += json.choices[0].text;
        } else if (json.choices && json.choices[0]?.delta?.content) {
          result += json.choices[0].delta.content;
        }

        // 读取结束续写原因，用于分析续写质量
        if (json.choices[0]?.finish_reason) {
          finishReason = json.choices[0]?.finish_reason;
        }
      } catch (error) {
        // console.error('Error parsing JSON:', error);
      }
    }
  }
  return { result, finishReason };
}
async function processSSE2(response) {
  const reader = response.body.getReader();
  let result = '';
  const decoder = new TextDecoder('utf-8');
  let done = false;
  let finishReason = '';
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;

    if (value) {
      const dataString = decoder.decode(value, { stream: true });
      const lines = dataString.split('\n');
      for (const line of lines) {
        if (line.trim() === 'data: [DONE]') {
          break;
        }
        if (line.startsWith('data: ')) {
          try {
            // Remove 'data: ' prefix and parse the JSON
            const json = JSON.parse(line.slice(6));

            if (json.choices && json.choices[0]?.text) {
              result += json.choices[0].text;
            } else if (json.choices && json.choices[0]?.delta?.content) {
              result += json.choices[0].delta.content;
            }
            if (json.choices[0]?.finish_reason) {
              finishReason = json.choices[0]?.finish_reason;
            }
          } catch (error) {
            // console.error('Error parsing JSON:', error);
          }
        }
      }
    }
  }
  return { result, finishReason };
}

const fetchReq = fetch('https://hithink-oslm.myhexin.com/codeqwen/v1/completions', {
  method: 'post',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt:
      '<fim_prefix>// Language: javascript\n// 用js生成快排代码\n// 1. 选择一个基准元素\nfunction a() {\n<fim_suffix>}<fim_middle>',
    max_tokens: 50,
    temperature: 0.2,
    top_p: 1,
    n: 1,
    stop: ['\n'],
    details: true,
    model: 'CodeQwen1.5-7B',
    stream: true,
  }),
});
const cloneResponse = async (response) => {
  const clonedResponse = response.clone();
  return {
    original: await response.json(),
    cloned: await clonedResponse.json(),
  };
};
const original = fetchReq.then(cloneResponse).then((data) => data.original);
const duplicate = fetchReq.then(cloneResponse).then((data) => data.cloned);

original
  .then(async (response) => {
    return await processSSE2(response);
  })
  .then((streamResult) => {
    console.log('streamResult', streamResult);
  })
  .catch((error) => {
    console.error(`[qwen]--- Error:`, error);
  });
setTimeout(() => {
  duplicate
    .then(async (response) => {
      return await processSSE2(response);
    })
    .then((streamResult) => {
      console.log('streamResult2', streamResult);
    })
    .catch((error) => {
      console.error(`[qwen]--- Error:`, error);
    });
}, 3000);
