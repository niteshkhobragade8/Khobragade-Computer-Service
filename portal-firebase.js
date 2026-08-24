import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import { getFirestore } from '../../supabase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDV28ojXFrj7IZ99Hvd72ak3FNghDS0Og0',
  authDomain: 'project-5969685501815639790.firebaseapp.com',
  projectId: 'project-5969685501815639790',
  storageBucket: 'project-5969685501815639790.firebasestorage.app',
  messagingSenderId: '332665705859',
  appId: '1:332665705859:web:af9220e856e583565f52b6',
  measurementId: 'G-QH7MH73512'
};

const portalApp = getApps().find(a => a.name === 'kcscUserPortal') || initializeApp(firebaseConfig, 'kcscUserPortal');
export const auth = getAuth(portalApp);
globalThis.__KCSC_FIREBASE_AUTH__ = auth;
export const db = getFirestore(portalApp);
try { await setPersistence(auth, browserLocalPersistence); } catch (e) { console.warn('Portal auth persistence:', e); }
