// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnOxLT0Fa0hRyw21BdlJ8rkglV8lVHNyE",
  authDomain: "srm-marketplace.firebaseapp.com",
  projectId: "srm-marketplace",
  storageBucket: "srm-marketplace.firebasestorage.app",
  messagingSenderId: "263627007694",
  appId: "1:263627007694:web:be532ae1300e4b8ce0129f",
  measurementId: "G-Q8DTB6G0XM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);