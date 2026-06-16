# SnippetVault
 
A web application for saving, organizing, and sharing code snippets. Built as a system design course project at the University of Primorska (UP FAMNIT).
 
**Live demo:** [http://88.200.63.148:30162/dashboard](http://88.200.63.148:30162/)
 
---
 
## Overview
 
SnippetVault lets developers save code snippets with syntax highlighting, organize them with tags, and manage them through a clean dashboard. The project was designed with a focus on relational database modeling, RESTful API architecture, and authentication patterns.
 
## Tech Stack
 
**Frontend**
- React + Vite
- CodeMirror 6 — syntax highlighting for JavaScript, Python, CSS, HTML, SQL, and Rust
**Backend**
- Node.js + Express
- Session-based authentication with JWT in HttpOnly cookies
- RESTful API with a dedicated service layer
**Database**
- MySQL — deployed on university server
- Normalized to 3NF with many-to-many tag relationships via junction tables
**Tooling**
- pnpm monorepo (frontend + backend as separate workspaces)
## Project Structure
 
```
snippetvault/
├── frontend/         # React + Vite app
├── backend/          # Node.js + Express API
├── package.json      # Root workspace config
└── pnpm-lock.yaml
```
 
## Database Design
 
The schema follows third normal form (3NF) with the following key design decisions:
 
- Snippets have a many-to-many relationship with tags via a `snippet_tags` junction table
- Users are linked to their snippets through a foreign key on the snippets table
- Authentication state is managed server-side with sessions persisted in the database
## Features
 
- User registration and login
- Create, edit, and delete code snippets
- Tag-based organization
- Syntax-highlighted editor (CodeMirror 6) supporting multiple languages
- Dashboard view of all personal snippets
## Running Locally
 
**Prerequisites:** Node.js, pnpm, MySQL
 
```bash
# Clone the repo
git clone https://github.com/Zlatanoski/snippetvault.git
cd snippetvault
 
# Install dependencies
pnpm install
 
# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your DB credentials and session secret
 
# Start backend
cd backend
pnpm dev
 
# Start frontend (separate terminal)
cd frontend
pnpm dev
```
 
The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3000` by default.
 
## Deployment
 
The application is deployed on a university server with the MySQL database hosted on the same machine. The backend serves the API and the frontend is built and served statically.
 
## Course Context
 
This project was developed as part of the Systems Design course at UP FAMNIT. The academic deliverables included:
 
- Entity-Relationship (ER) diagram
- Relational model
- Physical database model (implemented in phpMyAdmin)
- Figma wireframes for all major screens
- Full seminar documentation
## Author
 
David Zlatanoski — [github.com/Zlatanoski](https://github.com/Zlatanoski)  
University of Primorska, Faculty of Mathematics, Natural Sciences and Information Technologies (UP FAMNIT)
