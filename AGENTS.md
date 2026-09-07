# webflix contributor guide

## Overview

`webflix` is the Next.js frontend for the Webflix application. It uses the App Router, React, TypeScript, Tailwind CSS, Radix UI components, Framer Motion, and Prisma for database access.

## Important directories

- `app/` — App Router pages, layouts, and global styles.
- `components/` — reusable UI and media-browsing components.
- `lib/` — server-side data loading, TMDB/backend access, Prisma access, and shared types.
- `prisma/` — Prisma schema and migrations.
- `public/` — static assets.
- `lib/auth-client.ts` and `app/auth/` — Better Auth client/session UI.

## Development commands

- `npm run dev` — start the Next.js development server.
- `npm run build` — create a production build.
- `npm run start` — serve the production build.
- After changing `prisma/schema.prisma`, regenerate the client with `npx prisma generate`; use the repository's configured Prisma migration workflow for database changes.

There is currently no test or lint script in `package.json`. Run the production build after meaningful TypeScript, routing, data, or configuration changes.

## Conventions

- Keep TypeScript strict and use the `@/*` path alias for imports from the repository root.
- Respect server/client boundaries. Files that import `server-only`, Prisma, or secrets must remain server-side and must not be imported by client components.
- Route application data through the helpers in `lib/data.ts` and `lib/tmdb.ts` rather than duplicating API-shape normalization in components.
- Keep authenticated requests pointed at the backend Better Auth origin and use `credentials: 'include'` so the session cookie is sent.
- The frontend expects the backend API at `http://127.0.0.1:3005` during local development. Keep credentials in local environment files; never commit secrets or copy values from `.env` into source code.
- Treat generated Prisma output as generated code. Change `prisma/schema.prisma` and regenerate rather than editing generated files directly.
- Preserve existing visual patterns and responsive behavior when modifying the media cards, rows, browser, hero, or detail modal.

## Validation and safety

- Check the relevant page and loading/error states when changing data fetching or UI behavior.
- Run `npm run build` before handing off substantial changes.
- Do not remove or overwrite unrelated working-tree changes.
