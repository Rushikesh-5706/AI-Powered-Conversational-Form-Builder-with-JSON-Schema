import React, { useState } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { useAppContext } from '../../context/AppContext';
import ConditionalField from './ConditionalField';

function CustomFieldTemplate(props) {
  const { id, classNames, label, help, required, description, errors, children, name, uiSchema } = props;

  // Only add data-testid for fields that are NOT handled by ConditionalField.
  // ConditionalField adds its own data-testid wrapper to avoid duplicate attributes.
  const isConditional = uiSchema && uiSchema['ui:field'] === 'ConditionalField';
  const testIdProps = isConditional ? {} : { 'data-testid': `field-${name || id}` };

  return (
    <div className={classNames} {...testIdProps} style={{ marginBottom: '1rem' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {label}{required ? '*' : null}
        </label>
      )}
      {description && (
        <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '0.5rem' }}>
          {description}
        </div>
      )}
      {children}
      {errors}
      {help}
    </div>
  );
}

function FormRenderer() {
  const { state } = useAppContext();
  const [formData, setFormData] = useState({});

  if (!state.currentSchema) {
    return (
      <div className="form-renderer-pane" data-testid="form-renderer-pane">
        <p>Your form will appear here once you describe it in the chat.</p>
      </div>
    );
  }

  const buildUiSchema = (schema) => {
    const uiSchema = {};
    if (schema && schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        const prop = schema.properties[key];
        if (prop['x-show-when']) {
          uiSchema[key] = { 'ui:field': 'ConditionalField' };
        }
      });
    }
    return uiSchema;
  };

  const uiSchema = buildUiSchema(state.currentSchema);

  return (
    <div className="form-renderer-pane" data-testid="form-renderer-pane">
      <Form
        schema={state.currentSchema}
        validator={validator}
        uiSchema={uiSchema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        onSubmit={() => {}}
        fields={{ ConditionalField }}
        templates={{ FieldTemplate: CustomFieldTemplate }}
        formContext={{ formData }}
      />
    </div>
  );
}

export default FormRenderer;
