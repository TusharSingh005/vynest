# VyNest Scope Confirmation (Payment + Critical Security Fixes)

Date: 15 April 2026  
Project: VyNest  
Prepared by: Sumit Srivastava 
Client/Requester: Tushar Singh

## 1. Purpose
This document confirms the exact scope of work for the current engagement so both sides are aligned on deliverables, timeline, and payment.

## 2. Agreed Budget
Total Cost: Rs 8,000 (fixed)

## 3. Delivery Timeline
Start Date: 15 April 2026  
Due Date: 20 April 2026

## 4. In-Scope Work (Included)
### A) Payment Gateway Stabilization
1. Fix end-to-end payment flow so successful payment can complete booking flow correctly.
2. Ensure failed/cancelled payment does not create booking.
3. Fix order status handling for basic success/failure consistency.
4. Resolve current payment verification mismatch causing booking completion issues.

### B) Critical Security Fixes (Limited Scope)
1. Move sensitive keys/secrets out of hardcoded runtime usage into environment-based configuration (where applicable in current setup).
2. Add basic webhook hardening checks to reduce fake/replayed success handling risk.
3. Add minimum server-side validation/guardrails for payment-related payload handling.
4. Fix critical auth/role guard gaps directly affecting payment and booking integrity.

### C) Stability and Handover
1. Basic regression check for impacted flow (payment + booking + related redirects).
2. Share short handover note: what was fixed, what remains out of scope.

## 5. Out of Scope (Not Included in Rs 8,000)
1. Full codebase refactor/re-architecture.
2. UI redesign, frontend polish, or non-critical bug fixes.
3. Complete security overhaul across all modules/pages.
4. Performance optimization and code cleanup not directly tied to payment/security critical path.
5. New features or dashboard enhancements.
6. Long-term maintenance/support after final handover.

## 6. Acceptance Criteria
Work is considered delivered when the following are met:
1. Payment success path completes and creates booking as expected.
2. Payment failure path does not create booking.
3. Critical payment security patches listed in this document are applied.
4. Updated code is shared with short fix summary.

## 7. Revision Policy
1. One revision round is included only for items inside agreed scope.
2. Any additional changes/new requests will be treated as separate paid work.

## 8. Change Request Policy
If any new requirement is introduced during execution (feature changes, extra refactor, additional bug batches), timeline and cost will be revised separately after mutual agreement.

## 9. Payment Terms
Recommended:
1. 50% advance to start work.
2. 50% on final delivery (before final handover).

If a different payment split is required, mention it here:  
[Write another payment split]

## 10. Confirmation
By confirming this document, both parties agree to the scope, timeline, and budget mentioned above.

Confirmed by Requester: ____________________  
Date: ____________________

Confirmed by Developer: Sumit Srivastava_  
Date: 15-04-2026_
