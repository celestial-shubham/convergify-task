# Chat Application

A real-time chat application built with PostgreSQL, Redis, GraphQL, NestJS, and React.

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

## Development Phases

This project follows a structured development approach:

1. ✅ **Phase 0**: Project scaffolding and workspace setup
2. ✅ **Phase 1**: Common design decisions and architecture
3. ✅ **Phase 2**: PostgreSQL provider implementation
4. 🚧 **Phase 3**: User Service development
5. 🚧 **Phase 4**: Chat Service with real-time features
6. 🚧 **Phase 5**: Multi-instance testing with Docker
7. 🚧 **Phase 6**: React frontend with subscriptions
8. 🚧 **Phase 7**: Testing strategy and end-to-end tests
9. 🚧 **Phase 8**: Documentation and observability

<!-- ## Why PostgreSQL over MongoDB?

**PostgreSQL is superior for chat applications due to:**

### 🔒 **ACID Transactions = Message Consistency**
- **Critical for chat**: Messages must appear in correct order for all users
- **PostgreSQL**: Full ACID guarantees prevent lost or out-of-order messages
- **MongoDB**: Potential consistency issues during network partitions

### 🔗 **Natural Relational Structure**
- **Chat data is inherently relational**: users ↔ chats ↔ messages ↔ participants
- **PostgreSQL**: Foreign keys, joins, and constraints model relationships perfectly
- **MongoDB**: Requires complex denormalization or multiple queries

### ⚡ **Superior Query Performance**
- **Chat needs**: "Get last 50 messages from user's active chats, ordered by time"
- **PostgreSQL**: Advanced indexing, query optimization, efficient JOINs
- **MongoDB**: Limited aggregation pipeline, slower for complex queries

### 🏗️ **Better Concurrency & Scaling**
- **PostgreSQL**: MVCC (Multi-Version Concurrency Control) handles high read/write loads
- **Chat apps**: Typically read-heavy with occasional writes - perfect for PostgreSQL

### 📊 **JSON Support When Needed**
- **Best of both worlds**: Structured schema + flexible JSONB for message metadata
- **Example**: Store reactions, attachments, formatting as JSONB while maintaining relational integrity

## Database Schema

The application uses a well-structured relational schema:

```sql
users → chat_participants ← chats ← messages
```

- **users**: User profiles and authentication
- **chats**: Chat rooms/conversations (group or direct)
- **chat_participants**: Many-to-many relationship with roles
- **messages**: Messages with JSONB metadata for flexibility

See `init-db.sql` for the complete schema with indexes and sample data. -->

## Contributing

1. Follow the existing code structure and patterns
2. Add proper TypeScript types
3. Include tests for new functionality
4. Update documentation as needed

## License

ISC