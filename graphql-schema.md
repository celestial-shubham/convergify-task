# GraphQL Schema Reference

## Minimal Schema for Phase 2-3 Implementation

```graphql
scalar DateTime

# Core User type
type User {
  id: ID!           # UUID string from PostgreSQL
  username: String!
  email: String
  createdAt: DateTime!
}

# Core Message type  
type Message {
  id: ID!           # UUID string from PostgreSQL
  chatId: ID!       # Chat UUID reference
  senderId: ID!     # User UUID reference
  content: String!
  createdAt: DateTime!
}

# Phase 2-3 Queries & Mutations
type Query {
  user(id: ID!): User
  chatHistory(chatId: ID!, limit: Int = 50): [Message!]!
}

type Mutation {
  createUser(username: String!, email: String): User!
  sendMessage(chatId: ID!, senderId: ID!, content: String!): Message!
}

# Phase 4 Subscriptions
type Subscription {
  messageAdded(chatId: ID!): Message!
}
```

## PostgreSQL Mapping

- `User.id` ↔ `users.uuid`
- `Message.id` ↔ `messages.uuid`  
- `Message.chatId` ↔ `chats.uuid`
- `Message.senderId` ↔ `users.uuid`

## Implementation Notes

- Use NestJS code-first approach with decorators
- UUIDs exposed as GraphQL `ID` scalars
- PostgreSQL SERIAL IDs used only for internal FK relations
- DateTime fields map to PostgreSQL `TIMESTAMPTZ`