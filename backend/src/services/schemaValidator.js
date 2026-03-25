const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function validateSchema(schemaObject) {
  if (!schemaObject || typeof schemaObject !== 'object') {
    return { valid: false, errors: ['Schema must be an object.'] };
  }

  if (schemaObject.$schema !== 'http://json-schema.org/draft-07/schema#') {
    return { valid: false, errors: ['Schema must use Draft 7 meta-schema ($schema property).'] };
  }

  if (schemaObject.type !== 'object') {
    return { valid: false, errors: ['Schema type must be "object".'] };
  }

  if (!schemaObject.properties || typeof schemaObject.properties !== 'object') {
    return { valid: false, errors: ['Schema must have a "properties" object.'] };
  }

  try {
    ajv.compile(schemaObject);
    return { valid: true };
  } catch (err) {
    return { valid: false, errors: [err.message] };
  }
}

module.exports = {
  validateSchema
};
