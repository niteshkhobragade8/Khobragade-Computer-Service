PAYMENT SCREENSHOT FALLBACK - TARGETED FIX ONLY

Working project ke baaki files change nahi kiye gaye.

WEBSITE repo me replace/add:
1. dashboard.html
2. payment-screenshots-admin.js (new)
3. firestore.rules
4. portal/payment-success.html

Private backend repo kcc-payu-backend me replace:
5. server.js

Firebase Console > Firestore Database > Rules me WEBSITE/firestore.rules ka complete code paste karke Publish karein.

Flow:
- Normal PayU success + Firestore sync working: existing normal Paid flow.
- PayU success but Firestore status sync fails: backend user ko payment-success page par proof fallback ke saath redirect karta hai.
- User screenshot Cloudinary me upload karta hai; proof metadata paymentScreenshots collection me save hota hai.
- Admin sidebar: Payments / PayU ke niche Payment Screenshots.
- Admin Preview / Approve / Reject.
- Approve matching application/payment ko Paid update karne ki koshish karta hai.

Note: Agar Firestore WRITE quota bhi exhausted ho, proof metadata us waqt save nahi ho sakta. Cloudinary image upload independent hai, lekin Admin list ke liye Firestore metadata write zaroori hai. Quota reset ke baad submit dobara karna hoga.
