# ShieldForge Complete Example

This directory contains a complete, production-ready example of how to integrate ShieldForge into a React/Node/GraphQL application.

## Quick Start

```bash
# Install dependencies
npm install @appforgeapps/shieldforge-core @appforgeapps/shieldforge-react @appforgeapps/shieldforge-graphql @appforgeapps/shieldforge-types

# Optional: For passkey support
npm install @appforgeapps/shieldforge-passkey @appforgeapps/shieldforge-browser
```

## Architecture

This example demonstrates:
- **Backend**: Express + GraphQL server with ShieldForge authentication
- **Frontend**: React app with ShieldForge hooks and components
- **Database**: Mock database (easily replaceable with your preferred DB)
- **Features**: Login, registration, password reset, profile management, and passkey support

## File Structure

```
examples/complete-app/
├── README.md (this file)
├── backend/
│   ├── server.ts          # Express server setup
│   ├── schema.ts          # GraphQL schema with ShieldForge
│   ├── resolvers.ts       # GraphQL resolvers
│   ├── database.ts        # Mock database layer
│   └── config.ts          # ShieldForge configuration
├── frontend/
│   ├── App.tsx            # Main React app
│   ├── AuthContext.tsx    # ShieldForge AuthProvider setup
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── Dashboard.tsx
│   │   └── ProtectedRoute.tsx
│   └── graphql/
│       └── queries.ts     # GraphQL queries/mutations
└── package.json           # Dependencies for the example
```

## See Individual Files

Each file in this example is extensively commented to show exactly how to use ShieldForge:

- `backend/config.ts` - How to configure ShieldForge with your secrets
- `backend/schema.ts` - How to integrate GraphQL schema
- `backend/resolvers.ts` - How to create resolvers with ShieldForge
- `frontend/App.tsx` - How to wrap your React app
- `frontend/components/LoginForm.tsx` - How to implement login
- `frontend/components/Dashboard.tsx` - How to use the useAuth hook

## Running the Example

See the comments in each file for detailed explanations. The code is production-ready and can be adapted to your specific needs.
