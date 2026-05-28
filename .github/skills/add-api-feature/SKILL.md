---
name: add-api-feature
description: 'Add a complete API feature across backend routes, backend Jest tests, frontend Redux slice, and UI integration in this Node.js/React project. Use when implementing a new domain feature that must follow existing createRouter dependency injection, route registration, test data patterns, and Redux Toolkit conventions.'
argument-hint: 'Describe the feature name, endpoints, auth requirements, data file(s), and UI surface area'
user-invocable: true
---

# Add API Feature

## What This Skill Produces

A complete, convention-aligned feature implementation that includes:

- A backend router at `backend/routes/<feature>.js` using dependency-injected helpers (`readJSON`, `writeJSON`, `authenticateToken`) and `express.Router()`.
- Route registration in `backend/routes/index.js`.
- Jest integration tests at `backend/tests/<feature>.test.js` using the same test app wiring and JSON helpers used by existing tests.
- A Redux slice at `frontend/src/store/<feature>Slice.js` using Redux Toolkit (`createSlice`, `createAsyncThunk`) and matching async status patterns.
- UI integration updates (components + store registration) so the new feature is visible and usable in the app.

## When To Use

- You are adding a new domain capability that spans API, tests, state, and UI.
- You want to follow existing project conventions instead of introducing a new architecture.
- You need reproducible feature delivery with clear completion checks.

## Inputs To Collect First

- Feature name (singular/plural and URL path), for example `wishlist` -> `/api/wishlist`.
- Data source file(s), for example a new file in `backend/data/` or existing files like `users.json`.
- Authentication requirements per endpoint (public vs `authenticateToken`).
- UI entry point and interaction model (new section, button, details panel, etc.).
- Whether feature state is global (Redux slice) or local-only.

## Naming And File Rules

- Backend route file: `backend/routes/<feature>.js`
- Backend test file: `backend/tests/<feature>.test.js`
- Frontend slice file: `frontend/src/store/<feature>Slice.js`
- Slice symbol naming:
  - thunk types: `'<feature>/<action>'`
  - slice name: `name: '<feature>'`
  - exported reducer default: `<feature>Slice.reducer`
- Keep URLs explicit and consistent with existing code, for example `http://localhost:4000/api/<feature>`.

## Existing Examples To Mirror

- Backend route injection and router shape:
  - `backend/routes/books.js`
  - `backend/routes/favorites.js`
  - `backend/routes/reviews.js`
- Central route registration:
  - `backend/routes/index.js`
- Backend Jest integration style:
  - `backend/tests/books.test.js`
  - `backend/tests/favorites.test.js`
  - `backend/tests/reviews.test.js`
- Redux Toolkit slice conventions:
  - `frontend/src/store/booksSlice.js`
  - `frontend/src/store/favoritesSlice.js`
  - `frontend/src/store/reviewsSlice.js`
- Store registration and UI wiring:
  - `frontend/src/store/index.js`
  - `frontend/src/App.jsx`
  - feature components under `frontend/src/components/`

## Workflow

1. Define feature contract
- Write endpoint list first: method, path, request body/query, response body, auth requirement.
- Map each endpoint to data operations (`readJSON`/`writeJSON`) and error cases.

2. Create backend route
- Add `backend/routes/<feature>.js`.
- Export a factory function using injected dependencies, matching this shape:

```js
const express = require('express');

function createFeatureRouter({ readJSON, writeJSON, authenticateToken, ...deps }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    // readJSON(...) and respond
  });

  router.post('/', authenticateToken, (req, res) => {
    // validate, mutate, writeJSON(...)
  });

  return router;
}

module.exports = createFeatureRouter;
```

- Keep validation and status code behavior explicit (`400`, `401`, `403`, `404`, `200/201`).
- Use idempotent behavior where it matches existing patterns.

3. Register route in API index
- Update `backend/routes/index.js`:
  - `require('./<feature>')`
  - mount with `router.use('/<feature>', createFeatureRouter(deps));`
- Preserve existing route order unless your feature depends on a specific prefix ordering.

4. Add backend tests
- Create `backend/tests/<feature>.test.js` using `supertest` + express app bootstrap pattern from existing tests.
- Default to dedicated test fixtures in `backend/data/test-<feature>.json` (and additional `test-*.json` files as needed) so test setup is deterministic and isolated.
- If the feature uses mutable shared fixtures, include reset/copy setup following existing `copy-test-data.sh` conventions.
- Use in-memory stubs only for truly read-only logic where file mutation is not part of behavior under test.
- Use helper pattern already in tests:
  - `readJSON: (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : []`
  - `writeJSON: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))`
- For auth scenarios, mirror token helper usage in `favorites.test.js`/`reviews.test.js`.
- Include at minimum:
  - success path for each endpoint
  - auth required path (if protected)
  - validation failure(s)
  - not-found / empty-state behavior
  - idempotency behavior when relevant

5. Add Redux slice
- Create `frontend/src/store/<feature>Slice.js` with:
  - async thunks for API calls
  - `status` fields (`idle`, `loading`, `succeeded`, `failed`)
  - reducers for local state updates as needed
  - `extraReducers` for thunk lifecycle
- Keep API style and auth headers aligned with existing slices.
- Export selectors if the feature drives filtered/derived UI.

6. Register slice in store
- Update `frontend/src/store/index.js`:
  - import `<feature>Reducer`
  - add `<feature>: <feature>Reducer` to `configureStore({ reducer: { ... } })`

7. Surface feature in UI
- Add or update component(s) in `frontend/src/components/`.
- Trigger thunks from UI interactions and render loading/error/empty states.
- Wire component into `frontend/src/App.jsx` or feature-relevant component tree.
- If the feature is user-specific, ensure token flow aligns with existing `user` state usage.

8. Validate end-to-end
- Backend tests:

```bash
npm run test:backend
```

- Frontend + e2e tests (for UI changes):

```bash
npm run build:frontend && npm run test:frontend
```

- Confirm no regressions in existing routes and UI screens.

## Completion Checklist

- `backend/routes/<feature>.js` exists and follows dependency injection pattern.
- `backend/routes/index.js` mounts the new route.
- `backend/tests/<feature>.test.js` covers success, auth, validation, and edge cases.
- `frontend/src/store/<feature>Slice.js` is added and registered in `frontend/src/store/index.js`.
- UI components expose the feature and handle loading/error states.
- Required test commands pass.

## Decision Points

- Should endpoints be nested under an existing resource (for example `/books/:id/<feature>`) or top-level (`/<feature>`)?:
  - If feature lifecycle belongs to a parent entity, prefer nested.
  - If feature is cross-resource or user-scoped, prefer top-level.
- Should data be stored in an existing file or a new JSON file?:
  - Prefer existing file when feature augments existing entity shape.
  - Use a new file when feature has its own collection and lifecycle.
- Optimistic UI update vs refetch after mutation?:
  - Refetch for correctness-first behavior.
  - Optimistic update only when rollback/error handling is clearly implemented.

## Sample Usage Prompt

```text
/add-api-feature Add a "reading-goals" feature with:
- backend route at /api/reading-goals (GET current goals, POST create/update)
- auth required for all endpoints
- persistence in backend/data/users.json under each user
- backend Jest tests for success/auth/validation cases
- Redux slice readingGoalsSlice.js with fetch and save thunks
- UI in a new ReadingGoals component shown on the main page for logged-in users
Follow existing route injection and Redux conventions in this repo.
```