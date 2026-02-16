// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC5YapU84d7VWQ-yX4Q3wV3NxznBzwFB8Y",
  authDomain: "aquabill-manager-81e99.firebaseapp.com",
  projectId: "aquabill-manager-81e99",
  storageBucket: "aquabill-manager-81e99.firebasestorage.app",
  messagingSenderId: "766320398686",
  appId: "1:766320398686:web:693fae1568925569633fcf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;



;