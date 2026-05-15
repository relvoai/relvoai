# Install Required Packages

Before running the build, you need to install the new dependencies:

```bash
yarn install
```

This will install:
- `axios` - HTTP client
- `@tanstack/react-query` - Data fetching/caching
- `zustand` - State management

# Configure Environment Variable

Create or update `.env.local` with your backend API URL:

```bash
VITE_API_BASE_URL=http://your-backend-url/api/v1
```

# Verify Build

```bash
yarn build
```
