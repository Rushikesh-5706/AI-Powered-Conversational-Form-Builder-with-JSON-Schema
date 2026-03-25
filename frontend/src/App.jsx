import React from 'react';
import ChatPane from './components/ChatPane/ChatPane';
import FormRenderer from './components/FormRenderer/FormRenderer';
import DiffPanel from './components/DiffPanel/DiffPanel';
import ExportPanel from './components/ExportPanel/ExportPanel';

function App() {
  return (
    <div className="app-layout">
      <ChatPane />
      <div className="right-pane">
        <FormRenderer />
        <DiffPanel />
        <ExportPanel />
      </div>
    </div>
  );
}

export default App;
