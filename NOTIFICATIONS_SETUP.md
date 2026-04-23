# Central Notification System Setup (VyNest)

## 1) Firestore Schema

Collection: `notifications`

Document ID strategy:
- Recommended for booking purchases: `purchase_<orderId>`
- Example: `purchase_order_1713899200000`

Document shape:

```json
{
  "type": "PURCHASE_CREATED",
  "title": "New Booking Purchase",
  "message": "Booking payment received for Aurora PG (double)",
  "orderId": "order_1713899200000",
  "bookingId": "order_1713899200000",
  "roomId": "room_abc123",
  "propertyName": "Aurora PG",
  "roomType": "double",
  "amount": 2000,
  "currency": "INR",
  "actorUserId": "studentUid",
  "ownerId": "ownerUid",
  "targetIds": ["studentUid", "ownerUid"],
  "targetRoles": ["admin"],
  "channels": ["in_app"],
  "createdAt": "Firestore Timestamp",
  "readBy": {
    "<uid>": true
  }
}
```

Field notes:
- `targetIds`: user-specific recipients (student/owner/etc).
- `targetRoles`: role-based recipients (admin/owner/student broadcast use-cases).
- `readBy`: optional per-user read state map.
- `createdAt`: required for sorting and query indexes.

## 2) What is already implemented

Backend:
- On confirmed purchase, notification is created once (idempotent) from:
  - webhook path
  - verify-payment path (fallback flow)

Frontend:
- Student dashboard listens to notifications targeted to:
  - their `uid` via `targetIds`
  - role `student` via `targetRoles`
- Owner dashboard listens to:
  - their `uid`
  - role `owner`
- Admin dashboard listens to:
  - their `uid`
  - role `admin`

## 3) Firestore Indexes (required)

Create these composite indexes in Firebase Console:

1. Collection: `notifications`
- Fields:
  - `targetIds` (Array contains)
  - `createdAt` (Descending)

2. Collection: `notifications`
- Fields:
  - `targetRoles` (Array contains)
  - `createdAt` (Descending)

How:
- Firebase Console -> Firestore Database -> Indexes -> Composite -> Create index

## 4) Firestore Security Rules (recommended)

Add logic so users can only read notifications addressed to them or their role.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /notifications/{notificationId} {
      allow read: if isSignedIn() && (
        request.auth.uid in resource.data.targetIds ||
        userRole() in resource.data.targetRoles
      );

      // Keep writes restricted to trusted backend/admin only.
      allow write: if false;
    }
  }
}
```

Notes:
- If you already have project rules, merge this block into your existing rules structure.
- Notification writes should come from backend only (Cloudflare Worker using service account), not client.

## 5) Firebase Console setup checklist

1. Ensure `users` docs have valid `role` values:
- `student`, `owner`, `admin`

2. Create composite indexes listed above.

3. Publish/merge Firestore Rules update.

4. Verify by creating a test notification document:
- `targetIds: [<studentUid>]`, `targetRoles: ["admin"]`
- Confirm visibility:
  - student can see it
  - admin can see it
  - unrelated owner cannot

## 6) Optional next improvements

- Add `notification_reads` subcollection for scalable read receipts.
- Add backend API to mark notifications read.
- Add notification categories (`BOOKING`, `PAYMENT`, `SYSTEM`) for filtering.
- Add pagination (`startAfter`) for long notification history.
