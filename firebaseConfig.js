// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Replace with your own config
const firebaseConfig = {
      apiKey: "AIzaSyCY4qhi8Vutg_0pFC7msLfKMRZiNELn2hE",
  authDomain: "foodapp-8ffc6.firebaseapp.com",
  projectId: "foodapp-8ffc6",
  storageBucket: "foodapp-8ffc6.firebasestorage.app",
  messagingSenderId: "314611367873",
  appId: "1:314611367873:web:10582db204db9a1e67b940",
  measurementId: "G-EDXCJLRJXC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
