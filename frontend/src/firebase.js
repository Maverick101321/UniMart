import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnOxLT0Fa0hRyw21BdlJ8rkglV8lVHNyE",
  authDomain: "srm-marketplace.firebaseapp.com",
  projectId: "srm-marketplace",
  storageBucket: "srm-marketplace.firebasestorage.app",
  messagingSenderId: "263627007694",
  appId: "1:263627007694:web:be532ae1300e4b8ce0129f",
  measurementId: "G-Q8DTB6G0XM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);