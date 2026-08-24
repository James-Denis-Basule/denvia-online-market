# Denvia Online Market (DOM) Development Rules

## Development Rules

1. Understand the existing architecture before modifying code.
2. Preserve working functionality and avoid unnecessary rewrites.
3. Follow the existing React + TypeScript + Vite frontend architecture and Express + TypeScript + MongoDB/Mongoose backend architecture.
4. Reuse existing routes, controllers, services, models, components, and API clients where appropriate.
5. Never trust client-supplied prices, product data, inventory, business ownership, order ownership, roles, payment state, or delivery state. These must be validated server-side.
6. Enforce authentication, authorization, resource ownership, and role checks on protected operations.
7. Never expose secrets, credentials, tokens, API keys, or environment variables in source code or commits.
8. Do not use demo/mock fallbacks to conceal real API failures unless explicitly requested.
9. Do not introduce duplicate APIs or parallel implementations when an existing implementation can be reused.
10. Keep frontend and backend API contracts synchronized.
11. Follow the DOM SRS as the functional source of truth.
12. Do not consider a requirement implemented merely because a route, controller, model, or page file exists. Verify the actual end-to-end behavior.
13. Make focused, incremental changes. Do not modify unrelated files.
14. Before implementing a feature, inspect the relevant existing code and dependencies.
15. After meaningful changes, run the appropriate linting, tests, type checks, and builds.
16. Fix regressions caused by the current task before considering the task complete.
17. Report all files changed and explain the purpose of each change.
18. Clearly report tests and commands that were run and their results.
19. Do not commit or push changes unless explicitly instructed.
20. For security-sensitive changes, prefer secure failure over permissive fallback behavior.
21. When requirements are ambiguous, stop and ask for clarification rather than inventing behavior.
22. Work through the project according to the approved implementation roadmap rather than independently choosing unrelated features.

## Current Priority Order

1. **Priority 1:** Backend security and data integrity.
2. **Priority 2:** Reliable configuration and startup.
3. **Priority 3:** Frontend authentication and authorization-aware routing.
4. **Priority 4:** Core customer marketplace journey.
5. **Priority 5:** Seller operations.
6. **Priority 6:** Reviews, wishlist, notifications, profile, and administration.
7. **Priority 7:** Production payment/courier integrations and comprehensive testing.
