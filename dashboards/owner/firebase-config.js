 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


 const firebaseConfig = {
            apiKey: "AIzaSyAd_HMHS9QkOe2pt_tH-sunWpuIaULCxtY",
            authDomain: "vynest-b58fa.firebaseapp.com",
            projectId: "vynest-b58fa",
            storageBucket: "vynest-b58fa.firebasestorage.app",
            messagingSenderId: "503196958388",
            appId: "1:503196958388:web:b78d771ddbd8dbf56161e1",
            measurementId: "G-XK1ZYCS455"
        };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

 