/**
 * chat模型
 */
function qwenModel(data) {
  return fetch("http://hithink-oslm.myhexin.com/qwen2/v1/chat/completions", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Qwen2-72B-RLHF",
      messages: data.myMessage || generatePrompt(data),
      frequency_penalty: 0,
      max_tokens: 128,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
      stop: null,
      stream: false,
      stream_options: null,
      temperature: 1,
      top_p: 1,
      tools: null,
      tool_choice: "none",
      logprobs: false,
      top_logprobs: null,
    }),
  });
}
function deepseekModel(data) {
  return fetch("https://api.deepseek.com/chat/completions", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer sk-e869cdf4837a4e0393673874646fa2f9",
    },
    body: JSON.stringify({
      model: "deepseek-coder",
      messages: data.myMessage || generatePrompt(data),
      frequency_penalty: 0,
      max_tokens: 128,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
      stop: null,
      stream: false,
      stream_options: null,
      temperature: 1,
      top_p: 1,
      tools: null,
      tool_choice: "none",
      logprobs: false,
      top_logprobs: null,
    }),
  });
}
function generatePrompt(data) {
  return [
    {
      role: "system",
      content: `You are an intelligent programmer. You are helping a colleague insert a piece of code in a file.

Your colleague is going to give you a file and an insertion point, along with a set of instructions. Please write code at the insertion point following their instructions.

Think carefully and critically about the code to insert that best follows their instructions.

Be mindful of the surrounding code, especially the indentation level. If you need to import something but cannot at the insertion point, please omit the import statements.

The user has requested that the following rules always be followed. Note that only some of them may be relevant to this request:`,
    },
    {
      role: "user",
      content: `First, I will give you some potentially helpful context about my code.

Then, I will show you the insertion point and give you the instruction. The insertion point will be in \`multiModel/copilotPlus/src/util.js\`.

## Potentially helpful context
${getRelevantFile(data)}

This is my current file. The insertion point will be denoted by the comments: Start Generation Here and End Generation Here
\`\`\`
${getCurrentFile(data)}
\`\`\`

`,
    },
    {
      role: "user",
      content: `
## Instructions

### Generation Prompt

{chat中的实际指令}

## Your Task

Generate the code to be inserted in accordance with the instructions.

Please format your output as:
\`\`\`
// Start Generation Here
// INSERT_YOUR_CODE
// End Generation Here
\`\`\`

Immediately start your response with \`\`\``,
    },
  ];

  function getRelevantFile(data) {
    if (!data.relevantFile) return "";
    const [firstLine, ...restLines] = data.relevantFile.split("\n");
    const fileName = firstLine.replace("<file_path>", "");
    const fileCode = restLines.join("\n");
    return `#### file_context_0
${fileName} from line 1:
\`\`\`
${fileCode}
\`\`\`
`;
  }
  function getCurrentFile(data) {
    return `
\`\`\`${data.filePath}
${data.prefix}
//Start Generation Here
//End Generation Here
${data.suffix}
\`\`\`
`;
  }
}

export default { qwenModel, deepseekModel };
