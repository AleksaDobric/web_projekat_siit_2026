import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDaKEWPBG8h_zwysu-lBYUFlq00UHk0wnA",
    authDomain: "web-projekat-siit-2026.firebaseapp.com",
    databaseURL: "https://web-projekat-siit-2026-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "web-projekat-siit-2026",
    storageBucket: "web-projekat-siit-2026.firebasestorage.app",
    messagingSenderId: "987765271227",
    appId: "1:987765271227:web:6f76d7912d47ba23b7179e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };