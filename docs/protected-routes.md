# Protected Routes

The application protects these routes with the authentication middleware so unauthenticated users are redirected to the login page:

- /profile
- /settings
- /admin/dashboard
- /admin/flights
- /admin/reservations

Behavior:
- Unauthenticated access redirects to /login.
- After successful login, the user is sent back to the originally requested page.
- Logging out destroys the session and clears the session cookie.
