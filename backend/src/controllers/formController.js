const conversationStore = require('../services/conversationStore');
const groqService = require('../services/groqService');
const schemaValidator = require('../services/schemaValidator');
const config = require('../config');
const prompts = require('../utils/prompts');

async function generate(req, res, next) {
  try {
    const { prompt, conversationId } = req.body;
    const mock_llm_failure = parseInt(req.query.mock_llm_failure, 10);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    let conversation;
    let currentConversationId = conversationId;

    if (currentConversationId) {
      conversation = conversationStore.getConversation(currentConversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
    } else {
      conversation = conversationStore.createConversation();
      currentConversationId = conversation.id;
    }

    conversation.history.push({ role: 'user', content: prompt });
    conversationStore.updateConversation(currentConversationId, { history: conversation.history });

    const maxAttempts = config.maxRetries + 1;
    let attemptNumber = 1;
    let lastValidationError = null;

    while (attemptNumber <= maxAttempts) {
      // Build the message history for this specific attempt without mutating the stored history
      let currentHistory = [...conversation.history];

      if (attemptNumber > 1 && lastValidationError) {
        currentHistory.push({
          role: 'user',
          content: `Your previous response failed validation with this error: ${lastValidationError}. Please correct your response and try again. Return only valid JSON matching the required schema.`
        });
      }

      let llmResponse;

      if (!isNaN(mock_llm_failure) && mock_llm_failure >= attemptNumber) {
        llmResponse = { broken: true, notASchema: 'intentionally invalid' };
      } else {
        llmResponse = await groqService.callGroq(currentHistory, prompts.systemPrompt);
      }

      if (llmResponse.type === 'clarification') {
        const assistantMsg = { role: 'assistant', content: JSON.stringify(llmResponse) };
        conversation.history.push(assistantMsg);
        conversationStore.updateConversation(currentConversationId, { history: conversation.history });
        
        return res.status(200).json({
          status: 'clarification_needed',
          conversationId: currentConversationId,
          questions: llmResponse.questions
        });
      } else if (llmResponse.type === 'form') {
        const validationResult = schemaValidator.validateSchema(llmResponse.schema);
        
        if (validationResult.valid) {
          const assistantMsg = { role: 'assistant', content: JSON.stringify(llmResponse) };
          conversation.history.push(assistantMsg);
          conversation.version += 1;
          conversation.currentSchema = llmResponse.schema;
          
          conversationStore.updateConversation(currentConversationId, { 
            history: conversation.history,
            version: conversation.version,
            currentSchema: conversation.currentSchema
          });
          
          return res.status(200).json({
            formId: currentConversationId,
            conversationId: currentConversationId,
            version: conversation.version,
            schema: llmResponse.schema
          });
        } else {
          lastValidationError = validationResult.errors.join(', ');
          attemptNumber++;
        }
      } else {
        lastValidationError = 'Response must have a "type" of "form" or "clarification".';
        attemptNumber++;
      }
    }

    // All retry attempts failed — return error to client
    console.error('Max retries exhausted for form generation');
    return res.status(500).json({ error: 'Failed to generate valid schema after multiple attempts.' });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  generate
};
