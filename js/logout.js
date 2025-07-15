import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
  authDomain: "login-9338e.firebaseapp.com",
  databaseURL: "https://login-9338e-default-rtdb.firebaseio.com",
  projectId: "login-9338e",
  storageBucket: "login-9338e.appspot.com",
  messagingSenderId: "649880075591",
  appId: "1:649880075591:web:a5cd336a03d80e9b656062",
  measurementId: "G-GT8TRDM62Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🚫 Block unauthorized access
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Not logged in → redirect
    window.location.href = "admin.html";
  }
});

// 🔓 Logout function
function logout() {
  signOut(auth)
    .then(() => {
      // Successfully signed out
      window.location.href = 'admin.html';
    })
    .catch((error) => {
      alert('Error signing out: ' + error.message);
    });
}

// 🔗 Attach logout to button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById('signOutBtn');
  if (btn) {
    btn.addEventListener('click', logout);
  }
});
