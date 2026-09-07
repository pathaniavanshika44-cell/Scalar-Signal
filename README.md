# Scalar Signal — Secure Messaging Platform

Scalar Signal is a full-stack messaging platform inspired by Signal. It supports authentication, contacts, one-to-one and group conversations, and real-time messaging using WebSockets.

> **Note:** This project recreates Signal's core messaging experience. Actual Signal end-to-end encryption and phone verification are not implemented; these are mocked or omitted as permitted by the assignment.

## 1. Features

* User registration and login
* JWT authentication and password hashing
* Session persistence and logout
* Contact management
* One-to-one conversations
* Group creation and member management
* Real-time messaging with WebSockets
* Message persistence and timestamps
* Message delivery status
* Signal-inspired responsive UI
* Settings and conversation management

## 2. Tech Stack

| Layer            | Technology                 |
| ---------------- | -------------------------- |
| Frontend         | Next.js, React, TypeScript |
| Backend          | Python, FastAPI            |
| Database         | SQLite / libSQL            |
| ORM              | SQLAlchemy                 |
| Real-Time        | WebSockets                 |
| Authentication   | JWT                        |
| Production DB    | Turso                      |
| Frontend Hosting | Vercel                     |
| Backend Hosting  | Render                     |
| Containerization | Docker                     |

## 3. Architecture 

```text
User
 │
 ▼
Next.js Frontend (Vercel)
 │
 ├── REST API
 └── WebSocket
       │
       ▼
FastAPI Backend (Render)
       │
       ▼
SQLAlchemy
       │
       ▼
Turso / SQLite Database


The frontend communicates with the FastAPI backend through REST APIs for standard operations and WebSockets for real-time messaging.




## 4. Project Structure


Scalar-Signal/
├── frontend/
│   ├── app/
│   │   ├── auth/
│   │   ├── components/
│   │   └── page.tsx
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── README.md


## 5. Database Schema


Users
  │
  ├── Contacts
  │
  └── Conversations
          │
          ├── Conversation Members
          │
          └── Messages


Main tables:

| Table                  | Purpose                            |
| ---------------------- | ---------------------------------- |
| `users`                | User accounts and profiles         |
| `contacts`             | User contact relationships         |
| `conversations`        | One-to-one and group conversations |
| `conversation_members` | Users belonging to conversations   |
| `messages`             | Persistent conversation messages   |

## 6. Authentication

Authentication uses JWT tokens and password hashing.


Register/Login
      ↓
FastAPI
      ↓
Password Verification
      ↓
JWT Token
      ↓
Authenticated Requests


WebSocket connections also validate the JWT and verify conversation membership.

## 7. Real-Time Messaging

WebSockets are used for real-time communication.

They support:

* Sending and receiving messages
* Typing indicators
* Read events
* Message broadcasting

Messages are saved to the database before being broadcast to connected users.

## 8. Local Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:


http://localhost:3000


### Backend


cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000


Backend runs on:
http://localhost:8000


## 9. Environment Variables

### Backend

```env
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
FRONTEND_URL=http://localhost:3000


### Frontend

Configure the backend API and WebSocket URLs according to the environment.

> Do not commit secrets or `.env` files to GitHub.

## 10. Deployment

```text
Frontend → Vercel
Backend  → Render
Database → Turso
```


## 11. API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/signup` | Register a user |
| POST | `/auth/login` | Authenticate user |
| GET | `/auth/me` | Get current user |
| GET/POST | `/contacts` | Manage contacts |
| GET/POST | `/conversations` | Manage conversations |
| GET | `/conversations/{id}/messages` | Fetch messages |
| WebSocket | `/ws/{conversation_id}` | Real-time messaging |

The primary focus is on messaging workflows, real-time communication, backend architecture, database design, and Signal-inspired UI/UX.




## 12. Live Demo

**Frontend:** https://scalar-signal.vercel.app/

**Backend:** https://scalar-signal-backend.onrender.com/

## 13. GitHub

**Repository:** https://github.com/pathaniavanshika44-cell/Scalar-Signal
