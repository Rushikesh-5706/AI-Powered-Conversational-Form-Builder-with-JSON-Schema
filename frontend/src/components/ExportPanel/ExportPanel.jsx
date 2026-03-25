import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

function ExportPanel() {
  const { state } = useAppContext();
  const [copiedMsg, setCopiedMsg] = useState(null);

  const showCopied = (btn) => {
    setCopiedMsg(btn);
    setTimeout(() => {
      setCopiedMsg(null);
    }, 2000);
  };

  const handleExportJSON = () => {
    if (!state.currentSchema) return;
    const blob = new Blob([JSON.stringify(state.currentSchema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-schema.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCopyCode = async () => {
    if (!state.currentSchema) return;
    const codeSnippet = `import React from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const schema = ${JSON.stringify(state.currentSchema, null, 2)};

export default function MyForm() {
  return (
    <Form
      schema={schema}
      validator={validator}
      onSubmit={(e) => console.log('submitted', e.formData)}
    />
  );
}`;
    
    try {
      await navigator.clipboard.writeText(codeSnippet);
      showCopied('code');
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleCopyCurl = async () => {
    // Use the most recent user prompt for the curl command, or a default if none exists yet
    const lastUserMessage = state.messages.slice().reverse().find(m => m.role === 'user');
    const promptText = lastUserMessage ? lastUserMessage.content : "A simple contact form";
    
    const curlSnippet = `curl -X POST http://localhost:8080/api/form/generate \\
-H "Content-Type: application/json" \\
-d '{"prompt": "${promptText.replace(/'/g, "\\'")}"}'`;

    try {
      await navigator.clipboard.writeText(curlSnippet);
      showCopied('curl');
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const hasSchema = !!state.currentSchema;

  return (
    <div className="export-panel" data-testid="export-panel">
      <button 
        data-testid="export-json-button" 
        onClick={handleExportJSON}
        disabled={!hasSchema}
      >
        Export JSON
      </button>
      
      <button 
        data-testid="copy-code-button" 
        onClick={handleCopyCode}
        disabled={!hasSchema}
      >
        {copiedMsg === 'code' ? 'Copied!' : 'Copy React Code'}
      </button>
      
      <button 
        data-testid="copy-curl-button" 
        onClick={handleCopyCurl}
      >
        {copiedMsg === 'curl' ? 'Copied!' : 'Copy cURL'}
      </button>
    </div>
  );
}

export default ExportPanel;
