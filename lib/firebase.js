import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZCZwKd0Ve_o1RlhZSSAMIMTy9MWFUf2E",
  authDomain: "sweetlous-services.firebaseapp.com",
  projectId: "sweetlous-services",
  storageBucket: "sweetlous-services.firebasestorage.app",
  messagingSenderId: "336489690089",
  appId: "1:336489690089:web:e9ac05e669cefe51a4d178"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
