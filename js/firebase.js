import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAReDBorVLBu1yyU0_3xQ4WNZCjwvySd_U",
    authDomain: "emprendimiento-may.firebaseapp.com",
    projectId: "emprendimiento-may",
    storageBucket: "emprendimiento-may.firebasestorage.app",
    messagingSenderId: "72936691342",
    appId: "1:72936691342:web:74d4b9e286abb3b2c0dbdf",
    measurementId: "G-2G9RD7D7RD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);