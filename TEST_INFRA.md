# E2E Test Infrastructure - de-escape-app

This document outlines the End-to-End (E2E) testing strategy, architecture, and test cases designed for the `de-escape-app` application.

## Test Strategy Overview

We use a custom, lightweight, high-performance E2E testing framework built with TypeScript and `tsx`. The framework targets the application from the outside by executing simulated HTTP calls, testing Next.js Server Actions directly, and validating database mutations on a live backend.

### Key Benefits
- **Deterministic**: No flaky browser interactions.
- **Opaque-Box**: Tests interact through official server entrypoints (actions/endpoints) and verify the final state.
- **Network-Isolated**: Siteverify (Turnstile) endpoints are intercepted/stubbed.
- **Speed**: Runs 60 tests in under 2 seconds.

---

## 4-Tier Test Case Structure

Our test suite is organized into 4 distinct tiers to ensure comprehensive coverage across unit boundaries, boundaries, integration paths, and complex real-world workflows.

### Tier 1: Feature Coverage (25 Tests)
Ensures every core feature behaves correctly under standard conditions.

#### 1. Admin Login
- **T1.1.1**: Send magic-link request with a valid admin email.
- **T1.1.2**: Complete authentication code exchange for admin user.
- **T1.1.3**: Access the admin dashboard layout with authenticated session.
- **T1.1.4**: Reject access to admin pages for anonymous/non-admin sessions.
- **T1.1.5**: Support logging out and destroying admin sessions.

#### 2. Event CRUD
- **T1.2.1**: Create a new draft event with standard fields.
- **T1.2.2**: Retrieve details of an existing event by ID/slug.
- **T1.2.3**: Update editable fields of a draft event.
- **T1.2.4**: Cancel an existing event.
- **T1.2.5**: Delete a draft event.

#### 3. Event Publishing
- **T1.3.1**: Publish a draft event.
- **T1.3.2**: Prevent public directory search/retrieval for draft events.
- **T1.3.3**: Allow public directory retrieval for published events.
- **T1.3.4**: Handle auto-transition to "past" status when current time is past event end_at.
- **T1.3.5**: Handle transitions to "sold_out" status when capacity is fully registered.

#### 4. Attendee Registration
- **T1.4.1**: Register an attendee for a free event.
- **T1.4.2**: Register an attendee for a manual UPI payment event (awaiting verification).
- **T1.4.3**: Reject manual UPI registration without payment proof.
- **T1.4.4**: Retrieve registration status using ticket/pass code.
- **T1.4.5**: Perform admin action to approve/reject registration.

#### 5. Audit Logging
- **T1.5.1**: Log event creation actions to the audit log.
- **T1.5.2**: Log event update/status transition actions to the audit log.
- **T1.5.3**: Log attendee registration approval/rejection actions to the audit log.
- **T1.5.4**: Record target table and target ID for audit log entries.
- **T1.5.5**: Enforce that audit logs are write-only/read-only for admins.

---

### Tier 2: Boundary & Corner Cases (25 Tests)
Validates system limits, edge values, validation constraints, and error scenarios.

#### 1. Admin Login
- **T2.1.1**: Reject magic-link requests for blank or invalid email formats.
- **T2.1.2**: Reject magic-link code exchange with expired or invalid OTP tokens.
- **T2.1.3**: Rate-limit login requests to prevent OTP brute-forcing.
- **T2.1.4**: Enforce email address domain constraints or exact admin list match.
- **T2.1.5**: Ensure expired sessions are strictly rejected on Next.js Middleware route guards.

#### 2. Event CRUD
- **T2.2.1**: Prevent event creation with a duplicate slug.
- **T2.2.2**: Reject events where end time is before start time.
- **T2.2.3**: Enforce maximum character limits on event title and tagline.
- **T2.2.4**: Enforce that event capacity cannot be negative.
- **T2.2.5**: Prevent editing fields of a cancelled event.

#### 3. Event Publishing
- **T2.3.1**: Prevent publishing an event with missing mandatory fields (e.g. category, start_at).
- **T2.3.2**: Enforce that past events cannot be published.
- **T2.3.3**: Prevent editing a published event's price or payment mode.
- **T2.3.4**: Handle transition to "sold_out" status immediately when capacity matches exactly.
- **T2.3.5**: Retain publishing status when event is updated.

#### 4. Attendee Registration
- **T2.4.1**: Reject registration when event capacity is exceeded.
- **T2.4.2**: Enforce validation for required custom fields on registration.
- **T2.4.3**: Reject registration from blocked/banned contact phone or email.
- **T2.4.4**: Enforce minimum age requirements for event registrations.
- **T2.4.5**: Enforce UPI screenshot validation (cannot be empty if UPI payment selected).

#### 5. Audit Logging
- **T2.5.1**: Handle audit logging failures gracefully without crashing the parent transaction.
- **T2.5.2**: Prevent deletion of audit logs by anyone, including super admins (RLS restriction).
- **T2.5.3**: Truncate extremely long payload sizes in audit log detail JSON blocks.
- **T2.5.4**: Verify audit log entry timestamps are accurately generated by DB triggers.
- **T2.5.5**: Prevent unauthenticated users from querying the audit logs endpoint.

---

### Tier 3: Cross-Feature Combinations (5 Tests)
Verifies interactions and integrations across multiple features.

- **T3.1 (Registration/Capacity/SoldOut)**: Creating an event, publishing it, registering multiple attendees until capacity is hit, and verifying the event status transitions automatically to `sold_out` and subsequent registration requests are rejected.
- **T3.2 (Registration/Payment/AdminApproval/AuditLog)**: Registering for a manual UPI event, verifying it is in `awaiting_verification` status, an admin approving the registration, confirming status becomes `approved`, and verifying that the action and status transition are correctly logged in the `audit_log`.
- **T3.3 (EventCancellation/Refund/Notification)**: Cancelling a published event with registered attendees, verifying that the event status changes to `cancelled`, registrations are set to `refunded`, and refund operations are logged.
- **T3.4 (AdminRoleEscalation/AccessGuard)**: Creating a new user, verifying they cannot access admin dashboard. Then, updating their role in the database, verifying they gain dashboard access, and recording this escalation in the audit logs.
- **T3.5 (BulkRegistration/DraftStatePrevent)**: Attempting to register for a draft event (which should fail), then publishing the event, registering attendees, and verifying registrations are accepted only after publication.

---

### Tier 4: Real-world Application Scenarios (5 Tests)
Simulates end-to-end, multi-actor, real-world user journeys.

- **T4.1 (Attendee Event Journey - UPI)**: Attendee discovers a published event -> registers with UPI payment details -> uploads screenshot -> receives a ticket code -> admin verifies payment -> attendee ticket becomes active -> attendee checks ticket status.
- **T4.2 (Organizer Event Lifecycle)**: Admin logs in -> creates a new event -> updates description -> publishes event -> attendees register -> admin monitors registration count on the KPI dashboard -> event reaches start time and status changes to past.
- **T4.3 (Refund and Dispute Resolution)**: Attendee registers -> pays -> requests cancellation/refund -> admin logs in -> views attendee registration -> marks as refunded -> admin logs show the audit trail -> seat is freed for other attendees.
- **T4.4 (Turnstile Verification Interception)**: A user submits a registration form -> the system intercepts and forwards the Turnstile siteverify challenge to Cloudflare -> the test runner stubs the Cloudflare response -> the registration succeeds without external network dependency.
- **T4.5 (Spam Prevention and IP Ban)**: A malicious user spams the registration form -> admin detects spam and blocks the user's email/phone -> user attempts to register again with same details -> system rejects the request immediately -> block action is logged.

---

## Running the E2E Tests

### CLI Command
To execute the full E2E test suite, run:
```bash
npm run test:e2e
```
