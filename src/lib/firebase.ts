import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCK7KamJ3Bxr5qpD7FHFk-xE6wBs_hW_zY",
  authDomain: "caffiene-517e8.firebaseapp.com",
  projectId: "caffiene-517e8",
  storageBucket: "caffiene-517e8.firebasestorage.app",
  messagingSenderId: "572723890140",
  appId: "1:572723890140:web:fb93b1c59af816e9efb119",
  measurementId: "G-21J7ZPHHXC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
