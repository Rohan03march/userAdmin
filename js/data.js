import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
  update,
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
  "Bank Name": "bankName",
  "Bank A/C Number": "bankAccountNumber",
  "IFSC Code": "ifscCode"
};

let currentRecordId = null;
let allUsersArray = [];

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

function renderTable(users) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center">No matching users found.</td></tr>`;
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
      <td>
        <button class="delete-btn" data-id="${user.id}" style="
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        ">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // Attach delete handlers
  tbody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!id) return;
      if (!confirm("Are you sure you want to delete this user?")) return;

      try {
        await set(ref(db, `registrations/${id}`), null); // deletes the record
        alert("✅ User deleted.");
        updateUserCount();
        populateUsersTable();
      } catch (err) {
        console.error("Delete error:", err);
        alert("❌ Failed to delete user: " + err.message);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateUserCount();
  populateUsersTable();

  const form = document.querySelector("form");
  const photoInput = document.getElementById("photo");
  const previewImg = document.getElementById("photoPreview");

  const contactNumberInput = form.querySelector("input[name='contactNumber']");
  const nameInput = form.querySelector("input[name='nameAsPerAadhaar']");

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

    const photoFile = photoInput.files[0];
    if (!currentRecordId && !photoFile) {
      alert("Please select a photo.");
      return;
    }

    const loadingPopup = showLoadingPopup("Submitting data, please wait...");
    data.submittedAt = new Date().toLocaleString('en-GB', {
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});


    try {
      if (photoFile) {
        const uploadedUrl = await uploadPhotoToCloudinary(photoFile);
        data.photo = uploadedUrl;
      } else if (currentRecordId) {
        const snapshot = await get(child(ref(db), `registrations/${currentRecordId}`));
        if (snapshot.exists() && snapshot.val().photo) {
          data.photo = snapshot.val().photo;
        }
      }

      let existingId = currentRecordId;

      if (!existingId) {
        const snapshot = await get(child(ref(db), "registrations"));
        if (snapshot.exists()) {
          for (const [id, record] of Object.entries(snapshot.val())) {
            if (
              record.contactNumber === data.contactNumber ||
              record.nameAsPerAadhaar === data.nameAsPerAadhaar
            ) {
              existingId = id;
              break;
            }
          }
        }
      }

      if (existingId) {
        await update(ref(db, `registrations/${existingId}`), data);
        alert("✅ Data updated successfully!");
      } else {
        const newRef = push(ref(db, "registrations"));
        await set(newRef, data);
        alert("✅ Data submitted successfully!");
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
      alert("Error saving data: " + err.message);
    } finally {
      loadingPopup.remove();
    }
  });
});

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

function showLoadingPopup(message) {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "0";
  popup.style.left = "0";
  popup.style.width = "100%";
  popup.style.height = "100%";
  popup.style.backgroundColor = "rgba(0,0,0,0.5)";
  popup.style.color = "#fff";
  popup.style.fontSize = "1.5rem";
  popup.style.display = "flex";
  popup.style.alignItems = "center";
  popup.style.justifyContent = "center";
  popup.style.zIndex = "9999";
  popup.textContent = message;
  document.body.appendChild(popup);
  return popup;
}

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

function collectFormData() {
  const form = document.querySelector("form");
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
}
