# Chat Application

A real-time chat application built with MongoDB, Redis, GraphQL, NestJS, and React.

## Project Architecture

This is a mono-repo containing multiple services and a frontend application:

- **User Service** (NestJS + GraphQL): User management and authentication
- **Chat Service** (NestJS + GraphQL): Message handling with real-time subscriptions
- **Frontend** (React + Apollo Client): User interface with WebSocket support
- **MongoDB**: Message and user data persistence
- **Redis**: Pub/Sub for real-time message distribution across service instances

## Technology Stack

### Backend
- **NestJS**: Node.js framework for building scalable server-side applications
- **GraphQL**: Query language and runtime for APIs
- **MongoDB (Native Driver)**: NoSQL database for data persistence
- **Redis**: In-memory data store for pub/sub messaging
- **TypeScript**: Strongly typed programming language

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
   - MongoDB: mongodb://localhost:27017
   - Redis: localhost:6379

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017` |
| `MONGO_DB` | Database name | `chatapp` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | Service port | Varies by service |

## Key Features

- **Real-time messaging**: WebSocket-based subscriptions for instant message delivery
- **Horizontal scaling**: Multiple chat service instances with Redis pub/sub
- **Message persistence**: MongoDB for reliable message storage
- **Database-first ordering**: Messages ordered by creation time with fallback to ObjectId
- **GraphQL API**: Type-safe queries, mutations, and subscriptions

## Development Phases

This project follows a structured development approach:

1. ✅ **Phase 0**: Project scaffolding and workspace setup
2. 🚧 **Phase 1**: Common design decisions and architecture
3. 🚧 **Phase 2**: MongoDB provider implementation
4. 🚧 **Phase 3**: User Service development
5. 🚧 **Phase 4**: Chat Service with real-time features
6. 🚧 **Phase 5**: Multi-instance testing with Docker
7. 🚧 **Phase 6**: React frontend with subscriptions
8. 🚧 **Phase 7**: Testing strategy and end-to-end tests
9. 🚧 **Phase 8**: Documentation and observability

## Contributing

1. Follow the existing code structure and patterns
2. Add proper TypeScript types
3. Include tests for new functionality
4. Update documentation as needed

## License

ISC