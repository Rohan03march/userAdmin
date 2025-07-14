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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const photoInput = document.getElementById("photo");

  const fillForm = (data) => {
    const inputBoxes = form.querySelectorAll(".input-box");
    inputBoxes.forEach((box) => {
      const labelEl = box.querySelector(".details");
      const inputEl = box.querySelector("input");
      if (!inputEl || !labelEl) return;
      const label = labelEl.textContent.trim();
      const key = labelToKeyMap[label];
      if (key && data[key]) {
        inputEl.value = data[key];
      }
    });
  };

  const checkAndFill = async (fieldKey, value) => {
    const snapshot = await get(child(ref(db), "registrations"));
    if (snapshot.exists()) {
      const registrations = snapshot.val();
      for (const [id, record] of Object.entries(registrations)) {
        if (record[fieldKey] && record[fieldKey] === value) {
          fillForm(record);
          currentRecordId = id;
          return;
        }
      }
    }
    currentRecordId = null;
  };

  const collectFormData = () => {
    const inputBoxes = form.querySelectorAll(".input-box");
    const data = {};
    let allFilled = true;

    inputBoxes.forEach((box) => {
      const labelEl = box.querySelector(".details");
      const inputEl = box.querySelector("input");
      if (!inputEl || !labelEl) return;
      const label = labelEl.textContent.trim();
      const value = inputEl.value.trim();
      if (!value) allFilled = false;
      const key = labelToKeyMap[label];
      if (key) {
        data[key] = value;
      }
    });

    return allFilled ? data : null;
  };

  async function uploadPhotoToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/dtwcxssvj/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "UserImages");

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload image");
    const data = await res.json();
    return data.secure_url;
  }

  const employeeCodeInput = form.querySelector(".input-box:nth-child(2) input");
  const nameInput = form.querySelector(".input-box:nth-child(5) input");

  employeeCodeInput.addEventListener("blur", () => {
    const value = employeeCodeInput.value.trim();
    if (value) {
      checkAndFill("employeeCode", value);
    }
  });

  nameInput.addEventListener("blur", () => {
    const value = nameInput.value.trim();
    if (value) {
      checkAndFill("nameAsPerAadhaar", value);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clickedButton = e.submitter?.id; // works in modern browsers
    if (!clickedButton) {
      alert("Could not determine which button was clicked.");
      return;
    }

    const data = collectFormData();
    if (!data) {
      alert("Please fill all the fields.");
      return;
    }

    if (photoInput.files[0]) {
      try {
        const photoUrl = await uploadPhotoToCloudinary(photoInput.files[0]);
        data.photo = photoUrl;
      } catch (err) {
        console.error(err);
        alert("Failed to upload photo.");
        return;
      }
    }

    if (clickedButton === "updateBtn") {
      if (!currentRecordId) {
        alert("No existing record found to update.");
        return;
      }

      try {
        await update(ref(db, `registrations/${currentRecordId}`), data);
        alert("Data updated successfully!");
        form.reset();
        currentRecordId = null;
      } catch (err) {
        console.error(err);
        alert("Failed to update data.");
      }
    } else if (clickedButton === "submitBtn") {
      try {
        const newRef = push(ref(db, "registrations"));
        await set(newRef, data);
        alert("Data submitted successfully!");
        form.reset();
        currentRecordId = null;
      } catch (err) {
        console.error(err);
        alert("Failed to submit data.");
      }
    }
  });
});
