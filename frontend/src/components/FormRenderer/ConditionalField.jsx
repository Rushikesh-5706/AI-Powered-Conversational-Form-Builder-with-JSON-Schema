import React from 'react';

function ConditionalField(props) {
  const { schema, uiSchema, name, registry } = props;
  const { formContext } = registry;

  // x-show-when is a custom extension that conditionally hides this field
  // based on the current value of another field in the form.
  // The root form data is passed via formContext from the parent Form component.
  const rootFormData = formContext && formContext.formData ? formContext.formData : {};
  const condition = schema['x-show-when'];

  let isVisible = true;
  if (condition && condition.field) {
    isVisible = rootFormData[condition.field] === condition.equals;
  }

  // Strip our custom ui:field to avoid infinite recursion when SchemaField renders
  const uiSchemaWithoutField = { ...uiSchema };
  delete uiSchemaWithoutField['ui:field'];

  const SchemaField = registry.fields.SchemaField;

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }} data-testid={`field-${name}`}>
      <SchemaField
        {...props}
        uiSchema={uiSchemaWithoutField}
      />
    </div>
  );
}

export default ConditionalField;
