-- PostgreSQL initialization script for Chat Application
-- This script creates the database schema with proper relationships and indexes

-- Enable UUID extension for better ID generation (optional, can use SERIAL instead)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE, -- For GraphQL ID field
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Chats table (represents chat rooms/conversations)
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE, -- For GraphQL ID field
    name VARCHAR(255),
    description TEXT,
    is_group BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat participants (many-to-many relationship between users and chats)
CREATE TABLE chat_participants (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member', 'readonly'
    is_active BOOLEAN DEFAULT true,
    UNIQUE(chat_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE, -- For GraphQL ID field
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    metadata JSONB, -- For storing additional data like reactions, attachments, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);

CREATE INDEX idx_chats_uuid ON chats(uuid);
CREATE INDEX idx_chats_created_by ON chats(created_by);

CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_active ON chat_participants(chat_id, user_id) WHERE is_active = true;

-- Critical indexes for messages (most queried table)
CREATE INDEX idx_messages_uuid ON messages(uuid);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC); -- For ordering messages
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC); -- For chat history queries
CREATE INDEX idx_messages_active ON messages(chat_id, created_at DESC) WHERE is_deleted = false;

-- JSONB index for metadata queries (if needed)
CREATE INDEX idx_messages_metadata ON messages USING GIN(metadata);

-- Update triggers to maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
INSERT INTO users (username, email) VALUES 
    ('alice', 'alice@example.com'),
    ('bob', 'bob@example.com'),
    ('charlie', 'charlie@example.com');

INSERT INTO chats (name, is_group, created_by) VALUES 
    ('General Chat', true, 1),
    ('Alice & Bob', false, 1);

INSERT INTO chat_participants (chat_id, user_id, role) VALUES 
    (1, 1, 'admin'),
    (1, 2, 'member'),
    (1, 3, 'member'),
    (2, 1, 'member'),
    (2, 2, 'member');

INSERT INTO messages (chat_id, sender_id, content) VALUES 
    (1, 1, 'Welcome to the chat!'),
    (1, 2, 'Hello everyone!'),
    (2, 1, 'Hi Bob, how are you?'),
    (2, 2, 'Hi Alice! I''m doing great!');

-- Create a view for easier message querying with user info
CREATE VIEW message_details AS
SELECT 
    m.id,
    m.uuid,
    m.chat_id,
    c.uuid as chat_uuid,
    m.sender_id,
    u.uuid as sender_uuid,
    u.username as sender_username,
    m.content,
    m.message_type,
    m.metadata,
    m.created_at,
    m.updated_at,
    m.edited_at,
    m.is_deleted
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
LEFT JOIN chats c ON m.chat_id = c.id
WHERE m.is_deleted = false
ORDER BY m.created_at DESC;

-- Grant permissions (adjust as needed for your security requirements)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatuser;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO chatuser;