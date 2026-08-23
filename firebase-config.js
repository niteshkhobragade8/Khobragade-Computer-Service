// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDV28ojXFrj7IZ99Hvd72ak3FNghDS0Og0",
  authDomain: "project-5969685501815639790.firebaseapp.com",
  projectId: "project-5969685501815639790",
  storageBucket: "project-5969685501815639790.firebasestorage.app",
  messagingSenderId: "332665705859",
  appId: "1:332665705859:web:af9220e856e583565f52b6",
  measurementId: "G-QH7MH73512"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
