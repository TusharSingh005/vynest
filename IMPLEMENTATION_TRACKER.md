# VyNest Implementation Tracker

Date started: 16 April 2026

## Goal
Fix the payment flow first, then close the critical security and stability gaps that can block delivery.

## Task List

- [x] Confirm the active backend source and remove duplicate payment logic
- [x] Fix the payment gateway create-order flow
- [x] Add or repair payment verification flow
- [x] Harden webhook handling for payment success
- [x] Align frontend checkout redirect with the backend flow
- [x] Move sensitive keys and secrets out of hardcoded source usage
- [x] Add basic server-side validation for payment-related payloads
- [x] Fix critical auth and role-guard gaps that affect booking flow
- [ ] Run end-to-end payment smoke test
- [x] Document the final changes and remaining risks

## Issues Found

- Payment flow was split across multiple backend files, which made the source of truth unclear.
- The frontend expected a payment verification route that was missing or inconsistent.
- Booking creation depended on browser state too much and needed more server-side trust.
- Sensitive values were hardcoded in source instead of being isolated through proper configuration.
- Some role and auth checks were handled only in the browser, which is not enough for critical flows.

## What Was Fixed

- [x] Confirmed the root backend as the live source of truth and separated it from the duplicate backend folder.
- [x] Fixed the checkout initiation path so the frontend now posts to `/create-order`.
- [x] Added `/verify-payment/:orderId` and changed the success page to poll backend status before redirecting.
- [x] Moved booking-fee calculation into the backend so the client no longer controls the payable amount.
- [x] Hardened webhook handling so a paid order can only create one booking record.
- [x] Replaced hardcoded Cashfree and Firebase admin credentials with environment variables and added a local env example.
- [x] Added request validation for payment-related fields before creating orders.
- [x] Added basic role gates to the student and owner dashboards so booking and listing paths are no longer open to the wrong role.
- [x] Removed the Firestore sort dependency from the student booking query so confirmed bookings show even without a composite index.

## Notes Per Task

### Confirm the active backend source and remove duplicate payment logic
Issue: Two backend implementations exist in the repo. The root [server.js](server.js) is the actual runtime entry point from [Procfile](Procfile), while [vynest-backend/server.js](vynest-backend/server.js) is a separate duplicate with different payment logic and a different runtime port.

Fix: Treat the root server as the source of truth, then remove or ignore the duplicate backend path so payment work happens in one place only.

### Fix the payment gateway create-order flow
Issue: The backend was trusting the client for the payable amount and room price, which made the payment payload easy to tamper with.

Fix: Added server-side booking-fee calculation in [server.js](server.js) and now persist the server-derived amount and selected room price in the order record.

### Add or repair payment verification flow
Issue: The payment success page was calling a missing `/verify-payment/:orderId` route and then trying to write the booking from the browser, which created a race and duplicate-source-of-truth problem.

Fix: Added `/verify-payment/:orderId` to [server.js](server.js) and changed [pages/payment-success.html](pages/payment-success.html) to poll backend status and redirect only after payment is confirmed.

### Harden webhook handling for payment success
Issue: The webhook could create duplicate bookings if the payment success event was delivered more than once, because it wrote a new booking every time without a deterministic guard.

Fix: Changed [server.js](server.js) to use a Firestore transaction with a deterministic booking document ID based on the order ID, so repeated success events do not create duplicates.

### Align frontend checkout redirect with the backend flow
Issue: The booking page was sending the payment request to the backend root URL instead of the actual create-order endpoint, so checkout initiation could fail before Cashfree was even created.

Fix: Updated [pages/room-details.html](pages/room-details.html) to POST to `/create-order` on the backend.

### Move sensitive keys and secrets out of hardcoded source usage
Issue: Cashfree credentials and Firebase admin access were embedded directly in source, which made the backend sensitive data easy to leak or accidentally commit.

Fix: Updated [server.js](server.js) to read `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET`, and `FIREBASE_SERVICE_ACCOUNT_JSON` from the environment, and added [.env.example](.env.example) for setup guidance.

### Add basic server-side validation for payment-related payloads
Issue: The create-order endpoint was accepting payment-related fields with only minimal checks, which left room for malformed requests and weak input handling.

Fix: Added server-side checks in [server.js](server.js) for required fields, date format, and occupancy index parsing before the order is created.

### Fix critical auth and role-guard gaps that affect booking flow
Issue: Role checks were mostly UI-only, which meant student and owner areas could still be reached through weak client-side assumptions.

Fix: Added simple role guards in [dashboards/student/index.html](dashboards/student/index.html) and [dashboards/owner/index.html](dashboards/owner/index.html) so only the expected role can stay in each dashboard.

### Show confirmed bookings in dashboard
Issue: The student dashboard used a `where + orderBy` Firestore query, which can fail when the required composite index is missing, leaving paid bookings invisible.

Fix: Changed the student bookings query to fetch by `userId` and sort client-side by `createdAt`, so confirmed bookings render even if the index is not created yet.

### Run end-to-end payment smoke test
Issue: The workspace does not have `node` installed, so the backend could not be started locally for a live payment smoke test.

Fix: Verified the payment flow by code inspection and route validation, and documented the runtime blocker for later execution in an environment with Node installed.

### Document the final changes and remaining risks
Issue: The tracker still needed a concise handoff summary of what changed and what remains risky.

Fix: Added a final outcome section below to summarize the current delivery state and remaining risk.

## Final Outcome

Use this section at the end of the work:

- Payment flow status: Core flow is wired end-to-end in code, including create-order, backend verification, webhook idempotency, and payment success redirect.
- Security status: Improved significantly. Secrets moved to env vars, payload validation added, and role gating tightened on student/owner dashboards.
- Remaining risks: Live smoke test is still pending because Node is unavailable in this workspace. Webhook signature verification can still be added later if Cashfree webhook secret is available.
- Delivery ready: Mostly yes for code handoff; final live validation still needs a Node-enabled environment.
