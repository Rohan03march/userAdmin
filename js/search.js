// ✅ Firebase App + Database SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getDatabase,
  ref,
  child,
  get,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// 🔷 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
  authDomain: "login-9338e.firebaseapp.com",
  databaseURL: "https://login-9338e-default-rtdb.firebaseio.com",
  projectId: "login-9338e",
  storageBucket: "login-9338e.appspot.com",
  messagingSenderId: "649880075591",
  appId: "1:649880075591:web:a5cd336a03d80e9b656062",
  measurementId: "G-GT8TRDM62Y",
};

// 🔷 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔷 Search logic
window.searchUsers = async function (query) {
  query = query.trim().toLowerCase();

  const snapshot = await get(child(ref(db), "registrations"));
  if (!snapshot.exists()) {
    return [];
  }

  const allUsersArray = Object.entries(snapshot.val()).map(([id, user]) => ({
    id,
    ...user,
  }));

  if (!query) {
    return allUsersArray
      .sort(
        (a, b) =>
          (Date.parse(b.submittedAt) || 0) - (Date.parse(a.submittedAt) || 0)
      )
      .slice(0, 3);
  }

  const filtered = allUsersArray.filter(
    (user) =>
      (user.nameAsPerAadhaar || "").toLowerCase().includes(query) ||
      (user.contactNumber || "").toLowerCase().includes(query) ||
      (user.workingLocation || "").toLowerCase().includes(query) ||
      (user.designation || "").toLowerCase().includes(query)
  );

  return filtered;
};
