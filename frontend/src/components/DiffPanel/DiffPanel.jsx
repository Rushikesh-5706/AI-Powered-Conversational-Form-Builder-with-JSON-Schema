import React from 'react';
import { diff } from 'deep-diff';
import { useAppContext } from '../../context/AppContext';

function DiffPanel() {
  const { state } = useAppContext();

  // Hidden when version < 2
  if (state.version < 2 || !state.previousSchema) {
    return <div data-testid="schema-diff-panel" style={{ display: 'none' }}></div>;
  }

  const diffs = diff(state.previousSchema, state.currentSchema);

  const getDiffText = () => {
    if (!diffs || diffs.length === 0) {
      return <div>No changes detected.</div>;
    }

    return diffs.map((d, index) => {
      // The path array joined with dot
      const pathStr = d.path ? d.path.join('.') : '';
      let text = '';
      let className = '';

      if (d.kind === 'N') {
        text = `+ ${pathStr}`;
        className = 'diff-add';
      } else if (d.kind === 'D') {
        text = `- ${pathStr}`;
        className = 'diff-del';
      } else if (d.kind === 'E') {
        text = `~ ${pathStr}`;
        className = 'diff-edit';
      } else if (d.kind === 'A') {
        text = `~ ${pathStr}[${d.index}]`;
        className = 'diff-edit';
      }

      return (
        <div key={index} className={className}>
          {text}
        </div>
      );
    });
  };

  return (
    <div className="schema-diff-panel" data-testid="schema-diff-panel">
      <h3>Schema Diffs (v{state.version})</h3>
      {getDiffText()}
    </div>
  );
}

export default DiffPanel;
