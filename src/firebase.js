// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6TiqdJxEwTebp1ax82Q9JVf87LVC_u8w",
  authDomain: "tedx-portal-d2ce5.firebaseapp.com",
  projectId: "tedx-portal-d2ce5",
  storageBucket: "tedx-portal-d2ce5.firebasestorage.app",
  messagingSenderId: "18929979378",
  appId: "1:18929979378:web:32fc61ba22de2c1401656b",
  measurementId: "G-YZFEB21T6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);