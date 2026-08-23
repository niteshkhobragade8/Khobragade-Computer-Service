VISITOR COUNTER + RESET FIX ONLY

Replace these 6 files in the WEBSITE repository root:
1. index.js
2. public-common.js
3. public-page.js
4. dashboard.html
5. analytics.js
6. dashboard.css

Fixes:
- Visitor session flag is saved ONLY after Firestore write succeeds.
- Firestore visitor writes use one atomic batch, avoiding partial/double increments.
- Visitor daily date uses India time (IST).
- Small Reset button added to the right side of Total Visitors card.
- Reset sets totalVisitors to 0 and clears old visitorDaily history.
- Existing Analytics-page Reset button still works.
- No PayU, Forms, Users, Services, or other working modules changed.
