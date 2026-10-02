# DECISIONS.md — BoardSync

This file documents all key technical choices and any deviations from the original build plan.

## Libraries Chosen
- **Drag and Drop**: `@hello-pangea/dnd` chosen over raw HTML5 DnD for accessible, polished card reordering.
- **State Management**: Zustand chosen over React Context for board state — simpler API for nested updates from WebSocket events.
- **Socket client**: Singleton module (`socketStore.js`) rather than a React context — socket needs to be reachable from Zustand actions running outside component lifecycle.
- **CSS**: Vanilla CSS with custom properties — maximum control over dark Kanban theme, no Tailwind dependency drift.
- **No Redux / React Query**: Board data volume is small (single board at a time), and WebSocket pushes replace polling; the extra complexity is unjustified.

## Deviations / Notes
- **JWT Secrets (Phase 0)**: Placeholder secrets used during development. Before deploying or sharing, replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env` with cryptographically random strings. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **bcrypt + JWT truncation (Phase 2)**: bcrypt silently truncates input to 72 bytes. JWT refresh tokens share the same first 72 bytes (header + sub), so bcrypt would treat any two tokens for the same user as identical. Fix: SHA-256 pre-hash the token (produces a 64-char hex string, always unique, always under 72 bytes) before bcrypt. This pattern is used in `User.hashRefreshToken()` and `compareRefreshToken()`.
- **Refresh token uniqueness (Phase 2)**: Added `jti: randomUUID()` to refresh token payload so tokens issued within the same second are always distinct JWT strings.
- **Optimistic drag-and-drop (Phase 7)**: Card state is updated in the UI immediately on drop, then confirmed (or rolled back) by the PATCH response. On `409 CONFLICT`, the `current` card from the response is used to roll back to the true server state — no stale data is left on screen.
- **Socket dedup on card:created / list:created (Phase 7)**: The creating client will receive its own socket event back (the server broadcasts to the room, including the sender). The store checks for existing IDs before appending to avoid duplicates.
- **Conflict highlight (Phase 7)**: Cards that were rolled back display an inline ⚠ warning banner for the duration of the toast (5 s), giving the user a clear visual of which card changed under them.
- **seed.js idempotency (Phase 8)**: The seed script detects and deletes prior seed data before inserting, so re-running does not accumulate duplicates.
- **Postman collection (Phase 5)**: `server/postman_collection.json` ships a complete collection with environment variables (`{{baseUrl}}`, `{{accessToken}}`) covering every REST route. Import into Postman and set `baseUrl=http://localhost:5000`.

