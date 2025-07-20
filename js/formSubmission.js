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

document.getElementById("myForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameField = document.getElementById("name");
  const locationField = document.getElementById("location");
  const jobField = document.getElementById("time")
  const phoneField = document.getElementById("phoneNumber");
  const genderField = document.getElementById("sex");
  const positionField = document.getElementById("position");

  if (!nameField || !locationField || !jobField || !phoneField || !genderField || !positionField) {
    alert("Form elements not found in the DOM.");
    return;
  }

  const name = nameField.value.trim();
  const location = locationField.value.trim();
  const job = jobField.value;
  const phoneNumber = phoneField.value.trim();
  const gender = genderField.value;
  const position = positionField.value.trim();

  if (!name || !location || !job || !phoneNumber || !gender || !position) {
    alert("Please fill all fields!");
    return;
  }

  try {
    const newAppRef = db.ref("applications").push();
    await newAppRef.set({
  name,
  location,
  job,
  phoneNumber,
  gender,
  position,
  status: 'yet',  // 👈 default status saved in DB
});


    document.getElementById("myForm").reset();
    const msg = document.getElementById("successMsg");
    msg.style.display = "block";
    setTimeout(() => (msg.style.display = "none"), 5000);
  } catch (err) {
    console.error("Error submitting application:", err);
    alert("Something went wrong. Please try again.");
  }
});

