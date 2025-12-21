# Technical Standards & Best Practices

This document outlines the coding standards and best practices for the Actory project, specifically focusing on Next.js 15+ (App Router) compliance and BetterAuth data schema requirements.

## 1. Next.js App Router Best Practices (2025)

### Component Architecture
*   **Server Components by Default**: All components should be Server Components unless they explicitly require client-side interactivity (hooks, event listeners).
*   **"use client" Directive**: Place `'use client'` at the very top of files that need to be Client Components. Keep these as leaf nodes in the component tree whenever possible to maximize strict server rendering for parents.
*   **Colocation**: Group files by feature/route.
    *   `app/(dashboard)/projects/page.tsx`
    *   `app/(dashboard)/projects/components/ProjectCard.tsx`
*   **Layouts**: Use `layout.tsx` for shared UI (navbars, sidebars) to persist state across navigation.

### Data Fetching
*   **Fetch on Server**: Fetch data directly in Server Components using `async/await` and Drizzle ORM.
*   **Server Actions**: Use Server Actions for all data mutations (POST/PUT/DELETE). Avoid API Routes (`pages/api` or `route.ts`) for internal data mutations unless necessary for external webhooks.
*   **No `useEffect` for Data**: Avoid fetching initial data in `useEffect`. Pass data from parent Server Components to Client Components as props.

### State Management
*   **URL as State**: Store shareable state (search params, filters, active tabs) in the URL (`searchParams`) rather than `useState`.
*   **Server State**: Rely on revalidating data via Server Actions (`revalidatePath`, `revalidateTag`) rather than complex client-side stores for server data.
*   **Client State**: Use `useState` or `useReducer` only for purely UI state (modals, form inputs before submission).

### Project Structure (src/app)
```
src/
  app/
    (auth)/           # Route group for auth pages (login, register)
    (dashboard)/      # Route group for protected app pages
      projects/
        [id]/
          page.tsx
          loading.tsx
          error.tsx
    layout.tsx        # Root layout
    globals.css
  components/         # Shared UI components (Button, Input)
  lib/                # Utilities, Drizzle client, reusable logic
  db/                 # Database schema and migrations
  server/             # Server Actions (if not colocated)
```

## 2. BetterAuth Database Schema

We will use BetterAuth for authentication. The database schema must include the following core tables. We will adhere to these field names to ensure compatibility with BetterAuth's default adapters.

### Table: `user`
*   **id**: `text` (Primary Key)
*   **name**: `text`
*   **email**: `text` (Unique)
*   **emailVerified**: `boolean`
*   **image**: `text` (Optional)
*   **createdAt**: `timestamp`
*   **updatedAt**: `timestamp`

### Table: `session`
*   **id**: `text` (Primary Key)
*   **expiresAt**: `timestamp`
*   **token**: `text` (Unique) - Note: BetterAuth often calls this `token` or `sessionToken`.
*   **createdAt**: `timestamp`
*   **updatedAt**: `timestamp`
*   **ipAddress**: `text` (Optional)
*   **userAgent**: `text` (Optional)
*   **userId**: `text` (Foreign Key -> user.id)

### Table: `account`
*   **id**: `text` (Primary Key)
*   **accountId**: `text` (Provider's native user ID)
*   **providerId**: `text` (e.g., "google")
*   **userId**: `text` (Foreign Key -> user.id)
*   **accessToken**: `text` (Optional)
*   **refreshToken**: `text` (Optional)
*   **idToken**: `text` (Optional)
*   **accessTokenExpiresAt**: `timestamp` (Optional)
*   **refreshTokenExpiresAt**: `timestamp` (Optional)
*   **scope**: `text` (Optional)
*   **password**: `text` (Optional)
*   **createdAt**: `timestamp`
*   **updatedAt**: `timestamp`

### Table: `verification`
*   **id**: `text` (Primary Key)
*   **identifier**: `text`
*   **value**: `text`
*   **expiresAt**: `timestamp`
*   **createdAt**: `timestamp`
*   **updatedAt**: `timestamp`

*Note: Since we are using Drizzle with Turso (SQLite/LibSQL), we will define these using `sqliteTable`.*

## 3. General Coding Standards
*   **TypeScript**: Strict mode enabled. No `any`. Define strict interfaces/types for all component props and server action returns.
*   **Tailwind**: Use utility classes. Avoid `@apply` unless creating complex reusable primitives.
*   **Imports**: Use absolute imports `@/components/...` instead of `../../`.
*   **Error Handling**: Use `try/catch` in Server Actions and return standard error objects `{ success: false, error: string }`.
