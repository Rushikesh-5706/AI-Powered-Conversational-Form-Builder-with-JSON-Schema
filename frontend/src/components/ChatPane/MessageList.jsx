import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';

function MessageList() {
  const { state } = useAppContext();
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [state.messages]);

  return (
    <div className="message-list" ref={listRef}>
      {state.messages.map((msg, idx) => (
        <div key={idx} className={`message ${msg.role}`}>
          {msg.role === 'user' ? (
            <p>{msg.content}</p>
          ) : (
            msg.type === 'clarification' ? (
              <div>
                <p>I need more clarification to build the form:</p>
                <ul>
                  {msg.questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            ) : msg.type === 'error' ? (
              <p style={{ color: '#dc2626' }}>{msg.content}</p>
            ) : (
              <p>Form updated successfully.</p>
            )
          )}
        </div>
      ))}
      {state.isLoading && <div className="message assistant"><p>Thinking...</p></div>}
      {state.error && <div className="message assistant"><p style={{ color: '#dc2626' }}>{state.error}</p></div>}
    </div>
  );
}

export default MessageList;
