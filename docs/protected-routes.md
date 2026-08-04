# Protected Routes

The application protects these routes with authentication and authorization middleware.

## Authentication Required (All Authenticated Users)

| Route | Method | Description |
|-------|--------|-------------|
| `/profile` | GET/POST | View and update user profile |
| `/settings` | GET | User settings page |
| `/my-reservations` | GET | View own reservations |
| `/flights/:id/book` | GET | Booking form (requires login) |
| `/flights/:id/book` | POST | Submit booking (requires login) |
| `/reservations/cancel/:id` | PATCH | Cancel own reservation |
| `/reservations/update/:id` | PUT | Update seat on own reservation |

## Admin Only (Authentication + Admin Role)

| Route | Method | Description |
|-------|--------|-------------|
| `/admin` | GET | Redirect to admin dashboard |
| `/admin/dashboard` | GET | Admin analytics dashboard |
| `/admin/flights` | GET | View all flights |
| `/admin/flights` | POST | Create a new flight |
| `/admin/flights/:id` | PUT | Update a flight |
| `/admin/flights/:id` | DELETE | Delete a flight |
| `/admin/reservations` | GET | View all reservations |
| `/admin/reservations/create` | POST | Create a reservation |
| `/admin/reservations/update/:id` | PUT | Update a reservation |
| `/admin/reservations/delete/:id` | DELETE | Delete a reservation |
| `/admin/reservations/flight-lookup/:flightNumber` | GET | Look up flight by number |
| `/admin/users` | GET | View all users |
| `/admin/api/users` | POST | Create a user |
| `/admin/api/users/:id` | PUT | Update a user |
| `/admin/api/users/:id` | DELETE | Delete a user |
| `/admin/audit-log` | GET | View audit trail logs |

## Public Routes (No Authentication Required)

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Home page |
| `/login` | GET/POST | Login page |
| `/register` | GET/POST | Registration page |
| `/logout` | GET | Logout (destroys session) |
| `/search` | GET | Search flights page |
| `/results` | GET | Search results page |
| `/api/flights/search` | GET | AJAX flight search API |
| `/flights/:id` | GET | Flight details page |
| `/api/flights/:id/seats` | GET | AJAX taken seats API |

## Middleware Behavior

- **Unauthenticated access** to protected routes redirects to `/login`.
- After successful login, the user is sent back to the originally requested page via `req.session.returnTo`.
- **Unauthorized role access** (e.g., passenger accessing admin pages) redirects to `/` with an access denied flash message.
- Logging out destroys the session and clears the session cookie.
- Passengers can only cancel/update their own reservations (ownership check enforced in controller).
