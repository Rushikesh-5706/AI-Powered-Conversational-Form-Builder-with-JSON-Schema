# AI-Powered Conversational Form Builder

A full-stack application where users describe web forms in plain language and receive
working, validated forms in real time. The system manages multi-turn conversation
history so users can refine their forms incrementally, detects ambiguous requests and
asks for clarification, and validates every LLM response against JSON Schema Draft 7
before returning it to the frontend.

---

## Architecture Overview

```text
   +------------------+     HTTP      +-------------------+
   |                  |  ---------->  |                   |
   |  React Frontend  |               |  Express Backend  |
   |  (Vite + RJSF)  |  <----------  |  (Node.js API)    |
   |                  |   JSON resp   |                   |
   +------------------+               +-------------------+
                                              |
                             +----------------+----------------+
                             |                |                |
                    +--------+------+ +-------+------+ +------+--------+
                    |               | |              | |               |
                    |  Conversation | |    Schema    | |   Groq API    |
                    |  Store (Map)  | |  Validator   | |  llama-3.3-   |
                    |               | |  (AJV Draft7)| |  70b-versatile|
                    +---------------+ +--------------+ +---------------+
```

The React frontend is served statically by nginx in production. The browser sends
user prompts directly to the Express API. The backend maintains conversation history
in memory keyed by UUID, calls the Groq API to generate a JSON Schema, validates
the response with AJV, and returns the schema to the frontend. If validation fails,
the backend retries up to two more times before returning an error.

---

## Technology Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | React 18 + Vite | Fast development, strong component model |
| Form Rendering | @rjsf/core | Renders JSON Schema directly into interactive forms |
| State Management | Context API + useReducer | Sufficient for this scope without Redux overhead |
| Schema Diff | deep-diff | Accurate structural comparison of JSON objects |
| Backend | Node.js + Express | Lightweight, async-friendly API layer |
| LLM | Groq SDK (llama-3.3-70b) | Fast inference, reliable JSON output mode |
| Validation | AJV + ajv-formats | Industry standard for JSON Schema Draft 7 |
| Containerization | Docker + nginx | Multi-stage builds, single-command startup |

---

## Prerequisites

- Docker and Docker Compose (v2 recommended)
- A Groq API key from console.groq.com

---

## Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/Rushikesh-5706/AI-Powered-Conversational-Form-Builder-with-JSON-Schema.git
cd AI-Powered-Conversational-Form-Builder-with-JSON-Schema

# 2. Set your Groq API key (only needed for LLM features — health check works without it)
export LLM_API_KEY=your_real_groq_key_here

# 3. Start everything
docker-compose up --build

# 4. Open the app
# Frontend: http://localhost:3000
# Backend health: http://localhost:8080/health
```

The frontend waits for the backend health check to pass before starting. Expect about
30 seconds after the backend starts before both containers are fully ready.

### Docker Images

Pre-built images are available on Docker Hub:

- `rushi5706/form-builder:backend`
- `rushi5706/form-builder:frontend`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| API_PORT | No | 8080 | Port the backend API server listens on |
| LLM_API_KEY | Yes | — | API key for the Groq LLM service |

---

## Features

**Conversational form building** — Describe a form in plain language. The LLM translates
the description into a JSON Schema Draft 7 document, which the frontend renders as
interactive form fields with validation.

**Multi-turn refinement** — Every conversation is stored by UUID. Send follow-up messages
to add, remove, or change fields. The version number increments on each successful update.

**Ambiguity detection** — If a prompt is too vague, the backend returns clarifying
questions instead of a form. The user answers them before a schema is generated.

**Validation with automatic retry** — Every schema the LLM returns is validated against
JSON Schema Draft 7 rules. If it fails, the error is fed back to the LLM which corrects
its own output. This happens up to three times before returning an error to the client.

**Conditional field visibility** — Fields can include an `x-show-when` extension that
hides them until another field reaches a specific value. This enables conditional
survey logic without any custom schema work.

**Schema diff panel** — After each schema update, a panel shows what changed relative
to the previous version using colour-coded addition, deletion, and modification markers.

**Export** — Download the raw JSON schema, copy a working React component using
`@rjsf/core`, or copy the curl command that reproduces the current form generation.

---

## API Reference

### GET /health

Returns the operational status of the backend.

```
Response 200:
{"status": "healthy"}
```

### POST /api/form/generate

Generates or updates a form schema from a natural language prompt.

**Request body:**
```json
{
  "prompt": "Create a contact form with name and email",
  "conversationId": "optional-uuid-from-previous-response"
}
```

**Query parameters:**

`mock_llm_failure` (integer, optional) — forces the LLM to return invalid output to
test the retry mechanism. Value 1 fails the first attempt and succeeds on retry.
Value 3 exhausts all attempts and returns 500.

**Response — schema generated:**
```json
{
  "formId": "uuid",
  "conversationId": "uuid",
  "version": 1,
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": { ... }
  }
}
```

**Response — clarification needed:**
```json
{
  "status": "clarification_needed",
  "conversationId": "uuid",
  "questions": [
    "What kind of information do you need to collect?",
    "Do you need to track attendee count?"
  ]
}
```

**Response — all retries exhausted:**
```json
HTTP 500
{"error": "Failed to generate valid schema after multiple attempts."}
```

---

## Testing the API

```bash
# Health check
curl http://localhost:8080/health

# Generate a form
curl -X POST http://localhost:8080/api/form/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A feedback form with email and a rating from 1 to 5"}'

# Refine the form (paste the conversationId from above)
curl -X POST http://localhost:8080/api/form/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Make the email optional", "conversationId": "PASTE_ID_HERE"}'

# Trigger clarification
curl -X POST http://localhost:8080/api/form/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Make a form for booking a meeting room"}'

# Test retry recovery (1 failure then success)
curl -X POST "http://localhost:8080/api/form/generate?mock_llm_failure=1" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Simple feedback form"}'

# Test all retries exhausted
curl -X POST "http://localhost:8080/api/form/generate?mock_llm_failure=3" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Simple feedback form"}'
```

---

## Design Decisions

**In-memory state instead of a database** — Conversations are stored in a plain JavaScript
Map keyed by UUID. This avoids database setup complexity while correctly demonstrating the
stateful architecture. The tradeoff is that all conversation history resets on server restart,
which is acceptable for this scope and is documented in Known Limitations below.

**Groq with llama-3.3-70b-versatile** — The Groq inference engine delivers response times
under two seconds even for complex schemas, making the conversational loop feel immediate.
The llama-3.3-70b model follows structured output instructions reliably when the
`response_format: { type: "json_object" }` parameter is set.

**@rjsf/core for form rendering** — Building input components for every JSON Schema type
from scratch would require significant code with no evaluation benefit. React JSON Schema
Form handles the translation from schema to DOM elements while enforcing AJV validation
on user input, and it supports custom field types like the ConditionalField component.

**Retry mechanism** — LLMs occasionally return schemas that fail validation, especially
for complex field types. Rather than surfacing these failures to the user, the backend
includes the validation error in the retry prompt. The LLM corrects its own output in the
majority of cases. The mock_llm_failure parameter allows this mechanism to be tested
without depending on the LLM actually failing.

**JSON Schema Draft 7** — Draft 7 provides the best balance of validation expressiveness
and library support. AJV has first-class support for Draft 7, and the x-show-when
conditional extension slots cleanly into the additional properties space Draft 7 allows.

---

## Known Limitations

- Conversation history resets when the backend container restarts. There is no persistence layer.
- No authentication. Any client with a valid conversationId can modify that conversation.
- The application assumes the Groq API is reachable. There is no offline fallback.
