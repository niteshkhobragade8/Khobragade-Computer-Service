# Firebase Setup for Khobragade CSC CMS

The project is already connected to the existing Firebase project in `firebase-config.js`.

## Required Firebase products

1. Authentication -> Email/Password (already used by Admin Login).
2. Firestore Database -> used for services, categories, updates, notifications, settings, images, documents, YouTube and analytics.
3. Firebase Storage -> optional for direct image/document upload. If Storage is not enabled, the Admin Panel still supports external Image URL / Document URL fields.

## Firestore Rules

Copy the content of `firestore.rules` into Firebase Console -> Firestore Database -> Rules and publish it.

## Storage Rules

If Firebase Storage is enabled, copy `storage.rules` into Firebase Console -> Storage -> Rules and publish it.

## Collections used

- `services`
- `categories`
- `updates`
- `notifications`
- `images`
- `documents`
- `youtube`
- `settings` (document `website`)
- `analytics` (document `site`)
- `visitorDaily` (one document per date)

## Public website sync

- Published Services -> Home + Services page
- Published Updates -> Home page
- Breaking Notifications -> Home breaking bar
- Popup Notifications -> Home popup (once per browser session)
- Images + YouTube -> Home media section
- Public Documents -> Documents page
- Settings -> business name, phone/WhatsApp and YouTube links on public pages
- Visitor Analytics -> Admin Analytics chart
