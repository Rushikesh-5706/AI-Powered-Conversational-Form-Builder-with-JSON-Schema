import React, { useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function MessageInput() {
  const [prompt, setPrompt] = useState('');
  const { state, dispatch } = useAppContext();

  const handleSubmit = async () => {
    if (!prompt.trim() || state.isLoading) return;

    const currentPrompt = prompt;
    setPrompt('');

    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: currentPrompt, type: 'text' } });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const payload = { prompt: currentPrompt };
      if (state.conversationId) {
        payload.conversationId = state.conversationId;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const mockFail = urlParams.get('mock_llm_failure');
      const queryStr = mockFail ? `?mock_llm_failure=${mockFail}` : '';

      const response = await axios.post(`${API_BASE}/api/form/generate${queryStr}`, payload);

      if (response.data.status === 'clarification_needed') {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: 'assistant',
            content: 'Clarification needed',
            type: 'clarification',
            questions: response.data.questions
          }
        });
        if (!state.conversationId) {
          dispatch({ type: 'SET_CONVERSATION_ID', payload: response.data.conversationId });
        }
      } else if (response.data.schema) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { role: 'assistant', content: 'Schema generated', type: 'schema' }
        });
        dispatch({
          type: 'SET_SCHEMA',
          payload: { schema: response.data.schema, version: response.data.version }
        });
        if (!state.conversationId) {
          dispatch({ type: 'SET_CONVERSATION_ID', payload: response.data.conversationId });
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      let errMsg = 'An error occurred while generating the form.';
      if (error.response && error.response.data && error.response.data.error) {
        errMsg = error.response.data.error;
      }
      dispatch({ type: 'SET_ERROR', payload: errMsg });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="message-input-container">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the form you want to build..."
        disabled={state.isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || state.isLoading}
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;
