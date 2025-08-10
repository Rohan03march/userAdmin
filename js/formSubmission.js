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

// Field IDs to disable on phone match
const formFieldIds = ["name", "location", "time", "sex", "position"];
let phoneExists = false; // internal flag to track match

// ✅ Normalize phone number to last 10 digits
const normalizePhone = (rawPhone) => {
  return rawPhone.replace(/\D/g, '').slice(-10);
};

// 🔍 Check for existing phone number (on blur)
phoneInput.addEventListener("blur", async () => {
  const rawPhone = phoneInput.value.trim();
  const phoneKey = normalizePhone(rawPhone);

  if (!phoneKey || phoneKey.length !== 10) return;

  try {
    const userRef = db.ref("applications/" + phoneKey);
    const snapshot = await userRef.once("value");

    if (snapshot.exists()) {
      phoneExists = true;

      // Disable all fields (except phone)
      formFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.disabled = true;
      });

      submitBtn.disabled = false;
    } else {
      phoneExists = false;

      // Re-enable fields
      formFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.disabled = false;
      });

      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error("Error checking phone number:", err);
  }
});

// ✅ Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (phoneExists) {
    alert("You already submitted your application, please wait for the call...");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const location = document.getElementById("location").value.trim();
  const job = document.getElementById("time").value;
  const rawPhone = phoneInput.value.trim();
  const gender = document.getElementById("sex").value;
  const position = document.getElementById("position").value.trim();

  if (!name || !location || !job || !rawPhone || !gender || !position) {
    alert("Please fill all fields!");
    return;
  }

  const phoneKey = normalizePhone(rawPhone);
  if (phoneKey.length !== 10) {
    alert("Invalid phone number.");
    return;
  }

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
        phoneNumber: phoneKey, // store normalized version
        gender,
        position,
        status: "yet",
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      form.reset();
      alert("Form applied successfully, we will contact you soon…");

      // Reset state
      phoneExists = false;
      formFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.disabled = false;
      });
    }
  } catch (err) {
    console.error("Error submitting application:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Apply";
  }
});
