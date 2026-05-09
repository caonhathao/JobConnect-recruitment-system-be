const { Ollama } = require("ollama");

//create new connection to ollama server at localhost:11434
const ollama = new Ollama({
  host: "http://localhost:11434",
});

/**
 *
 * @param {String} prompt
 * @returns String
 */
async function textGeneration(prompt) {
  try {
    const response = await ollama.chat({
      model: "qwen2.5:3b",
      messages: [
{
          role: "system",
          content: `Bạn là trợ lý ảo của JobConnect. 
          Nhiệm vụ:
          1. Chỉ sử dụng thông tin trong danh sách công việc được cung cấp để trả lời.
          2. Nêu rõ: Tiêu đề, Công ty, Mức lương, Địa điểm.
          3. Trả lời bằng tiếng Việt. 
          4. Nếu dữ liệu không liên quan đến câu hỏi, hãy báo không tìm thấy, không tự chế thông tin.`
        },
        { role: "user", content: prompt },
      ],
      options: {
        temperature: 0.7,
        num_ctx: 8192,
      },
    });
    return response.message.content;
  } catch (error) {
    console.error("Lỗi khi gọi Ollama API:", error);
    return "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
  }
}

module.exports = {
  textGeneration,
};
