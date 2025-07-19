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

const listContainer = document.getElementById("applicationsList");

function renderTable(applications) {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Location</th>
        <th>Phone Number</th>
        <th>Gender</th>
        <th>Position</th>
        <th>Submitted At</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  applications.forEach(app => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${app.name}</td>
      <td>${app.location}</td>
      <td>${app.phoneNumber}</td>
      <td>${app.gender}</td>
      <td>${app.position}</td>
      <td>${new Date(app.submittedAt).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  listContainer.innerHTML = ""; // clear
  listContainer.appendChild(table);
}


// Read applications
db.ref("applications").on("value", (snapshot) => {
  const apps = [];
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      apps.push(child.val());
    });
    renderTable(apps);
  } else {
    listContainer.innerHTML = "<p>No applications found yet.</p>";
  }
});

