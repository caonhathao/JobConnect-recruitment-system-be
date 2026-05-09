const prisma = require("../config/prisma");
const { textGeneration } = require("../lib/models/connect.models");
const { cleaningText } = require("../utils/preprocessing/textCleaner");
const { textEmbedding } = require("../utils/preprocessing/textEmbedding");
const {
  textStandardization,
} = require("../utils/preprocessing/textStandardization");
const process = require("node:process");
/**
 * This service will:
 * - Clean and standardize question from client (user).
 * - Semantic searching to find the most relevant job descriptions and other relevant information from the database.
 * - Packing and send all to model to generate answer.
 * - Return the answer to client.
 *
 * The main goal of this service is to handle all the logic related to job chat, including processing user queries, retrieving relevant job information, and generating responses based on that information. This service will act as a bridge between the user's input and the underlying data and models that power the job chat functionality.
 */

/**
 *
 * @param {String} question
 */
exports.chat = async (question) => {
  /**
   * first, we will clean and standardize the question from client (user).
   */

  const vectorizationQuestion = await textEmbedding(
    textStandardization(cleaningText(question)),
  );

  if (!vectorizationQuestion) {
    return "Xin lỗi, tôi không thể xử lý câu hỏi của bạn. Vui lòng thử lại sau.";
  }
  /**
   * Now we will search in the database by raw SQL.
   * and join with full information.
   */
  const MIN_SIMILARITY_SCORE = parseFloat(
    process.env.MIN_SIMILARITY_SCORE || "0.3",
  ); // You can adjust this threshold based on your needs
  const embeddingString = `[${vectorizationQuestion.join(",")}]`;
  const results = await prisma.$queryRaw`
    SELECT 
        j.id, 
        j.title, 
        j.description, 
        j.salary_min as "salaryMin", 
        j.salary_max as "salaryMax", 
        j.location, 
        j.job_type as "jobType",
        c.name as "companyName", 
        c.address as "companyAddress",
        c.city as "companyCity",
        1 - (v.embedding <=> ${embeddingString}::vector) AS similarity
    FROM "jobs" j
    JOIN "job_vectors" v ON j.id = v.job_id
    JOIN "companies" c ON j.company_id = c.id
    WHERE 1 - (v.embedding <=> ${embeddingString}::vector) > ${MIN_SIMILARITY_SCORE}
    ORDER BY v.embedding <=> ${embeddingString}::vector ASC
    LIMIT 3;
`;

  console.log("Results from vector search:", results);
  if (results.length === 0) {
    return "Xin lỗi, tôi không tìm thấy thông tin nào liên quan đến câu hỏi của bạn. Vui lòng thử lại với câu hỏi khác hoặc cung cấp thêm chi tiết.";
  }

  //clean the results to make it more readable for the model.
  const cleanResults = results.map((job) => ({
    "Vị trí": job.title,
    "Công ty": job.companyName,
    "Mức lương": `${job.salaryMin} - ${job.salaryMax} USD`,
    "Địa điểm": `${job.companyAddress??""}, ${job.companyCity}`,
    "Mô tả": job.description,
    "Độ phù hợp": Math.round(job.similarity * 100) + "%",
  }));
  const prompt = `Danh sách công việc (Dưới dạng JSON):\n${JSON.stringify(cleanResults, null, 2)}\n\nCâu hỏi của người dùng:\n${question}\n\n`;
  const response = await textGeneration(prompt);
  return response;
};

/**
 *
 * @param {String} userId
 * @returns
 */
exports.history = async (userId) => {
  const history = await prisma.userChat.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
  });
  return history;
};
