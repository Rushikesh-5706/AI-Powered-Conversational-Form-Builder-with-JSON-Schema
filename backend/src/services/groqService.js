const Groq = require('groq-sdk');
const config = require('../config');
const prompts = require('../utils/prompts');

const client = new Groq({ apiKey: config.llmApiKey });

async function callGroq(conversationHistory, systemPrompt) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...prompts.buildUserMessages(conversationHistory)
    ];

    const completion = await client.chat.completions.create({
      model: config.groqModel,
      messages: messages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4096
    });

    let rawContent = completion.choices[0].message.content;
    
    // Defensively strip markdown if present despite json_object response format
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      const parsedObject = JSON.parse(rawContent);
      return parsedObject;
    } catch (parseError) {
      throw new Error('LLM returned non-JSON response');
    }
  } catch (error) {
    if (error.message === 'LLM returned non-JSON response') {
      throw error;
    }
    throw new Error(`Groq API Error: ${error.message}`);
  }
}

module.exports = {
  callGroq
};
