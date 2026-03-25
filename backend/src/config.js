require('dotenv').config();

const config = {
  port: parseInt(process.env.API_PORT, 10) || 8080,
  llmApiKey: process.env.LLM_API_KEY,
  groqModel: 'llama-3.3-70b-versatile',
  maxRetries: 2,
};

if (!config.llmApiKey) {
  console.error('Fatal: LLM_API_KEY environment variable is not set.');
  process.exit(1);
}

module.exports = config;
