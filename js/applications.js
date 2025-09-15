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
const genderFilter = document.getElementById("genderFilter");
const positionFilter = document.getElementById("positionFilter");
const locationFilter = document.getElementById("locationFilter");
const clearFilters = document.getElementById("clearFilters");

let allApplications = []; // Store all apps here for filtering

// 🟢 Normalization function for position (synonyms handling)
function normalizePosition(position) {
  if (!position) return "";
  const val = position.toLowerCase();

  if (
    val.includes("pick") ||
    val.includes("packer") ||
    val.includes("picker paker") ||
    val.includes("loading") ||
    val.includes("unloading")
  ) {
    return "picker and packers"; // ✅ unified value
  }

  return val;
}

// 🟢 Render Applications
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
        <th>Time</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  applications.forEach(app => {
    const tr = document.createElement("tr");

    // Format timestamp if exists
    let dateTime = "";
    if (app.timestamp) {
      const dateObj = new Date(app.timestamp);
      dateTime = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();
    }

    tr.innerHTML = `
      <td>${app.name || ""}</td>
      <td>${app.phoneNumber || ""}</td>
      <td>${app.job || ""}</td>
      <td>${app.location || ""}</td>
      <td>${app.gender || ""}</td>
      <td>${app.position || ""}</td> <!-- ✅ show ORIGINAL position -->
      <td>${dateTime}</td>
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
        <button class="delete-button">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);

    // ✅ Status button logic
    const statusButton = tr.querySelector(".status-button");
    const menu = tr.querySelector(".status-menu");
    const deleteButton = tr.querySelector(".delete-button");

    statusButton.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".status-menu").forEach(m => m.classList.add("hidden"));
      menu.classList.toggle("hidden");
    });

    menu.querySelectorAll(".status-option").forEach(option => {
      option.addEventListener("click", () => {
        const newStatus = option.dataset.status;

        // ✅ Update Firebase
        db.ref(`applications/${app.key}`).update({ status: newStatus })
          .then(() => {
            const idx = allApplications.findIndex(a => a.key === app.key);
            if (idx !== -1) {
              allApplications[idx].status = newStatus;
            }
            applyFilters(); 
            menu.classList.add("hidden");
          })
          .catch(err => {
            alert("Error updating status: " + err.message);
          });
      });
    });

    deleteButton.addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete application of ${app.name}?`)) {
        db.ref(`applications/${app.key}`).remove()
          .then(() => {
            allApplications = allApplications.filter(a => a.key !== app.key);
            applyFilters();
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

// 🟢 Status label
function getStatusLabel(status) {
  if (status === "selected") return "Selected";
  if (status === "rejected") return "Rejected";
  if (status === "joined") return "Joined";
  if (status === "not") return "Not Responding";
  if (status === "notI") return "Not Interested";
  return "To Be Interviewed";
}

// 🟢 Populate dropdowns dynamically
function populateFilterOptions(applications) {
  const currentGender = genderFilter.value;
  const currentPosition = positionFilter.value;
  const currentLocation = locationFilter.value;

  const positions = [...new Set(applications.map(app => normalizePosition(app.position)).filter(Boolean))];
  const locations = [...new Set(applications.map(app => app.location).filter(Boolean))];

  positionFilter.innerHTML = `<option value="">All Positions</option>` +
    positions.map(pos => `<option value="${pos}">${pos}</option>`).join("");

  locationFilter.innerHTML = `<option value="">All Locations</option>` +
    locations.map(loc => `<option value="${loc.toLowerCase()}">${loc}</option>`).join("");

  genderFilter.value = currentGender;
  positionFilter.value = currentPosition;
  locationFilter.value = currentLocation;
}

// 🟢 Apply search + filters
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const gender = genderFilter.value;
  const pos = positionFilter.value;
  const loc = locationFilter.value;

  const filteredApps = allApplications.filter(app => {
    const name = (app.name || "").toLowerCase();
    const phone = (app.phoneNumber || "").toLowerCase();
    const jobs = (app.job || "").toLowerCase();
    const location = (app.location || "").toLowerCase();
    const position = normalizePosition(app.position || ""); // ✅ normalized for matching
    const genderVal = (app.gender || "").toLowerCase();
    const status = getStatusLabel(app.status || "yet").toLowerCase();

    const matchesSearch =
      !query ||
      name.includes(query) ||
      phone.includes(query) ||
      jobs.includes(query) ||
      location.includes(query) ||
      position.includes(query) ||
      status.includes(query);

    const matchesGender = !gender || genderVal === gender;
    const matchesPos = !pos || position === pos; // ✅ normalized check
    const matchesLoc = !loc || location === loc;

    return matchesSearch && matchesGender && matchesPos && matchesLoc;
  });

  if (filteredApps.length > 0) {
    renderApplications(filteredApps);
  } else {
    listContainer.innerHTML = `<p style="text-align:center; color:#888; font-style:italic;">No applications found.</p>`;
  }
}

// ✅ Event listeners
searchInput.addEventListener("input", applyFilters);
genderFilter.addEventListener("change", applyFilters);
positionFilter.addEventListener("change", applyFilters);
locationFilter.addEventListener("change", applyFilters);

clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  genderFilter.value = "";
  positionFilter.value = "";
  locationFilter.value = "";
  applyFilters();
});

// ✅ Load Applications from Firebase
db.ref("applications").on("value", snapshot => {
  allApplications = [];
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      allApplications.push({ key: child.key, ...child.val() });
    });
    populateFilterOptions(allApplications);
    applyFilters();
  } else {
    listContainer.innerHTML = "<p>No applications yet.</p>";
  }
});

// ✅ Close status menu when clicking outside
document.addEventListener("click", e => {
  if (!e.target.classList.contains("status-button")) {
    document.querySelectorAll(".status-menu").forEach(menu => menu.classList.add("hidden"));
  }
});
