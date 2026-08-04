# Unit Test Summary

## Test Framework
- **Framework:** Jest v29.7.0
- **HTTP Testing:** Supertest v7.2.2
- **Approach:** Unit testing with mocked models (no live database required)

## Run Command
```bash
npm test
```

## Test Files

### 1. `__tests__/auth.test.js` — User Authentication

| # | Test Case | Type | Expected Result |
|---|-----------|------|-----------------|
| 1 | Successful registration redirects to login | Success | `302` redirect to `/login` |
| 2 | Successful login creates a session and redirects to profile | Success | `302` redirect to `/profile` |
| 3 | Failed login (wrong password) redirects back to login | Failure | `302` redirect to `/login` |

---

### 2. `__tests__/flightController.test.js` — Flight Management

| # | Test Case | Type | Expected Result |
|---|-----------|------|-----------------|
| 1 | Creates a flight and redirects on success | Success | Redirect to `/admin/flights`, audit logged |
| 2 | Rejects when flight number already exists | Failure | `400` error |
| 3 | Rejects when departure is not before arrival | Failure | `400` error |
| 4 | Updates a flight and returns success JSON | Success | `200` with `{ success: true }` |
| 5 | Returns 400 when required fields are missing (update) | Failure | `400` error |
| 6 | Returns 404 when flight to update is not found | Failure | `404` error |
| 7 | Deletes a flight and returns success JSON | Success | `200` with `{ success: true }`, audit logged |
| 8 | Returns 404 when flight to delete is not found | Failure | `404` error |

---

### 3. `__tests__/reservationController.test.js` — Reservation Management

| # | Test Case | Type | Expected Result |
|---|-----------|------|-----------------|
| 1 | Creates a reservation, decrements seats, and redirects | Success | Redirect to `/admin/reservations`, audit logged |
| 2 | Rejects reservation when flight number does not exist | Failure | `404` error |
| 3 | Rejects reservation when flight has no available seats (business rule) | Business Rule | `400` error — "Only 0 seat(s) left" |
| 4 | Rejects reservation when selected seat is already taken (business rule) | Business Rule | `400` error — "already taken" |
| 5 | Cancels a reservation, releases the seat, and returns success | Success | `200`, status changed to `Cancelled`, seat restored |
| 6 | Returns 404 when reservation to cancel is not found | Failure | `404` error |
| 7 | Rejects cancelling a reservation that is already cancelled | Failure | `400` error |
| 8 | Rejects an invalid reservation ID format | Failure | `400` error |

---

### 4. `__tests__/bookingController.test.js` — Booking (Passenger-Side)

| # | Test Case | Type | Expected Result |
|---|-----------|------|-----------------|
| 1 | Rejects booking when the flight has no available seats (business rule) | Business Rule | Renders booking page with error |
| 2 | Rejects booking when the selected seat is already taken (business rule) | Business Rule | Renders booking page with error |
| 3 | Successfully books a flight when seat is available and unoccupied | Success | Redirect to `/my-reservations`, audit logged |
| 4 | Rejects booking when required passenger fields are missing | Failure | Renders booking page with validation errors |

---

## Test Summary

| Category | Total Tests | Success Cases | Failure Cases | Business Rule Tests |
|----------|:-----------:|:-------------:|:-------------:|:-------------------:|
| User Authentication | 3 | 2 | 1 | 0 |
| Flight Management | 8 | 3 | 5 | 0 |
| Reservation Management | 8 | 2 | 6 | 2 |
| Booking (Passenger) | 4 | 1 | 3 | 2 |
| **Total** | **23** | **8** | **15** | **4** |

## Business Rule Validations Covered

1. **Booking a flight with no available seats** — Tests that the system rejects bookings when `availableSeats` is 0.
2. **Selecting an occupied seat** — Tests that the system prevents double-booking of the same seat on the same flight.
3. **Creating a reservation with no seats left** — Validates the admin creation path also enforces seat availability.
4. **Creating a reservation with a taken seat** — Validates the admin creation path also checks for seat conflicts.
