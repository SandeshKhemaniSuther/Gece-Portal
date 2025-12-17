// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Import Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdb-MPg3LHlIDq39GvBWpcEcVOv1NpAU8",
  authDomain: "gece-student-portal.firebaseapp.com",
  projectId: "gece-student-portal",
  storageBucket: "gece-student-portal.firebasestorage.app",
  messagingSenderId: "802201037924",
  appId: "1:802201037924:web:fc1c3e20f655ccae4c0371",
  measurementId: "G-YEWVQ7754M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Export Storage