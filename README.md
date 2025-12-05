# ShieldForge

🛡️ A modular authentication system for React/Node/GraphQL applications.

## Overview

ShieldForge provides a complete authentication solution that can be imported into any site to provide secure access. It includes:

- **Frontend**: React.js with TypeScript and Apollo GraphQL Client
- **Backend**: Node.js with TypeScript, Express, and GraphQL (using GraphQLObjectType)
- **Database**: PostgreSQL with Prisma ORM
- **Development**: Docker container for PostgreSQL, GitHub Codespaces support

## Features

- User registration and login
- JWT-based session management
- Secure password hashing with bcrypt
- GraphQL API with mutations and queries
- React context for authentication state
- Responsive UI components

## Project Structure

```
shieldforge/
├── packages/
│   ├── backend/          # Node.js/TypeScript/GraphQL API
│   │   ├── src/
│   │   │   ├── graphql/  # GraphQL schema, types, queries, mutations
│   │   │   ├── services/ # Business logic (auth service)
│   │   │   └── middleware/
│   │   └── prisma/       # Database schema
│   └── frontend/         # React/TypeScript/Apollo Client
│       └── src/
│           ├── components/
│           ├── context/
│           └── graphql/
├── docker-compose.yml    # PostgreSQL container
└── .devcontainer/        # GitHub Codespaces configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chriscase/ShieldForge.git
   cd ShieldForge
   ```

2. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

3. **Install dependencies and initialize database**
   ```bash
   npm install
   npm run db:generate
   npm run db:push
   ```

4. **Create environment file**
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API at http://localhost:4000 (GraphQL at /graphql)
   - Frontend at http://localhost:5173

### GitHub Codespaces

Open this repository in GitHub Codespaces for a fully configured development environment. The `postCreateCommand` will automatically:

1. Start the PostgreSQL container
2. Install npm dependencies
3. Generate Prisma client
4. Push database schema

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:backend` | Start only the backend server |
| `npm run dev:frontend` | Start only the frontend server |
| `npm run build` | Build both packages |
| `npm run test` | Run tests for all packages |
| `npm run lint` | Lint all packages |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run codespace:init` | Initialize for Codespaces |

## GraphQL API

### Mutations

```graphql
# Register a new user
mutation Register($email: String!, $password: String!, $name: String) {
  register(email: $email, password: $password, name: $name) {
    token
    user { id email name }
  }
}

# Login
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user { id email name }
  }
}

# Logout
mutation Logout {
  logout { message success }
}
```

### Queries

```graphql
# Get current user
query Me {
  me { id email name createdAt }
}

# Health check
query Health {
  health
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRATION` | Token expiration in seconds | 86400 |
| `PORT` | Backend server port | 4000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## License

MIT License - see [LICENSE](LICENSE) for details.
