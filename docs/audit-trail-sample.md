# Audit Trail Sample Output

## Overview

The audit trail is stored in the MongoDB `auditlogs` collection. Each entry records an important user activity with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | Date | Date and time of the activity |
| `username` | String | Email of the user who performed the action |
| `userRole` | String | Role of the user (`admin` or `passenger`) |
| `activity` | String | Short label describing the action |
| `details` | String | Additional context about the action |

## Activities Tracked

| Activity | Trigger |
|----------|---------|
| User Registration | A new user registers an account |
| User Login | A user logs in successfully |
| User Logout | A user logs out |
| Flight Created | Admin creates a new flight |
| Flight Updated | Admin modifies a flight |
| Flight Deleted | Admin deletes a flight |
| Reservation Created | A booking is confirmed (passenger or admin) |
| Reservation Cancelled | A reservation is cancelled |
| Reservation Updated | Admin updates reservation details |
| Reservation Deleted | Admin permanently deletes a reservation |

## Sample Audit Log Entries

```json
[
  {
    "_id": "6839a1b2e4f5a6b7c8d9e0f1",
    "timestamp": "2026-08-04T14:22:10.000Z",
    "username": "passenger@skyease.com",
    "userRole": "passenger",
    "activity": "User Registration",
    "details": "New account created for John Passenger"
  },
  {
    "_id": "6839a1c3e4f5a6b7c8d9e0f2",
    "timestamp": "2026-08-04T14:23:05.000Z",
    "username": "passenger@skyease.com",
    "userRole": "passenger",
    "activity": "User Login",
    "details": "User John Passenger logged in"
  },
  {
    "_id": "6839a2d4e4f5a6b7c8d9e0f3",
    "timestamp": "2026-08-04T14:35:22.000Z",
    "username": "admin@skyease.com",
    "userRole": "admin",
    "activity": "Flight Created",
    "details": "Flight PR101 created (MNL → LAX)"
  },
  {
    "_id": "6839a3e5e4f5a6b7c8d9e0f4",
    "timestamp": "2026-08-04T14:40:15.000Z",
    "username": "admin@skyease.com",
    "userRole": "admin",
    "activity": "Flight Updated",
    "details": "Flight PR101 updated"
  },
  {
    "_id": "6839a4f6e4f5a6b7c8d9e0f5",
    "timestamp": "2026-08-04T15:01:30.000Z",
    "username": "passenger@skyease.com",
    "userRole": "passenger",
    "activity": "Reservation Created",
    "details": "Reservation SKY-M2K5X8-AB3CD4EFGH booked for flight PR101"
  },
  {
    "_id": "6839a507e4f5a6b7c8d9e0f6",
    "timestamp": "2026-08-04T15:10:45.000Z",
    "username": "passenger@skyease.com",
    "userRole": "passenger",
    "activity": "Reservation Cancelled",
    "details": "Reservation SKY-M2K5X8-AB3CD4EFGH cancelled"
  },
  {
    "_id": "6839a618e4f5a6b7c8d9e0f7",
    "timestamp": "2026-08-04T15:15:00.000Z",
    "username": "admin@skyease.com",
    "userRole": "admin",
    "activity": "Flight Deleted",
    "details": "Flight PR101 deleted"
  },
  {
    "_id": "6839a729e4f5a6b7c8d9e0f8",
    "timestamp": "2026-08-04T15:20:33.000Z",
    "username": "passenger@skyease.com",
    "userRole": "passenger",
    "activity": "User Logout",
    "details": "User John Passenger logged out"
  }
]
```

## Admin Audit Log Viewer

Administrators can view all audit log entries at `/admin/audit-log`. The page displays a table sorted by most recent activity first, showing all fields listed above. The viewer is accessible only to authenticated users with the `admin` role.
