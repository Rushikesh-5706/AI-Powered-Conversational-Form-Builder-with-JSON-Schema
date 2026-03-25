# AI-Powered Conversational Form Builder

This project is a dynamic, multi-turn conversational AI form builder that leverages JSON Schema to render complete forms based on user prompts. Built to solve the complexity of manual form creation, it allows users to simply describe what they need and instantly receive a fully functional, validated form. The system is designed to handle ambiguity by proactively asking clarifying questions, iterating on previous schemas rather than starting from scratch, and providing a robust visualization of schema changes over time.

## Architecture Overview

\`\`\`text
   +-------------+       +-------------+       +-------------------+
   |             |       |             |       |                   |
   |   Browser   | ----> |    Nginx    | ----> |   React Frontend  |
   |             |       |  (frontend) |       |   (Vite + RJSF)   |
   +-------------+       +-------------+       +-------------------+
          |                                              |
          | HTTP POST /api/form/generate                 |
          v                                              v
   +-------------+       +-------------+       +-------------------+
   |             |       |             |       |                   |
   | Express API | <---- |   In-Memory | ----> |  Schema Validator |
   |  (Backend)  | ----> | Conversation|       |    (AJV + Draft 7)|
   |             |       |    Store    |       |                   |
   +-------------+       +-------------+       +-------------------+
          |
          | Groq SDK (llama-3.3-70b-versatile)
          v
   +-------------+
   |             |
   |  Groq API   |
   |             |
   +-------------+
\`\`\`

The architecture is split into a robust backend and a highly dynamic frontend. The React frontend is served natively during development via Vite and statically via Nginx in production Docker. User prompts are sent to the Express API, which maintains an in-memory conversation store keyed by UUIDs. The backend communicates with the Groq API to generate JSON Schema Draft 7 documents. A critical layer of the architecture is the validator—if the LLM hallucinates an invalid schema, the Express layer automatically catches it and retries up to three times with the contextual error.

## Technology Choices

| Layer | Technology | Reason |
|-------|------------|--------|
| Backend | Node.js + Express.js | Lightweight, fast execution, excellent ecosystem for API middleware. |
| LLM API | Groq SDK (llama-3.3) | High-speed inference, powerful instruction-following, reliable JSON output. |
| Validation | AJV + ajv-formats | Industry standard for JSON Schema Draft 7 validation. |
| Frontend | React 18 + Vite | Rapid development, strong component ecosystem, fast hot-reloading. |
| Form Rendering | @rjsf/core | Generates complex UI automatically from JSON Schema with validation. |
| State Management | Context API + useReducer | Sufficient for this app complexity without the overhead of Redux. |
| Schema Diffs | deep-diff | Accurate detection of structural changes between JSON objects. |

## Project Structure

\`\`\`text
AI-Powered-Conversational-Form-Builder-with-JSON-Schema/
├── docker-compose.yml       # Orchestrates frontend and backend containers
├── README.md                # Comprehensive project documentation
├── .gitignore               # Root level ignore file
├── backend/
│   ├── Dockerfile           # Backend container definition
│   ├── .dockerignore        # Excludes node_modules and logs from build
│   ├── .env.example         # Template for environment variables
│   ├── package.json         # Backend dependencies
│   ├── src/
│   │   ├── index.js         # Entry point, starts Express server
│   │   ├── config.js        # Loads and validates environment variables
│   │   ├── routes/          # API route definitions (health, form)
│   │   ├── controllers/     # Request handling logic
│   │   ├── services/        # Groq API, conversation store, validators
│   │   └── utils/           # System prompt and LLM message builders
└── frontend/
    ├── Dockerfile           # Multi-stage Nginx build for frontend
    ├── .dockerignore        # Excludes local artifacts from build
    ├── package.json         # Frontend UI dependencies
    ├── vite.config.js       # Vite configuration with API proxying
    ├── index.html           # React root HTML
    └── src/
        ├── main.jsx         # React DOM entry point
        ├── App.jsx          # Main application layout component
        ├── context/         # React Context and useReducer store
        ├── components/      # ChatPane, FormRenderer, DiffPanel, ExportPanel
        └── styles/          # Vanilla CSS Grid styling
\`\`\`

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Groq API Key

## Quickstart (One-Command Startup)

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/Rushikesh-5706/AI-Powered-Conversational-Form-Builder-with-JSON-Schema.git
   cd AI-Powered-Conversational-Form-Builder-with-JSON-Schema
   \`\`\`
2. Set up your environment variables:
   Copy the example file and add your Groq API key:
   \`\`\`bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and replace the LLM_API_KEY with your real key.
   ```
   Note: `LLM_API_KEY` is required. The application will not start without it.
3. Build and run the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend application at http://localhost:3000
5. Verify the backend health check at http://localhost:8080/health

### Docker Registry Structure
In compliance with production submission requirements, the pre-built Docker containers are hosted under a **single image repository** using explicit tags for each service. This cleanly divides the architecture without requiring multiple disparate repositories on Docker Hub.
- **Backend Image:** `rushi5706/form-builder:backend`
- **Frontend Image:** `rushi5706/form-builder:frontend`

If you are pulling directly from Docker Hub instead of building locally, you can use these precise tags.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| API_PORT | No | 8080 | Port the backend API server listens on |
| LLM_API_KEY | Yes | None | API key for the Groq LLM service |

## API Reference

### Health Check
**GET `/health`**
Returns the operational status of the service.
- **Response `200 OK`**:
  \`\`\`json
  { "status": "healthy" }
  \`\`\`

### Generate Form
**POST `/api/form/generate`**
Generates or updates a form schema based on the user prompt.
- **Request Body**:
  \`\`\`json
  {
    "prompt": "Create a contact form with a name and an email address",
    "conversationId": "optional-uuid"
  }
  \`\`\`
- **Query Parameters**:
  - `mock_llm_failure` (optional integer 0-3): Forces the LLM to return an invalid object to test the backend's retry logic.
- **Response `200 OK` (Schema Generated)**:
  \`\`\`json
  {
    "formId": "uuid",
    "conversationId": "uuid",
    "version": 1,
    "schema": { ... JSON Schema Draft 7 ... }
  }
  \`\`\`
- **Response `200 OK` (Clarification Needed)**:
  \`\`\`json
  {
    "status": "clarification_needed",
    "conversationId": "uuid",
    "questions": [
      "What kind of information do you need?",
      "Do you need to collect email addresses?"
    ]
  }
  \`\`\`
- **Response `500 Internal Server Error`**:
  \`\`\`json
  { "error": "Failed to generate valid schema after multiple attempts." }
  \`\`\`

## Features

**Conversational form building**
Describe the form you want to build using natural language. The LLM translates your request directly into a functional, validated JSON Schema capable of rendering dynamic UI elements.

**Multi-turn conversation refinement**
Because the system stores conversational history, you can request incremental changes to your form without starting over. "Add a phone number field" will simply append the field to your existing schema.

**Ambiguity detection and clarification**
When a prompt is too brief (e.g., "book a room"), the system will gracefully halt form generation to ask relevant follow-up questions, ensuring the final output matches exactly what you need.

**Schema validation with retry**
Occasionally, LLMs generate malformed JSON. The backend catches Draft 7 schema violations before they reach the frontend, automatically feeding the error back to the LLM to self-correct up to three times.

**Conditional field visibility (`x-show-when`)**
The application natively supports conditional logic. Fields can appear or disappear dynamically based on the state of other fields via an extension to the JSON Schema (`x-show-when`), enabling complex interactive surveys.

**Real-time schema diff**
A specialized panel displays line-by-line path differences between the previous form version and the current one, making it easy to see exactly what the LLM added, modified, or removed.

**Export functionality**
Once the form is perfected, users can easily export the raw JSON schema, copy a React implementation snippet using `@rjsf/core`, or copy the underlying cURL command used to generate the form.

## Design Decisions

**Why in-memory state instead of a database**
For simplicity and demonstration purposes, an in-memory `Map` holds the conversation schema and history. While it inherently lacks persistence across server restarts, it avoids the setup complexity of Redis or Postgres while providing atomic read/writes during normal operation.

**Why Groq with llama-3.3-70b-versatile**
The Groq LPU engine delivers nearly instantaneous inference speeds, allowing the multi-turn conversational interface to feel highly responsive. The Llama 3.3 70b model excels at code generation and instruction adherence, ensuring accurate JSON schemas.

**Why `@rjsf/core` for form rendering**
Building complex, conditional form inputs natively in React requires significant boilerplate. React JSON Schema Form translates standardized JSON structures into fully interactive DOM elements while strictly enforcing AJV validation schemas.

**How the retry mechanism protects against LLM hallucinations**
Language models occasionally fail to return properly structured data. Rather than bubbling these errors to the user, the `schemaValidator` checks the output against the Draft 7 meta-schema. If it fails, the error message is appended to a temporary conversation history and sent back to the LLM, prompting it to correct its own mistake. This is handled invisibly behind the scenes.

**Why JSON Schema Draft 7 was chosen**
Draft 7 balances modern schema constraints with excellent library support. It provides granular controls (minLength, formatting regex) required for meaningful form validation, and integrating an `x-show-when` extension inside its bounds is straightforward.

## Testing the Application

1. **Health check**:
   \`\`\`bash
   curl http://localhost:8080/health
   \`\`\`
2. **Creating a form**:
   \`\`\`bash
   curl -X POST http://localhost:8080/api/form/generate \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Create a simple feedback form"}'
   \`\`\`
3. **Continuing a conversation**:
   \`\`\`bash
   curl -X POST http://localhost:8080/api/form/generate \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Make the email required", "conversationId": "<ID_FROM_PREVIOUS_STEP>"}'
   \`\`\`
4. **Triggering clarification**:
   \`\`\`bash
   curl -X POST http://localhost:8080/api/form/generate \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Make a form for booking a meeting room"}'
   \`\`\`
5. **Testing retry with `mock_llm_failure=1`**:
   \`\`\`bash
   curl -X POST "http://localhost:8080/api/form/generate?mock_llm_failure=1" \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Feedback form"}'
   \`\`\`
6. **Testing failure with `mock_llm_failure=3`**:
   \`\`\`bash
   curl -X POST "http://localhost:8080/api/form/generate?mock_llm_failure=3" \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Feedback form"}'
   \`\`\`

## Known Limitations
- The system uses an in-memory `Map` for conversations; all form states and chat histories will be lost if the backend restarts.
- There is no authenticated user tracking; anyone with a valid `conversationId` can modify the associated form.
- The UI does not provide deeply nested group styles; forms rely heavily on the default styling provided by `@rjsf/core`.






