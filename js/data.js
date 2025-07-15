import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
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
const db = getDatabase(app);

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
let allUsersArray = []; // ⭐ holds latest 3 users

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
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">No registered users found.</td></tr>`;
      return;
    }

    allUsersArray = Object.entries(snapshot.val()).map(([id, user]) => ({ id, ...user }))
      .sort((a, b) => (Date.parse(b.submittedAt) || 0) - (Date.parse(a.submittedAt) || 0))
      .slice(0, 3);

    renderTable(allUsersArray);
  } catch (err) {
    console.error("Error fetching users for table:", err);
  }
}

// ⭐ helper to render table rows
function renderTable(users) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">No matching users found.</td></tr>`;
    return;
  }

  for (const user of users) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <img src="${user.photo || ""}" alt="${user.nameAsPerAadhaar || "User"}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:10px;vertical-align:middle;">
        <p style="display:inline-block;vertical-align:middle;">${user.nameAsPerAadhaar || "Unknown"}</p>
      </td>
      <td>${user.contactNumber || "Null"}</td>
      <td>${user.submittedAt || "N/A"}</td>
    `;
    tbody.appendChild(tr);
  }
}

// 🔷 fill form globally
function fillForm(id, data) {
  currentRecordId = id;
  const form = document.querySelector("form");
  const previewImg = document.getElementById("photoPreview");

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
}

// 🔷 prefill by Firebase ID
async function prefillById(userId) {
  try {
    const snap = await get(ref(db, `registrations/${userId}`));
    if (!snap.exists()) {
      alert("User not found");
      return;
    }
    const data = snap.val();
    fillForm(userId, data);
  } catch (err) {
    console.error("Error fetching user:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateUserCount();
  populateUsersTable();

  // Example: prefill latest user
  get(child(ref(db), "registrations")).then(snapshot => {
    if (!snapshot.exists()) return;
    const latestEntry = Object.entries(snapshot.val()).sort(
      (a, b) => Date.parse(b[1].submittedAt) - Date.parse(a[1].submittedAt)
    )[0];
    if (latestEntry) {
      const [id, data] = latestEntry;
      fillForm(id, data);
    }
  });

  const form = document.querySelector("form");
  const photoInput = document.getElementById("photo");
  const previewImg = document.getElementById("photoPreview");

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

  const contactNumberInput = form.querySelector(".input-box:nth-child(14) input");
  const nameInput = form.querySelector(".input-box:nth-child(5) input");

  contactNumberInput.addEventListener("blur", () => {
    const value = contactNumberInput.value.trim();
    if (value) checkAndFill("contactNumber", value);
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

    // 🔷 Always re-check for existing user before deciding
    let existingId = null;

    try {
        const snapshot = await get(child(ref(db), "registrations"));
        if (snapshot.exists()) {
            for (const [id, record] of Object.entries(snapshot.val())) {
                if (
                    record.employeeCode === data.employeeCode ||
                    record.nameAsPerAadhaar === data.nameAsPerAadhaar
                ) {
                    existingId = id;
                    break;
                }
            }
        }
    } catch (err) {
        alert("Error checking existing records: " + err.message);
        return;
    }

    // 🔷 Handle photo
    if (photoInput.files[0]) {
        try {
            const photoUrl = await uploadPhotoToCloudinary(photoInput.files[0]);
            data.photo = photoUrl;
        } catch (err) {
            alert("Image upload failed: " + err.message);
            return;
        }
    } else if (existingId) {
        const snap = await get(ref(db, `registrations/${existingId}`));
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

    // 🔷 Submit or update
    try {
        if (existingId) {
            await update(ref(db, `registrations/${existingId}`), data);
            alert("✅ Data updated successfully!");
        } else {
            const newRef = push(ref(db, "registrations"));
            await set(newRef, data);
            alert("✅ Data submitted successfully!");
        }

        // Reset form & UI
        form.reset();
        currentRecordId = null;
        if (previewImg) {
            previewImg.src = "";
            previewImg.style.display = "none";
        }
        updateUserCount();
        populateUsersTable();

    } catch (err) {
        alert("Error saving data: " + err.message);
    }
});

});

