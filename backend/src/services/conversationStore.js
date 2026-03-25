const { v4: uuidv4 } = require('uuid');

const store = new Map();

function getConversation(id) {
  return store.get(id) || null;
}

function createConversation() {
  const id = uuidv4();
  const conversation = {
    id,
    history: [],
    currentSchema: null,
    version: 0
  };
  store.set(id, conversation);
  return conversation;
}

function updateConversation(id, updates) {
  const conversation = store.get(id);
  if (conversation) {
    const updated = { ...conversation, ...updates };
    store.set(id, updated);
    return updated;
  }
  return null;
}

function deleteConversation(id) {
  return store.delete(id);
}

module.exports = {
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation
};
