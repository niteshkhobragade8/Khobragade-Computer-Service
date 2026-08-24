KCSC Applications & Payments Integration

This build keeps the original dashboard design and adds:
- Applications
- Users / Customers
- Payments / PayU
- Service Actions & Dynamic Form Builder
- Application status workflow: Pending, Processing, Need Documents, On Hold, Completed, Rejected
- Rejection reason / user message / internal note / completed file URLs
- Payment audit records without permanent delete UI
- Overview application/payment counters

Security: firestore-portal.rules is provided as a NEW template. Before using customer accounts in production, create /admins/{ADMIN_UID} and deploy these rules intentionally. Do not paste PayU Merchant Salt/Secret in public JS or Firestore. Use a secure backend endpoint for payment hash generation and verification.

This package intentionally contains no CNAME so it does not point at the existing live domain.
