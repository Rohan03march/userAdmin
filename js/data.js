import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
  update
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 🔐 Auth check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "admin.html";
  }
});

document.getElementById('signOutBtn')?.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'admin.html';
  }).catch((error) => {
    alert('Error signing out: ' + error.message);
  });
});

// 🗝️ Field mapping
const labelToKeyMap = {
  "Working Location": "workingLocation",
  "Employee Code": "employeeCode",
  "Designation": "designation",
  "Date Of Joining": "dateOfJoining",
  "Name(As Per Aadhaar)": "nameAsPerAadhaar",
  "Father's/Husband Name(Aadhaar)": "fatherOrHusbandName",
  "Mother's Name": "motherName",
  "Marital Status": "maritalStatus",
  "DOB(As Per Aadhaar)": "dobAsPerAadhaar",
  "Nominee Name": "nomineeName",
  "Nominee Relationship": "nomineeRelationship",
  "Aadhaar Number": "aadhaarNumber",
  "PAN Number": "panNumber",
  "Contact Number": "contactNumber",
  "Alternative Contact Number": "altContactNumber",
  "ESI Number": "esiNumber",
  "UAN Number": "uanNumber",
  "Bank Name": "bankName",
  "Bank A/C Number": "bankAccountNumber",
  "IFSC Code": "ifscCode"
};

let currentRecordId = null;

async function updateUserCount() {
  try {
    const snapshot = await get(child(ref(db), "registrations"));
    let count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById("userCount").textContent = count;
  } catch (err) {
    console.error("Error fetching user count:", err);
  }
}

async function populateUsersTable() {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";
  try {
    const snapshot = await get(child(ref(db), "registrations"));
    if (!snapshot.exists()) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center">No registered users found.</td></tr>`;
      return;
    }

    const usersArray = Object.entries(snapshot.val()).map(([id, user]) => ({ id, ...user }))
      .sort((a, b) => (Date.parse(b.submittedAt) || 0) - (Date.parse(a.submittedAt) || 0))
      .slice(0, 3);

    for (const user of usersArray) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <img src="${user.photo || ""}" alt="${user.nameAsPerAadhaar || "User"}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:10px;vertical-align:middle;">
          <p style="display:inline-block;vertical-align:middle;">${user.nameAsPerAadhaar || "Unknown"}</p>
        </td>
        <td>${user.submittedAt || "N/A"}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error("Error fetching users for table:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateUserCount();
  populateUsersTable();

  const form = document.querySelector("form");
  const photoInput = document.getElementById("photo");
  const previewImg = document.getElementById("photoPreview");

  const fillForm = (id, data) => {
    currentRecordId = id;
    form.querySelectorAll(".input-box").forEach(box => {
      const labelEl = box.querySelector(".details");
      const inputEl = box.querySelector("input");
      if (!inputEl || !labelEl) return;
      const key = labelToKeyMap[labelEl.textContent.trim()];
      if (key && data[key]) inputEl.value = data[key];
    });
    if (previewImg && data.photo) {
      previewImg.src = data.photo;
      previewImg.style.display = "block";
    }
  };

  const checkAndFill = async (fieldKey, value) => {
    const snapshot = await get(child(ref(db), "registrations"));
    if (!snapshot.exists()) {
      currentRecordId = null;
      return;
    }

    for (const [id, record] of Object.entries(snapshot.val())) {
      if (record[fieldKey] === value) {
        fillForm(id, record);
        return;
      }
    }
    currentRecordId = null;
  };

  const collectFormData = () => {
    const data = {};
    let allFilled = true;

    form.querySelectorAll(".input-box").forEach(box => {
      const labelEl = box.querySelector(".details");
      const inputEl = box.querySelector("input");
      if (!inputEl || !labelEl) return;
      const key = labelToKeyMap[labelEl.textContent.trim()];
      const value = inputEl.value.trim();
      if (!value) allFilled = false;
      if (key) data[key] = value;
    });

    return allFilled ? data : null;
  };

  async function uploadPhotoToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "UserImages");
    const res = await fetch("https://api.cloudinary.com/v1_1/dtwcxssvj/image/upload", {
      method: "POST", body: formData
    });
    if (!res.ok) throw new Error("Failed to upload image");
    const data = await res.json();
    return data.secure_url;
  }

  const employeeCodeInput = form.querySelector(".input-box:nth-child(2) input");
  const nameInput = form.querySelector(".input-box:nth-child(5) input");

  employeeCodeInput.addEventListener("blur", () => {
    const value = employeeCodeInput.value.trim();
    if (value) checkAndFill("employeeCode", value);
  });
  nameInput.addEventListener("blur", () => {
    const value = nameInput.value.trim();
    if (value) checkAndFill("nameAsPerAadhaar", value);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = collectFormData();
    if (!data) {
      alert("Please fill all the fields.");
      return;
    }

    data.submittedAt = new Date().toLocaleString();

    // double-check record existence
    if (!currentRecordId) {
      const snapshot = await get(child(ref(db), "registrations"));
      if (snapshot.exists()) {
        for (const [id, record] of Object.entries(snapshot.val())) {
          if (record.employeeCode === data.employeeCode || record.nameAsPerAadhaar === data.nameAsPerAadhaar) {
            currentRecordId = id;
            break;
          }
        }
      }
    }

    if (photoInput.files[0]) {
      try {
        const photoUrl = await uploadPhotoToCloudinary(photoInput.files[0]);
        data.photo = photoUrl;
      } catch (err) {
        alert("Image upload failed: " + err.message);
        return;
      }
    } else if (currentRecordId) {
      const snap = await get(ref(db, `registrations/${currentRecordId}`));
      if (snap.exists() && snap.val().photo) {
        data.photo = snap.val().photo;
      } else {
        alert("Please upload a photo before submitting.");
        return;
      }
    } else {
      alert("Please upload a photo before submitting.");
      return;
    }

    try {
      if (currentRecordId) {
        await update(ref(db, `registrations/${currentRecordId}`), data);
        alert("Data updated successfully!");
      } else {
        const newRef = push(ref(db, "registrations"));
        await set(newRef, data);
        alert("Data submitted successfully!");
      }

      form.reset();
      currentRecordId = null;
      if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      updateUserCount();
      populateUsersTable();
    } catch (err) {
      alert("Error submitting data: " + err.message);
    }
  });
});

