# Chat Application

**Author**: Shubham Verma  
**Contact**: shubhamverma17b@gmail.com  
**Portfolio Project**: 2025-09-15 - 2025-09-15  
**LinkedIn**: www.linkedin.com/in/shubham--verma
**GitHub**: https://github.com/celestial-shubham

A real-time chat application built with PostgreSQL, Redis, GraphQL, NestJS, and React.

---

## 📄 **Important Notice**
This is a portfolio project created by Shubham Verma. All code, architecture decisions, and documentation are original work. This repository is shared for evaluation purposes only.

**For employment discussions, please contact: shubhamverma17b@gmail.com**

---

## Project Architecture

This is a mono-repo containing multiple services and a frontend application:

- **User Service** (NestJS + GraphQL): User management and authentication
- **Chat Service** (NestJS + GraphQL): Message handling with real-time subscriptions
- **Frontend** (React + Apollo Client): User interface with WebSocket support
- **PostgreSQL**: Relational database for structured data with ACID guarantees
- **Redis**: Pub/Sub for real-time message distribution across service instances

## Technology Stack

### Backend
- **NestJS**: Node.js framework for building scalable server-side applications
- **GraphQL**: Query language and runtime for APIs
- **PostgreSQL**: ACID-compliant relational database with excellent JSON support
- **Redis**: In-memory data store for pub/sub messaging
- **TypeScript**: Strongly typed programming language

## Technical Architecture

**Core Decisions Locked (Phase 1):**

- **Database**: PostgreSQL 15 with native `pg` driver + ACID transactions
- **Real-time**: Redis pub/sub for cross-instance message distribution  
- **API**: GraphQL with NestJS code-first approach + `graphql-ws` subscriptions
- **ID Strategy**: UUIDs for external GraphQL IDs, SERIAL for internal FK relations
- **Message Ordering**: `created_at TIMESTAMPTZ` with database-level guarantees
- **Consistency Flow**: Database insert → COMMIT → Redis publish (ensures no message loss)
- **Frontend**: React + Apollo Client with `graphql-ws` subscription link
- **Load Balancing**: Frontend round-robin across `chat-service-1` (3002) and `chat-service-2` (3003) for both HTTP and WebSocket links
- **Window-scoped sessions**: Frontend uses `sessionStorage` per tab/window to avoid shared logins across windows

### Frontend
- **React**: Frontend library for building user interfaces
- **Apollo Client**: GraphQL client with caching and WebSocket support
- **graphql-ws**: WebSocket sub-protocol for GraphQL subscriptions

### Infrastructure
- **Docker & Docker Compose**: Containerization and orchestration
- **npm Workspaces**: Monorepo package management

## Project Structure

```
chat-app/
├── services/
│   ├── user/                 # User service (NestJS + GraphQL)
│   └── chat/                 # Chat service (NestJS + GraphQL)
├── frontend/                 # React frontend application
├── packages/
│   └── common/              # Shared types and utilities
├── docker-compose.yml       # Multi-service Docker configuration
├── package.json            # Workspace configuration
└── README.md              # This file
```

## Development Setup

### Prerequisites
- Node.js (>= 18)
- Docker and Docker Compose
- npm

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start all services with Docker:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - User Service GraphQL: http://localhost:3001/graphql
   - Chat Service Instance 1: http://localhost:3002/graphql
   - Chat Service Instance 2: http://localhost:3003/graphql
   - PostgreSQL: postgresql://chatuser:chatpass@localhost:5432/chatapp
   - Redis: localhost:6379

4. **Run end-to-end test (Phase 7):**
   ```bash
   npm run test:e2e
   ```
   This test creates two users, auto-joins them to the General Chat, opens two GraphQL `graphql-ws` subscriptions, sends messages, and asserts both subscribers receive them in real time.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://chatuser:chatpass@postgres:5432/chatapp` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | Service port | Varies by service |

## Key Features

- **Real-time messaging**: WebSocket-based subscriptions for instant message delivery
- **Horizontal scaling**: Multiple chat service instances with Redis pub/sub
- **ACID compliance**: PostgreSQL ensures message consistency and ordering
- **Relational data integrity**: Foreign keys and constraints maintain data consistency
- **Advanced querying**: Complex joins and queries for chat history and user management
- **GraphQL API**: Type-safe queries, mutations, and subscriptions

### Testing

- Test runner: Jest + ts-jest
- Command: `npm run test:e2e`
- What it validates:
  - PostgreSQL insert + COMMIT before Redis publish (consistency)
  - Redis pub/sub fanout across subscribers
  - GraphQL subscriptions via `graphql-ws` delivering messages in real time
  - Correct message ordering, UUIDs, and ISO timestamps

Troubleshooting: If you see "Cannot log after tests are done", it usually means a subscription attempted to log after Jest teardown. Ensure subscriptions are disposed and avoid logging inside `complete` callbacks.

## API Reference

This project exposes GraphQL APIs from two services. All operations are sent to the single endpoint `/graphql` over HTTP (for queries/mutations) and WebSocket (for subscriptions).

- User Service (HTTP): `http://localhost:3001/graphql`
- Chat Service (HTTP): `http://localhost:3002/graphql` and `http://localhost:3003/graphql`
- Chat Service (WebSocket): `ws://localhost:3002/graphql` and `ws://localhost:3003/graphql`

Notes:
- The frontend balances requests across both chat service instances.

### User Service GraphQL API (port 3001)

Schema (relevant parts):
```graphql
type User {
  id: ID!
  username: String!
  email: String
  createdAt: DateTime!
  lastSeen: DateTime
  isActive: Boolean!
}

input CreateUserInput {
  username: String!
  email: String
}

type Query {
  user(id: ID!): User
  userByUsername(username: String!): User
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}
```

Examples:

Create user (HTTP):
```bash
curl -s -X POST http://localhost:3001/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation($input: CreateUserInput!){ createUser(input:$input){ id username email createdAt isActive } }",
    "variables": { "input": { "username": "alice" } }
  }'
```

Get user by id:
```bash
curl -s -X POST http://localhost:3001/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query($id: ID!){ user(id:$id){ id username email } }",
    "variables": { "id": "<USER_UUID>" }
  }'
```

Get user by username:
```bash
curl -s -X POST http://localhost:3001/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query($u: String!){ userByUsername(username:$u){ id username email } }",
    "variables": { "u": "alice" }
  }'
```

### Chat Service GraphQL API (ports 3002/3003)

Schema (relevant parts):
```graphql
type Message { 
  id: ID!
  chatId: ID!
  senderId: ID!
  content: String!
  createdAt: DateTime!
  senderUsername: String
}

input SendMessageInput {
  chatId: ID!
  senderId: ID!
  content: String!
}

type Query {
  chatHistory(chatId: ID!, limit: Int = 50, offset: Int = 0): [Message!]!
}

type Mutation {
  sendMessage(input: SendMessageInput!): Message!
  joinGeneralChat(userId: ID!): Boolean!
}

type Subscription {
  messageAdded(chatId: ID!): Message!
}
```

Examples:

Join General Chat for a user:
```bash
curl -s -X POST http://localhost:3002/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation($uid: ID!){ joinGeneralChat(userId:$uid) }",
    "variables": { "uid": "<USER_UUID>" }
  }'
```

Send message:
```bash
curl -s -X POST http://localhost:3002/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation($input: SendMessageInput!){ sendMessage(input:$input){ id content senderUsername createdAt } }",
    "variables": {
      "input": {
        "chatId": "646f4607-bfe5-40af-a005-105d845f6bb8",
        "senderId": "<USER_UUID>",
        "content": "Hello from README!"
      }
    }
  }'
```

Get chat history (ordered chronologically in UI):
```bash
curl -s -X POST http://localhost:3002/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query($chatId: ID!, $limit: Int, $offset: Int){ chatHistory(chatId:$chatId, limit:$limit, offset:$offset){ id content senderUsername createdAt } }",
    "variables": { "chatId": "646f4607-bfe5-40af-a005-105d845f6bb8", "limit": 50, "offset": 0 }
  }'
```

Subscribe to new messages (WebSocket via `graphql-ws`):
```js
// Node snippet
const { createClient } = require('graphql-ws');
const WebSocket = require('ws');

const client = createClient({ url: 'ws://localhost:3002/graphql', webSocketImpl: WebSocket });
const unsubscribe = client.subscribe(
  {
    query: 'subscription($chatId: ID!){ messageAdded(chatId: $chatId){ id content senderUsername createdAt } }',
    variables: { chatId: '646f4607-bfe5-40af-a005-105d845f6bb8' }
  },
  {
    next: (data) => console.log('messageAdded:', data.data.messageAdded),
    error: console.error,
    complete: () => {}
  }
);
```

## Frontend Behavior

- Apollo Client routes user-related GraphQL operations to the User Service and chat-related ones to the Chat Service automatically.
- Round-robin load balancing is applied for both HTTP and WebSocket connections across the two chat instances.
- Sessions are window-scoped using `sessionStorage`, allowing different users in different tabs without interference.

## Data Model (PostgreSQL)

- Tables: `users`, `chats`, `chat_participants`, `messages`
- UUIDs are exposed externally via GraphQL; SERIAL integer IDs are used internally for relations.
- Timestamps are `TIMESTAMPTZ` and converted to ISO-8601 strings in API responses.

## Troubleshooting

- Port conflicts on 5432 (PostgreSQL): ensure no local Postgres is running (`brew services stop postgresql@14`).
- Docker build dependency issues: use `npm install --legacy-peer-deps` inside service Dockerfiles (already configured).
- If subscriptions don’t receive events, confirm Redis is running and both chat instances connect to the same Redis host.
- Jest warning "Cannot log after tests are done": ensure subscription disposals happen before test completion (implemented in the e2e test).

- Docker compose build issues: incase you get an error like this: 
```
ERROR [ExceptionHandler] connect ECONNREFUSED 172.18.0.3:5432
```
, then restart the affected docker compose service again , the postgres container might be in between the start process .
