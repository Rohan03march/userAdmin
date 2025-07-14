import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
    authDomain: "login-9338e.firebaseapp.com",
    projectId: "login-9338e",
    storageBucket: "login-9338e.firebasestorage.app",
    messagingSenderId: "649880075591",
    appId: "1:649880075591:web:a5cd336a03d80e9b656062",
    measurementId: "G-GT8TRDM62Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Protect page
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not logged in → redirect to login page
        window.location.href = "admin.html";  // change if your login page is named differently
    } else {
        console.log(`User logged in: ${user.email}`);
        document.querySelector('h1').textContent = `Welcome, ${user.email}`;
    }
});

// Log out
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error signing out:", error);
        alert("Failed to log out. Please try again.");
    });
});
