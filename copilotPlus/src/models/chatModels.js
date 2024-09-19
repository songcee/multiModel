/**
 * chat模型
 */
async function qwenModel(prompt) {
  try {
    const res = await fetch('http://hithink-oslm.myhexin.com/qwen2/v1/chat/completions', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen2-72B-RLHF',
        messages: [
          {
            content: prompt,
            role: 'system',
          },
        ],
        frequency_penalty: 0,
        max_tokens: 16,
        presence_penalty: 0,
        response_format: {
          type: 'text',
        },
        stop: null,
        stream: false,
        stream_options: null,
        temperature: 1,
        top_p: 1,
        tools: null,
        tool_choice: 'none',
        logprobs: false,
        top_logprobs: null,
      }),
    });
    const data = await res.json();
    return data?.choices[0]?.message?.content;
  } catch (error) {
    return 1;
  }
}

async function deepseekModel(prompt) {
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer sk-34293bf02fb34c35be062c520f849423',
      },
      body: JSON.stringify({
        model: 'deepseek-coder',
        messages: [
          {
            content: prompt,
            role: 'system',
          },
        ],
        frequency_penalty: 0,
        max_tokens: 16,
        presence_penalty: 0,
        response_format: {
          type: 'text',
        },
        stop: null,
        stream: false,
        stream_options: null,
        temperature: 1,
        top_p: 1,
        tools: null,
        tool_choice: 'none',
        logprobs: false,
        top_logprobs: null,
      }),
    });
    const data = await res.json();
    return data?.choices[0]?.message?.content;
  } catch (error) {
    return 1;
  }
}
export { qwenModel, deepseekModel };
