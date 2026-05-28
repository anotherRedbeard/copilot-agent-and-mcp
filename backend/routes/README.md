# Backend API routes

This directory contains the Express router modules mounted under `/api`.

| Module | Mount point | Purpose |
| --- | --- | --- |
| `auth.js` | `/api` | Registration and login |
| `books.js` | `/api/books` | Read and sort the book catalog |
| `favorites.js` | `/api/favorites` | Manage the authenticated user's favorite books |
| `reviews.js` | `/api/books` | Book review system (per-book reviews + average rating) |

## Reviews API

The reviews router exposes the following endpoints. Reviews are persisted in
`backend/data/reviews.json` (or `test-reviews.json` when running tests).

### `GET /api/books/:bookId/reviews`

Returns the list of reviews for the given book, newest first.

- `200 OK` &mdash; JSON array of review objects.
- `404 Not Found` &mdash; the book id does not exist.

Each review has the following shape:

```json
{
  "id": "string",
  "bookId": "string",
  "username": "string",
  "rating": 1,
  "text": "string",
  "createdAt": "ISO-8601 timestamp"
}
```

### `GET /api/books/:bookId/average-rating`

Returns the aggregate rating for the given book.

- `200 OK` &mdash; `{ "bookId": "1", "averageRating": 4.25, "count": 4 }`.
  When the book has no reviews the response is
  `{ "bookId": "1", "averageRating": 0, "count": 0 }`.
- `404 Not Found` &mdash; the book id does not exist.

### `POST /api/books/:bookId/reviews`

Submits a new review for the given book. Requires a valid JWT in the
`Authorization: <scheme> <token>` header (where `<scheme>` is the standard
token scheme used by the auth endpoints). This endpoint is additionally
rate-limited to mitigate spam (10 submissions per minute per IP).

Request body:

```json
{ "rating": 1-5, "text": "string (1-2000 chars)" }
```

Responses:

- `201 Created` &mdash; the created review object.
- `400 Bad Request` &mdash; validation error (missing/invalid rating, missing/empty text, text too long).
- `401 Unauthorized` &mdash; missing token.
- `403 Forbidden` &mdash; invalid token.
- `404 Not Found` &mdash; the book id does not exist.
- `429 Too Many Requests` &mdash; rate limit exceeded.
