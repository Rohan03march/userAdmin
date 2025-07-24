// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
  authDomain: "login-9338e.firebaseapp.com",
  databaseURL: "https://login-9338e-default-rtdb.firebaseio.com",
  projectId: "login-9338e",
  storageBucket: "login-9338e.appspot.com",
  messagingSenderId: "649880075591",
  appId: "1:649880075591:web:a5cd336a03d80e9b656062",
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ Get form elements
const form = document.getElementById("myForm");
const phoneInput = document.getElementById("phoneNumber");
const submitBtn = form.querySelector("button[type='submit']");

// IDs of fields to disable if phone already exists
const formFieldIds = ["name", "location", "time", "sex", "position"];

// 🔍 Check for duplicate phone number when user finishes typing
phoneInput.addEventListener("blur", async () => {
  const phoneNumber = phoneInput.value.trim();
  const phoneKey = phoneNumber.replace(/\D/g, '');

  if (!phoneKey) return;

  try {
    const userRef = db.ref("applications/" + phoneKey);
    const snapshot = await userRef.once("value");

    if (snapshot.exists()) {
      alert("This phone number already exists in our system. Please wait for a call.");

      // Disable all form fields
      formFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.disabled = true;
      });

      phoneInput.disabled = true; // Optional: prevent editing again
      submitBtn.disabled = true;
    } else {
      // Re-enable all fields in case they were previously disabled
      formFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.disabled = false;
      });

      phoneInput.disabled = false;
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error("Error checking phone number:", err);
  }
});

// ✅ Submit Handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameField = document.getElementById("name");
  const locationField = document.getElementById("location");
  const jobField = document.getElementById("time");
  const genderField = document.getElementById("sex");
  const positionField = document.getElementById("position");

  if (!nameField || !locationField || !jobField || !phoneInput || !genderField || !positionField) {
    alert("Form elements not found in the DOM.");
    return;
  }

  const name = nameField.value.trim();
  const location = locationField.value.trim();
  const job = jobField.value;
  const phoneNumber = phoneInput.value.trim();
  const gender = genderField.value;
  const position = positionField.value.trim();

  if (!name || !location || !job || !phoneNumber || !gender || !position) {
    alert("Please fill all fields!");
    return;
  }

  const phoneKey = phoneNumber.replace(/\D/g, '');

  // 🔷 Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const userRef = db.ref("applications/" + phoneKey);
    const snapshot = await userRef.once("value");

    if (snapshot.exists()) {
      alert("You already submitted your application, please wait for the call...");
    } else {
      await userRef.set({
        name,
        location,
        job,
        phoneNumber,
        gender,
        position,
        status: "yet" // default status
      });

      form.reset();
      alert("Form applied successfully, we will contact you soon…");
    }
  } catch (err) {
    console.error("Error submitting application:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Apply";
  }
});
