import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJQ5w4S16yMf0LE4XPfgOE1kCfZyfR2uc",
  authDomain: "porchlight-django.firebaseapp.com",
  projectId: "porchlight-django",
  storageBucket: "porchlight-django.firebasestorage.app",
  messagingSenderId: "627104697329",
  appId: "1:627104697329:web:b3c9ef08f721566e4f9250"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
