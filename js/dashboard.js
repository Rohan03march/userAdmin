/* ===============================
   SIDEBAR & UI LOGIC
================================ */

const allSideMenu = document.querySelectorAll("#sidebar .side-menu.top li a");

allSideMenu.forEach((item) => {
  const li = item.parentElement;
  item.addEventListener("click", (e) => {
    if (item.classList.contains("tab-link")) {
      e.preventDefault();
      allSideMenu.forEach((i) => i.parentElement.classList.remove("active"));
      li.classList.add("active");
      
      const target = item.getAttribute("data-target");
      const dashboardView = document.getElementById("dashboardView");
      const jobListView = document.getElementById("jobListView");
      
      if (target === "dashboardView") {
        if (dashboardView) dashboardView.style.display = "block";
        if (jobListView) jobListView.style.display = "none";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.placeholder = "Search Name, Contact, Location, Designation ...";
      } else if (target === "jobListView") {
        if (dashboardView) dashboardView.style.display = "none";
        if (jobListView) jobListView.style.display = "block";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.placeholder = "Search Job Title, Location, Type ...";
      }
      
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      currentPage = 1;
      updateUI();
      updateJobsUI();
    }
  });
});

// Toggle sidebar
const menuBar = document.querySelector("#content nav .bx.bx-menu");
const sidebar = document.getElementById("sidebar");

menuBar.addEventListener("click", () => {
  sidebar.classList.toggle("hide");
});

// Dark mode
const switchMode = document.getElementById("switch-mode");
switchMode.addEventListener("change", function () {
  document.body.classList.toggle("dark", this.checked);
});

/* ===============================
   FIREBASE INIT
================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
  authDomain: "login-9338e.firebaseapp.com",
  databaseURL: "https://login-9338e-default-rtdb.firebaseio.com",
  projectId: "login-9338e",
  storageBucket: "login-9338e.appspot.com",
  messagingSenderId: "649880075591",
  appId: "1:649880075591:web:a5cd336a03d80e9b656062",
  measurementId: "G-GT8TRDM62Y",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ===============================
   PAGINATION CONFIG
================================ */

const PAGE_SIZE = 10;
let currentPage = 1;
let allUsers = [];

/* ===============================
   FETCH USERS (ONCE)
================================ */

async function fetchAllUsers() {
  const snapshot = await db.ref("registrations").once("value");
  const users = [];

  snapshot.forEach((child) => {
    users.push({ id: child.key, ...child.val() });
  });

  return users;
}


/* ===============================
   SORT
================================ */
function getSubmittedAtTimestamp(user) {
  if (!user.submittedAt || typeof user.submittedAt !== "string") return 0;

  // Example: "16/07/2025, 16:10:56"
  const parts = user.submittedAt.split(",");

  if (parts.length !== 2) return 0;

  const datePart = parts[0].trim(); // "16/07/2025"
  const timePart = parts[1].trim(); // "16:10:56"

  const [day, month, year] = datePart.split("/");
  const [hour, minute, second = "00"] = timePart.split(":");

  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const ts = new Date(iso).getTime();

  return isNaN(ts) ? 0 : ts;
}


function sortBySubmittedAt(users) {
  users.sort((a, b) => {
    return getSubmittedAtTimestamp(b) - getSubmittedAtTimestamp(a);
  });
}




/* ===============================
   SEARCH (FILTER ONLY)
================================ */

function filterUsers(query) {
  query = query.toLowerCase();

  return allUsers.filter((u) =>
    (u.nameAsPerAadhaar || "").toLowerCase().includes(query) ||
    (u.contactNumber || "").toLowerCase().includes(query) ||
    (u.workingLocation || "").toLowerCase().includes(query) ||
    (u.designation || "").toLowerCase().includes(query)
  );
}

/* ===============================
   RENDER TABLE (10 PER PAGE)
================================ */

function renderTable(users) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageUsers = users.slice(start, end); // ✅ ONLY 10

  console.log("Rendered rows:", pageUsers.length); // debug

  if (!pageUsers.length) {
    tbody.innerHTML =
      `<tr><td colspan="6" style="text-align:center">No users found</td></tr>`;
    return;
  }

  pageUsers.forEach((user) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${user.submittedAt ? user.submittedAt.split(",")[0] : "N/A"}</td>
      <td>
        <a href="user.html?id=${encodeURIComponent(user.id)}"
           style="text-decoration:none;color:inherit;">
          <img src="${user.photo || ""}"
               style="width:40px;height:40px;border-radius:50%;
               object-fit:cover;margin-right:10px;vertical-align:middle;">
          ${user.nameAsPerAadhaar || "Unknown"}
        </a>
      </td>
      <td>${user.contactNumber || "Null"}</td>
      <td>${user.workingLocation || "Null"}</td>
      <td>${user.designation || "Null"}</td>
      <td>
        <button style="background:#e74c3c;color:#fff;border:none;
          padding:5px 10px;border-radius:4px">
          Delete
        </button>
      </td>
    `;

    tr.querySelector("button").onclick = async () => {
      if (confirm("Delete this user?")) {
        await db.ref(`registrations/${user.id}`).remove();
        allUsers = allUsers.filter((u) => u.id !== user.id);
        currentPage = 1;
        updateUI();
      }
    };

    console.log(
  "RAW:",
  user.submittedAt,
  "| TYPE:",
  typeof user.submittedAt
);


    tbody.appendChild(tr);
  });
}


/* ===============================
   PAGINATION UI
   Format: 1 2 … 10 11 Next
================================ */

function renderPagination(users) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  if (totalPages <= 1) return;

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    currentPage--;
    updateUI();
  };
  container.appendChild(prev);

  let startPage = currentPage;
  let endPage = Math.min(startPage + 1, totalPages);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => {
      currentPage = i;
      updateUI();
    };
    container.appendChild(btn);
  }

  if (endPage < totalPages - 1) {
    const dots = document.createElement("span");
    dots.textContent = "...";
    container.appendChild(dots);
  }

  if (endPage < totalPages) {
    const last = document.createElement("button");
    last.textContent = totalPages;
    last.onclick = () => {
      currentPage = totalPages;
      updateUI();
    };
    container.appendChild(last);
  }

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === totalPages;
  next.onclick = () => {
    currentPage++;
    updateUI();
  };
  container.appendChild(next);
}

/* ===============================
   SINGLE RENDER ENTRY POINT
================================ */

function getFilteredUsers() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const startDateStr = document.getElementById("filterStartDate") ? document.getElementById("filterStartDate").value : "";
  const endDateStr = document.getElementById("filterEndDate") ? document.getElementById("filterEndDate").value : "";

  let filtered = [...allUsers];

  if (query) {
    filtered = filtered.filter((u) =>
      (u.nameAsPerAadhaar || "").toLowerCase().includes(query) ||
      (u.contactNumber || "").toLowerCase().includes(query) ||
      (u.workingLocation || "").toLowerCase().includes(query) ||
      (u.designation || "").toLowerCase().includes(query)
    );
  }

  if (startDateStr || endDateStr) {
    const startTimestamp = startDateStr ? new Date(startDateStr + "T00:00:00").getTime() : 0;
    const endTimestamp = endDateStr ? new Date(endDateStr + "T23:59:59").getTime() : Infinity;

    filtered = filtered.filter(u => {
      const ts = getSubmittedAtTimestamp(u);
      if (ts === 0) return false;
      return ts >= startTimestamp && ts <= endTimestamp;
    });
  }

  return filtered;
}

function updateUI() {
  const filtered = getFilteredUsers();

  // ✅ SORT FIRST (latest / earliest as per your sort function)
  sortBySubmittedAt(filtered);

  // ✅ RENDER TABLE + PAGINATION
  renderTable(filtered);
  renderPagination(filtered);

  // ✅ PAGE INFO (THIS WAS MISSING)
  const pageInfo = document.getElementById("pageInfo");
  if (!pageInfo) return;

  if (filtered.length === 0) {
    pageInfo.textContent = "";
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(start + PAGE_SIZE - 1, filtered.length);

  pageInfo.textContent = `Showing ${start}–${end} of ${filtered.length}`;
}



/* ===============================
   INIT (ONLY PLACE DATA LOADS)
================================ */

document.addEventListener("DOMContentLoaded", async () => {
  allUsers = await fetchAllUsers();
  currentPage = 1;
  updateUI();
  
  // Initialize jobs
  initJobs();
  
  // Set up Job Form submit and cancel handlers
  const jobForm = document.getElementById("jobForm");
  if (jobForm) {
    jobForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveJob();
    });
  }
  
  const cancelBtn = document.getElementById("cancelJobEditBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeJobModal);
  }

  const closeBtn = document.getElementById("closeJobModalBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeJobModal);
  }

  const jobModal = document.getElementById("jobModal");
  if (jobModal) {
    jobModal.addEventListener("click", (e) => {
      if (e.target === jobModal) {
        closeJobModal();
      }
    });
  }
});

document.getElementById("searchInput").addEventListener("input", () => {
  const activeTab = document.querySelector("#sidebar .side-menu.top li.active");
  if (activeTab && activeTab.id === "jobListTabLi") {
    updateJobsUI();
  } else {
    currentPage = 1;
    updateUI();
  }
});

if (document.getElementById("filterStartDate")) {
  document.getElementById("filterStartDate").addEventListener("change", () => {
    currentPage = 1;
    updateUI();
  });
}
if (document.getElementById("filterEndDate")) {
  document.getElementById("filterEndDate").addEventListener("change", () => {
    currentPage = 1;
    updateUI();
  });
}

/* ===============================
   EXPORT TO EXCEL
================================ */
function exportToExcel() {
  const dataToExport = getFilteredUsers();
  
  if (dataToExport.length === 0) {
    alert("No data to export");
    return;
  }

  // Ensure it is sorted date-wise
  sortBySubmittedAt(dataToExport);

  // Get all unique keys
  const keys = new Set();
  dataToExport.forEach(user => {
    Object.keys(user).forEach(key => keys.add(key));
  });
  
  // Prioritize requested keys to appear first
  const priorityKeys = ["submittedAt", "nameAsPerAadhaar", "contactNumber", "workingLocation", "designation", "photo", "aadharFront", "aadharBack", "panCard", "passbook", "signature"];
  const columns = [];
  
  priorityKeys.forEach(key => {
    if (keys.has(key)) {
      columns.push(key);
      keys.delete(key);
    }
  });
  
  // Append the rest of the keys
  keys.forEach(key => columns.push(key));
  
  // Create JSON array for SheetJS
  const exportData = dataToExport.map(user => {
    const row = {};
    columns.forEach(col => {
      row[col] = user[col] !== undefined && user[col] !== null ? String(user[col]) : "";
    });
    return row;
  });
  
  // Generate Excel workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  
  // Download the Excel file
  XLSX.writeFile(workbook, "employees_export.xlsx");
}

document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportExcelBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToExcel);
  }
});

/* ===============================
   JOB LIST & MANAGEMENT LOGIC
================================ */

let allJobs = [];

function initJobs() {
  db.ref("jobs").on("value", (snapshot) => {
    allJobs = [];
    snapshot.forEach((child) => {
      allJobs.push({ id: child.key, ...child.val() });
    });
    updateJobsUI();
  });
}

function updateJobsUI() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  let filteredJobs = [...allJobs];

  if (query) {
    filteredJobs = filteredJobs.filter((job) => 
      (job.position || "").toLowerCase().includes(query) ||
      (job.location || "").toLowerCase().includes(query) ||
      (job.jobType || "").toLowerCase().includes(query) ||
      (job.requirements || "").toLowerCase().includes(query)
    );
  }

  // Sort by createdAt desc if available
  filteredJobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const jobsListContainer = document.getElementById("jobsListContainer");
  if (!jobsListContainer) return;

  jobsListContainer.innerHTML = "";

  // 1. Render the "+ Add New Job" outline card
  const addCard = document.createElement("div");
  addCard.className = "job-card-item add-new-outline-card";
  addCard.innerHTML = `
    <div class="add-new-content">
      <i class="bx bx-plus"></i>
      <span>Add New Job</span>
    </div>
  `;
  addCard.addEventListener("click", () => {
    resetJobForm();
    const jobModal = document.getElementById("jobModal");
    if (jobModal) jobModal.classList.add("active");
  });
  jobsListContainer.appendChild(addCard);

  // 2. Render actual jobs
  filteredJobs.forEach((job) => {
    const card = document.createElement("div");
    const typeClass = (job.jobType || "").toLowerCase().replace(/\s+/g, "-");
    card.className = `job-card-item ${typeClass}`;
    card.innerHTML = `
      <div class="job-card-header">
        <span class="job-card-type ${typeClass}">${job.jobType || 'N/A'}</span>
        <div class="job-card-actions">
          <button class="job-btn edit-btn" title="Edit Job"><i class="bx bxs-edit"></i></button>
          <button class="job-btn delete-btn" title="Delete Job"><i class="bx bxs-trash"></i></button>
        </div>
      </div>
      <h4 class="job-card-title">${job.position || 'N/A'}</h4>
      <div class="job-card-location">
        <i class="bx bxs-map"></i> ${job.location || 'N/A'}
      </div>
      <p class="job-card-req">${job.requirements || ''}</p>
    `;

    card.querySelector(".edit-btn").addEventListener("click", () => editJob(job));
    card.querySelector(".delete-btn").addEventListener("click", () => deleteJob(job.id));

    jobsListContainer.appendChild(card);
  });
}

function saveJob() {
  const jobIdVal = document.getElementById("jobId").value;
  const position = document.getElementById("jobPosition").value;
  const location = document.getElementById("jobLocation").value;
  const jobType = document.getElementById("jobTypeSelect").value;
  const requirements = document.getElementById("jobRequirements").value.trim();

  if (!position || !location || !jobType || !requirements) {
    alert("Please fill all fields");
    return;
  }

  const data = {
    position,
    location,
    jobType,
    requirements,
    createdAt: Date.now()
  };

  if (jobIdVal) {
    db.ref("jobs/" + jobIdVal).update(data)
      .then(() => {
        alert("Job updated successfully!");
        closeJobModal();
      })
      .catch((error) => {
        alert("Error updating job: " + error.message);
      });
  } else {
    db.ref("jobs").push(data)
      .then(() => {
        alert("Job created successfully!");
        closeJobModal();
      })
      .catch((error) => {
        alert("Error creating job: " + error.message);
      });
  }
}

function editJob(job) {
  document.getElementById("jobId").value = job.id;
  document.getElementById("jobPosition").value = job.position;
  document.getElementById("jobLocation").value = job.location;
  document.getElementById("jobTypeSelect").value = job.jobType;
  document.getElementById("jobRequirements").value = job.requirements;

  document.getElementById("jobFormTitle").innerText = "Edit Position";
  document.getElementById("saveJobBtn").innerText = "Update Job";

  const jobModal = document.getElementById("jobModal");
  if (jobModal) jobModal.classList.add("active");
}

function deleteJob(id) {
  if (confirm("Delete this job opening?")) {
    db.ref("jobs/" + id).remove()
      .then(() => {
        alert("Job deleted successfully!");
      })
      .catch((error) => {
        alert("Error deleting job: " + error.message);
      });
  }
}

function resetJobForm() {
  document.getElementById("jobId").value = "";
  document.getElementById("jobPosition").value = "";
  document.getElementById("jobLocation").value = "";
  document.getElementById("jobTypeSelect").value = "";
  document.getElementById("jobRequirements").value = "";

  document.getElementById("jobFormTitle").innerText = "Add New Position";
  document.getElementById("saveJobBtn").innerText = "Save Job";
}

function closeJobModal() {
  const jobModal = document.getElementById("jobModal");
  if (jobModal) jobModal.classList.remove("active");
  resetJobForm();
}
