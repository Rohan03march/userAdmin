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
const searchInput = document.getElementById("searchInput");

let allApplications = []; // Store all apps here for filtering

function renderApplications(applications) {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Applicant</th>
        <th>Contact</th>
        <th>Job Type</th>
        <th>Location</th>
        <th>Gender</th>
        <th>Position</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  applications.forEach(app => {
    // ✅ Create row
    const tr = document.createElement("tr");

    // ✅ Populate cells
    tr.innerHTML = `
      <td>${app.name || ""}</td>
      <td>${app.phoneNumber || ""}</td>
      <td>${app.job || ""}</td>
      <td>${app.location || ""}</td>
      <td>${app.gender || ""}</td>
      <td>${app.position || ""}</td>
      <td>
        <div style="position:relative; display:inline-block;">
          <button class="status-button ${app.status}">${getStatusLabel(app.status)}</button>
          <div class="status-menu hidden">
            <div class="status-option" data-status="yet">To Be Interviewed</div>
            <div class="status-option" data-status="selected">Selected</div>
            <div class="status-option" data-status="rejected">Rejected</div>
            <div class="status-option" data-status="joined">Joined</div>
            <div class="status-option" data-status="not">Not Responding</div>
            <div class="status-option" data-status="notI">Not Interested</div>
          </div>
        </div>
      </td>
      <td>
  <button class="delete-button">
Delete
</button>

</td>

    `;
    tbody.appendChild(tr);

    // ✅ Get elements after appending to DOM
    const statusButton = tr.querySelector(".status-button");
    const menu = tr.querySelector(".status-menu");
    const deleteButton = tr.querySelector(".delete-button");

    // ✅ Status button logic
    statusButton.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent document click from hiding it immediately
      document.querySelectorAll(".status-menu").forEach(m => m.classList.add("hidden"));
      menu.classList.toggle("hidden");
    });

    menu.querySelectorAll(".status-option").forEach(option => {
      option.addEventListener("click", () => {
        const newStatus = option.dataset.status;

        db.ref(`applications/${app.key}`).update({ status: newStatus })
          .then(() => {
            statusButton.textContent = getStatusLabel(newStatus);
            statusButton.className = `status-button ${newStatus}`;
            menu.classList.add("hidden");
          })
          .catch(err => {
            alert("Error updating status: " + err.message);
          });
      });
    });

    // ✅ Delete button logic
    deleteButton.addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete application of ${app.name}?`)) {
        db.ref(`applications/${app.key}`).remove()
          .then(() => {
            tr.remove();
          })
          .catch(err => {
            alert("Error deleting application: " + err.message);
          });
      }
    });
  });

  listContainer.innerHTML = "";
  listContainer.appendChild(table);
}

function getStatusLabel(status) {
  if (status === "selected") return "Selected";
  if (status === "rejected") return "Rejected";
  if (status === "joined") return "Joined";
  if (status === "not") return "Not Responding";
  if (status === "notI") return "Not Interested";
  return "To Be Interviewed";
}

// ✅ Load Applications from Firebase
db.ref("applications").on("value", snapshot => {
  allApplications = [];
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      allApplications.push({ key: child.key, ...child.val() });
    });
    renderApplications(allApplications);
  } else {
    listContainer.innerHTML = "<p>No applications yet.</p>";
  }
});

// ✅ Close menu when clicking outside
document.addEventListener("click", e => {
  if (!e.target.classList.contains("status-button")) {
    document.querySelectorAll(".status-menu").forEach(menu => menu.classList.add("hidden"));
  }
});

// ✅ Search functionality
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  const filteredApps = allApplications.filter(app => {
    const name = (app.name || "").toLowerCase();
    const phone = (app.phoneNumber || "").toLowerCase(); 
    const jobs = (app.job || "").toLowerCase();
    const location = (app.location || "").toLowerCase();
    const pos = (app.position || "").toLowerCase();
    const status = getStatusLabel(app.status || "yet").toLowerCase();

    return (
      name.includes(query) ||
      location.includes(query) ||
      phone.includes(query) ||
      pos.includes(query) ||
      jobs.includes(query) ||
      status.includes(query)
    );
  });

  if (filteredApps.length > 0) {
    renderApplications(filteredApps);
  } else {
    listContainer.innerHTML = `<p style="text-align:center; color:#888; font-style:italic;">No applications found.</p>`;
  }
});
