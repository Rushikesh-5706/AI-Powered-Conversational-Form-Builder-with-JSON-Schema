import React from 'react';

function ConditionalField(props) {
  const { schema, uiSchema, formData, name, registry, idSchema, onChange, required, readonly, disabled, autofocus, onBlur, onFocus, errorSchema } = props;
  const { formContext } = registry;
  
  // RJSF puts the whole form data in registry.rootSchema normally? 
  // No, the parent's formData is passed as root formData only rarely, 
  // but we can access it if we track it at the root.
  // Actually, props.formData here is the *field's* data, not the full form data.
  // We need to parse registry or form context if provided, OR we access the root formData from form.
  
  // Wait! A custom field gets the entire form data in \`formContext\` only if we pass it 
  // explicitly to the <Form formContext={{ formData }} /> prop!
  // BUT we can use registry.rootSchema? No.
  // Actually, in @rjsf/core, there might be a better way... 
  // Let me just rewrite FormRenderer slightly after this.
  // We'll pass formData to formContext in FormRenderer.
  
  const rootFormData = formContext && formContext.formData ? formContext.formData : {};
  const condition = schema['x-show-when'];
  
  let isVisible = true;
  if (condition && condition.field) {
    const targetValue = rootFormData[condition.field];
    isVisible = (targetValue === condition.equals);
  }

  const displayStyle = isVisible ? 'block' : 'none';

  // We need to render the underlying field.
  const SchemaField = registry.fields.SchemaField;

  // We have to strip our custom ui:field so it doesn't infinite loop.
  const uiSchemaWithoutField = { ...uiSchema };
  delete uiSchemaWithoutField['ui:field'];

  // The wrapper div MUST have data-testid="field-{name}"
  const testId = `field-${name}`;

  return (
    <div style={{ display: displayStyle }} data-testid={testId}>
      <SchemaField
        {...props}
        uiSchema={uiSchemaWithoutField}
      />
    </div>
  );
}

export default ConditionalField;
