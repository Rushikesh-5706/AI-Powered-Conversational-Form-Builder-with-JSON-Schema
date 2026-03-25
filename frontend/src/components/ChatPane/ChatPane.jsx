import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

function ChatPane() {
  return (
    <div className="chat-pane" data-testid="chat-pane">
      <MessageList />
      <MessageInput />
    </div>
  );
}

export default ChatPane;
