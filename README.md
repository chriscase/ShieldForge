# ShieldForge

🛡️ A modular, reusable authentication system for React/Node/GraphQL applications.

## Vision

ShieldForge provides a complete, extensible authentication solution that can be:
- **Imported as a library** - Use GraphQL types and services in your own schema
- **Run as a standalone server** - Full authentication API out of the box
- **Incrementally extended** - Add capabilities without breaking existing implementations

---

## MVP Checklist

Track the minimum viable product accomplishments:

### Core Authentication ✅
- [x] User registration with email/password
- [x] User login with JWT tokens
- [x] User logout with session invalidation
- [x] Current user query (`me`)
- [x] Secure password hashing (bcrypt)
- [x] JWT-based session management

### Security ✅
- [x] Rate limiting on API endpoints
- [x] JWT secret validation in production
- [x] Secure session storage in database
- [x] CORS configuration

### GraphQL API ✅
- [x] GraphQLObjectType-based schema
- [x] Exportable types (UserType, AuthPayloadType)
- [x] Composable query/mutation fields
- [x] Health check endpoint

### Database ✅
- [x] PostgreSQL with Prisma ORM
- [x] User model with secure password storage
- [x] Session model for token management
- [x] Docker Compose for development

### Developer Experience ✅
- [x] TypeScript throughout
- [x] Node.js workspaces monorepo
- [x] Concurrent dev server script
- [x] GitHub Codespaces support

### Frontend Components ✅
- [x] React authentication context
- [x] Login form component
- [x] Registration form component
- [x] User profile component
- [x] Apollo Client integration

### Documentation ✅
- [x] Library usage guide
- [x] API documentation
- [x] Quick start guide
- [x] MVP checklist

### Pending Enhancements 🔲
- [ ] Password reset functionality
- [ ] Email verification
- [ ] OAuth providers (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Refresh token rotation
- [ ] Account lockout after failed attempts
- [ ] User roles and permissions
- [ ] Audit logging

---

## Installation

```bash
npm install @shieldforge/backend
# or
yarn add @shieldforge/backend
```

---

## Usage Guide

### Option 1: Import GraphQL Fields (Recommended)

The most flexible approach - compose ShieldForge auth into your existing GraphQL schema:

```typescript
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { 
  authQueryFields, 
  authMutationFields,
  UserType,
  AuthPayloadType 
} from '@shieldforge/backend';

// Compose auth fields with your own fields
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    // Spread ShieldForge auth queries (me, health)
    ...authQueryFields,
    
    // Add your own queries
    posts: {
      type: new GraphQLList(PostType),
      resolve: () => getPosts(),
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // Spread ShieldForge auth mutations (register, login, logout)
    ...authMutationFields,
    
    // Add your own mutations
    createPost: {
      type: PostType,
      args: { title: { type: GraphQLString } },
      resolve: (_, args, context) => {
        // context.token contains the JWT from ShieldForge middleware
        return createPost(args.title, context.user);
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
```

### Option 2: Use the Complete Schema

For standalone authentication servers or quick prototyping:

```typescript
import { schema } from '@shieldforge/backend';
import { createHandler } from 'graphql-http/lib/use/express';
import express from 'express';

const app = express();

app.all('/graphql', createHandler({ schema }));

app.listen(4000);
```

### Option 3: Use Auth Services Directly

Access authentication logic without GraphQL:

```typescript
import { 
  register, 
  login, 
  logout, 
  verifyToken 
} from '@shieldforge/backend';

// In your REST or custom handler
app.post('/api/register', async (req, res) => {
  try {
    const { token, user } = await register(
      req.body.email, 
      req.body.password, 
      req.body.name
    );
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Option 4: Use the Auth Middleware

Add JWT verification to any Express app:

```typescript
import { authMiddleware, AuthRequest } from '@shieldforge/backend';
import express from 'express';

const app = express();

// Add auth middleware to extract user from JWT
app.use(authMiddleware);

// Access authenticated user in routes
app.get('/profile', (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});
```

---

## Context Setup

When using GraphQL, ensure your context includes the JWT token:

```typescript
import { createHandler } from 'graphql-http/lib/use/express';
import { schema, authMiddleware, AuthRequest } from '@shieldforge/backend';

app.use(authMiddleware);

app.all('/graphql', createHandler({
  schema,
  context: (req) => ({
    token: (req.raw as AuthRequest).token,
    user: (req.raw as AuthRequest).user,
  }),
}));
```

---

## Environment Variables

Create a `.env` file with:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/shieldforge"
JWT_SECRET="your-secure-random-secret-min-32-chars"

# Optional
JWT_EXPIRATION=86400          # Token lifetime in seconds (default: 24 hours)
PORT=4000                      # Server port (default: 4000)
FRONTEND_URL=http://localhost:5173  # CORS origin
NODE_ENV=development           # Set to 'production' in production
```

---

## Database Setup

ShieldForge uses Prisma with PostgreSQL:

```bash
# Start PostgreSQL (using Docker)
docker compose up -d

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

---

## Frontend Integration

### React Context Provider

```tsx
import { AuthProvider, useAuth } from '@shieldforge/frontend';

function App() {
  return (
    <AuthProvider>
      <MyApp />
    </AuthProvider>
  );
}

function MyApp() {
  const { user, login, logout, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <LoginForm onSubmit={login} />;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## API Reference

### GraphQL Types

| Type | Description |
|------|-------------|
| `UserType` | User object with id, email, name, createdAt, updatedAt |
| `AuthPayloadType` | Contains token and user after login/register |
| `MessageType` | Simple response with message and success boolean |

### GraphQL Operations

#### Mutations

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

#### Queries

```graphql
# Get current user
query Me {
  me { id email name createdAt updatedAt }
}

# Health check
query Health {
  health
}
```

### Service Functions

| Function | Description |
|----------|-------------|
| `register(email, password, name?)` | Create new user account |
| `login(email, password)` | Authenticate user |
| `logout(token)` | Invalidate session |
| `verifyToken(token)` | Validate JWT and return user |
| `getCurrentUser(token)` | Get user from token |

---

## Development

### Project Structure

```
shieldforge/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── graphql/
│   │   │   │   ├── fields/          # Composable field definitions
│   │   │   │   │   ├── query-fields.ts
│   │   │   │   │   └── mutation-fields.ts
│   │   │   │   ├── types.ts         # GraphQL types
│   │   │   │   ├── queries.ts       # Query type
│   │   │   │   ├── mutations.ts     # Mutation type
│   │   │   │   ├── schema.ts        # Complete schema
│   │   │   │   └── index.ts         # GraphQL exports
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts  # Auth business logic
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── index.ts             # Library exports
│   │   │   ├── server.ts            # Standalone server
│   │   │   └── db.ts                # Prisma client
│   │   └── prisma/
│   │       └── schema.prisma
│   └── frontend/
│       └── src/
│           ├── components/
│           ├── context/
│           └── graphql/
├── docker-compose.yml
└── .devcontainer/
```

### Running Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or run separately
npm run dev:backend
npm run dev:frontend
```

### Building for Production

```bash
npm run build
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

---

## Intent & Design Principles

> **For AI Assistants & Contributors**: This section documents the design intent to help maintain consistency.

### Core Principles

1. **Modularity First**: Every component should be independently importable
2. **Non-Breaking Changes**: New features should not break existing implementations
3. **Type Safety**: Full TypeScript with strict mode
4. **Security by Default**: Secure defaults, explicit opt-in for less secure options
5. **Composability**: GraphQL fields can be spread into any schema

### Export Strategy

- **Default export**: None (explicit imports only)
- **Named exports**: All public APIs
- **Subpath exports**: `@shieldforge/backend/graphql`, `/services`, `/middleware`

### Extending ShieldForge

When adding new features:
1. Add new field definitions in `/fields/`
2. Export from `/graphql/index.ts`
3. Update `/index.ts` main exports
4. Add tests
5. Update this README

---

## License

MIT License - see [LICENSE](LICENSE) for details.
