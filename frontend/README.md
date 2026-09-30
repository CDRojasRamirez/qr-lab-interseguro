# Frontend

Angular 21 SPA (standalone components, zoneless, signals, Vitest). See the
[root README](../README.md) for the full stack and runtime configuration.

## Commands

```bash
npm ci --legacy-peer-deps      # install
npm start                      # dev server on http://localhost:4200
npx ng test --watch=false      # unit tests (Vitest)
npx ng build                   # production build into dist/
```

The dev server reads `public/config.json` for the API URLs; the container generates
that file at start from environment variables.
