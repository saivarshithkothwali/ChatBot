#  FoodExpress AI Chatbot (RAG)

An AI-powered restaurant recommendation chatbot built using Retrieval-Augmented Generation (RAG). Instead of relying solely on an LLM's knowledge, the chatbot retrieves relevant restaurant information from a Pinecone vector database using semantic search and generates context-aware responses with Groq's Llama 3.3 model.

---

## Features

- Semantic restaurant search using vector embeddings
- Retrieval-Augmented Generation (RAG)
- Pinecone Vector Database integration
- Hugging Face embedding generation
- Groq Llama 3.3 for response generation
- REST APIs built with Express.js
- Swiggy API integration for restaurant data
- CORS-free backend proxy
- Environment variable based configuration

---

## Tech Stack

### Backend

- Node.js
- Express.js

### AI

- Groq API (Llama 3.3 70B)
- Hugging Face Inference API
- Retrieval-Augmented Generation (RAG)

### Vector Database

- Pinecone

### APIs

- Swiggy Public API
- REST APIs

---

## Project Architecture

```
                User Query
                     │
                     ▼
              Express Backend
                     │
                     ▼
      Generate Embedding (Hugging Face)
                     │
                     ▼
          Query Pinecone Vector DB
                     │
          Retrieve Relevant Restaurants
                     │
                     ▼
     Build Prompt with Retrieved Context
                     │
                     ▼
         Groq Llama 3.3 Generates Answer
                     │
                     ▼
              Response to Frontend
```

---

## Project Structure

```
src/
│
├── server.js              # Express server
├── pineconeClient.js      # Pinecone + Embeddings
│
.env
package.json
```

---

## API Endpoints

### Fetch Restaurants

```
GET /api/get-restaurants
```

Fetches restaurant data from the Swiggy API.

---

### Upsert Restaurant Data

```
POST /api/upsert-restaurants
```

Stores restaurant vectors inside Pinecone.

---

### Chatbot

```
POST /api/chatbot
```

Example Request

```json
{
    "message":"Suggest a good pizza restaurant"
}
```

---

### Test Semantic Search

```
GET /test
```

Returns restaurants retrieved from Pinecone.

---

### Fetch Restaurant Menu

```
GET /api/menu/:id
```

Returns the selected restaurant's menu.

---
