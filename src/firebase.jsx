// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDunCVFyBbzXz_OX9s22qUhKFBFW23LDo4",
  authDomain: "gymowner-8be82.firebaseapp.com",
  projectId: "gymowner-8be82",
  storageBucket: "gymowner-8be82.firebasestorage.app",
  messagingSenderId: "1005011737804",
  appId: "1:1005011737804:web:1b5560d594405e7ca97669",
  measurementId: "G-SXXZLFPSK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics and Firestore
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics };
