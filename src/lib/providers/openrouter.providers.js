const promptTemplate = require("./_prompt.models");
const { messageResponse, TYPE } = require("../../utils/format/response.format");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "JobConnect",
  },
});

/**
 *
 * @param {String} prompt
 * @param {number} template
 * @returns {Promise<Record<String,String>>}
 */
async function openrouterGeneration(prompt, template) {
  console.log("Received prompt:", prompt);
  console.log("Received template:", template);
  try {
    const response = await openai.chat.completions.create({
      model: "openrouter/free",
      //   model: "qwen/qwen3-next-80b-a3b-instruct:free",
      messages: [
        promptTemplate[template || 0],
        { role: "user", content: prompt },
      ],
      options: {
        temperature: 0.7,
        num_ctx: 8192,
        top_p: 0.9,
        presence_penalty: 0.2,
      },
      stream: false,
    });
    const content = response.choices[0].message.content;
    console.log("Raw response from OpenRouter API:", content);

    const formatResult = JSON.parse(
      content
        .replace(/```json/g, "") // Loại bỏ ```json
        .replace(/```/g, "") // Loại bỏ dấu ``` đóng
        .trim(),
    );
    return messageResponse(TYPE.success, "", formatResult);
  } catch (error) {
    console.error("Lỗi khi gọi OpenRouter API:", error);
    return messageResponse(
      TYPE.failed,
      "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
    );
  }
}

module.exports = {
  openrouterGeneration,
};
