"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.app = void 0;
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const env_js_1 = require("./env.js");
const firebaseConfig = {
    apiKey: "AIzaSyDk4iZIu-SxSkpGGNyf4fO0lDgO5cuad98",
    authDomain: "partiuinvest.firebaseapp.com",
    projectId: env_js_1.env.FIREBASE_PROJECT_ID || "partiuinvest",
    storageBucket: "partiuinvest.firebasestorage.app",
    messagingSenderId: "874876181201",
    appId: "1:874876181201:web:55333eb78c386b703583f0",
};
exports.app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
exports.db = (0, firestore_1.getFirestore)(exports.app);
