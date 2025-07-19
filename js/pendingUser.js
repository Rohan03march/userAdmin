import { getFirestore, collection, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const db = getFirestore();

async function countPendingUsers() {
  const q = query(collection(db, "users"), where("permission", "==", false));
}

countPendingUsers();