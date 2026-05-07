/**
 * using @xenova/transformers to generate text embeddings for job descriptions and other relevant information. 
 * This will allow us to create a vector representation of the job data, which can be used for various downstream tasks such as similarity search, clustering, or as input features for machine learning models.
 * The getEmbedding function takes a text input, processes it through the feature extraction pipeline using a pre-trained model (in this case, 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'), and returns the resulting embedding as an array of numbers.
 * This embedding can then be stored in a database or used directly for tasks like job matching or recommendation systems.
 */
require('dotenv').config();
const { InferenceClient } = require("@huggingface/inference");

// Khởi tạo client với Token từ Hugging Face (nên để trong .env)
const client = new InferenceClient(process.env.HF_TOKEN);

const getEmbedding = async (text) => {
  try {
    const output = await client.featureExtraction({
      model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
      inputs: text,
    });
    
    // Output trả về từ API thường là mảng vector (Array of numbers)
    return output; 
  } catch (error) {
    console.error("Lỗi gọi Hugging Face API:", error);
    return null;
  }
};

module.exports = {
  getEmbedding,
};