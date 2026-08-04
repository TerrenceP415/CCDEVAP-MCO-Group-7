# RBAC Permission Matrix

## User Roles

| Role | Description |
|------|-------------|
| **Administrator** (`admin`) | Full system access — manages flights, reservations, users, and audit logs |
| **Passenger** (`passenger`) | Self-service access — profile, search, booking, and own reservations |

## Permission Matrix

| Feature / Action | Passenger | Administrator |
|-----------------|:---------:|:-------------:|
| **Authentication** | | |
| Register | ✅ | ✅ |
| Login / Logout | ✅ | ✅ |
| **Profile** | | |
| View own profile | ✅ | ✅ |
| Update own profile | ✅ | ✅ |
| **Flights** | | |
| Search available flights | ✅ | ✅ |
| View flight details | ✅ | ✅ |
| Create flight | ❌ | ✅ |
| Update flight | ❌ | ✅ |
| Delete flight | ❌ | ✅ |
| **Reservations** | | |
| Book a flight | ✅ | ❌ |
| View own reservations | ✅ | ❌ |
| Cancel own reservation | ✅ | ❌ |
| Update seat on own reservation | ✅ | ❌ |
| View all reservations | ❌ | ✅ |
| Create reservation (any user) | ❌ | ✅ |
| Update any reservation | ❌ | ✅ |
| Delete any reservation | ❌ | ✅ |
| **User Management** | | |
| View all users | ❌ | ✅ |
| Create user account | ❌ | ✅ |
| Update user account | ❌ | ✅ |
| Delete user account | ❌ | ✅ |
| **Audit Trail** | | |
| View audit logs | ❌ | ✅ |
| **Admin Panel** | | |
| Access admin dashboard | ❌ | ✅ |

## Access Control Enforcement

### Middleware Stack

1. **`isAuthenticated`** — Checks `req.session.user` exists. Redirects to `/login` if not.
2. **`requireRole(role)`** — Checks `req.session.user.role` matches the required role. Redirects to `/` with an error message if not.

### Ownership Enforcement

For passenger-facing reservation routes (`cancel`, `update seat`), the controller verifies that `reservation.userId` matches `req.session.user._id`. This prevents passengers from modifying other users' reservations even if they know the reservation ID.

### Route Protection Summary

- Public routes (home, search, login, register) require no authentication.
- Passenger routes (booking, my-reservations, profile) require authentication.
- Admin routes (`/admin/*`) require both authentication and `admin` role.
