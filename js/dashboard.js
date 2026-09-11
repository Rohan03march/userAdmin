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

const ALL_LOCATIONS = [
  "Balagere",
  "Banshankri",
  "Begur",
  "Chikathogur",
  "Chikkabidaralallu",
  "Deepanjali Nagar",
  "Haralur",
  "Hope Farm",
  "HSR Layout",
  "Kadugodi",
  "Kanamangala",
  "Koramangala",
  "Kundalahalli",
  "Madnayakanahalli",
  "Malleshwaram",
  "Mysore Road",
  "Shanthiniketan",
  "Wilson Garden",
  "Yelahanka",
  "Yeshwantpur",
  "Others"
];

let isJobEventsInitialized = false;
let customLocationsList = [];

function initJobEventListeners() {
  if (isJobEventsInitialized) return;
  isJobEventsInitialized = true;

  // Render location checkboxes
  renderLocationCheckboxes();

  // Position "Others" toggle
  const jobPositionSelect = document.getElementById("jobPosition");
  const customPositionGroup = document.getElementById("customPositionGroup");
  const customPositionInput = document.getElementById("customPositionInput");

  if (jobPositionSelect && customPositionGroup) {
    jobPositionSelect.addEventListener("change", () => {
      if (jobPositionSelect.value === "Others") {
        customPositionGroup.style.display = "block";
        if (customPositionInput) customPositionInput.focus();
      } else {
        customPositionGroup.style.display = "none";
        if (customPositionInput) customPositionInput.value = "";
      }
    });
  }

  // Select All Locations button (selects all 20 standard locations)
  const selectAllBtn = document.getElementById("selectAllLocBtn");
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      document.querySelectorAll(".loc-checkbox-item").forEach((cb) => {
        if (cb.value !== "Others") {
          cb.checked = true;
          cb.closest(".loc-item").classList.add("checked");
        }
      });
      updateSelectedLocationCount();
    });
  }

  // Clear All Locations button
  const clearAllBtn = document.getElementById("clearAllLocBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      document.querySelectorAll(".loc-checkbox-item").forEach((cb) => {
        cb.checked = false;
        cb.closest(".loc-item").classList.remove("checked");
      });
      customLocationsList = [];
      renderCustomChips();
      const customLocGroup = document.getElementById("customLocationGroup");
      if (customLocGroup) customLocGroup.style.display = "none";
      const customLocInput = document.getElementById("customLocationInput");
      if (customLocInput) customLocInput.value = "";
      updateSelectedLocationCount();
    });
  }

  // Toggle Custom Location panel button
  const toggleCustomBtn = document.getElementById("toggleCustomLocBtn");
  const customLocGroup = document.getElementById("customLocationGroup");
  const customLocInput = document.getElementById("customLocationInput");
  const addCustomBtn = document.getElementById("addCustomLocTagBtn");

  if (toggleCustomBtn && customLocGroup) {
    toggleCustomBtn.addEventListener("click", () => {
      const isHidden = customLocGroup.style.display === "none";
      customLocGroup.style.display = isHidden ? "block" : "none";
      if (isHidden && customLocInput) {
        customLocInput.focus();
      }
    });
  }

  // Add Custom Location Tag button
  if (addCustomBtn && customLocInput) {
    addCustomBtn.addEventListener("click", () => {
      const val = customLocInput.value.trim();
      if (val) {
        addCustomLocationTag(val);
        customLocInput.value = "";
        customLocInput.focus();
      }
    });
  }

  // Pressing Enter in Custom Location Input adds tag
  if (customLocInput) {
    customLocInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = customLocInput.value.trim();
        if (val) {
          addCustomLocationTag(val);
          customLocInput.value = "";
        }
      }
    });
  }

  // Filter locations live search
  const filterInput = document.getElementById("filterLocationInput");
  if (filterInput) {
    filterInput.addEventListener("input", (e) => {
      const filter = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".loc-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? "flex" : "none";
      });
    });
  }
}

function renderLocationCheckboxes() {
  const container = document.getElementById("locationCheckboxesContainer");
  if (!container) return;

  container.innerHTML = "";

  ALL_LOCATIONS.forEach((loc) => {
    const label = document.createElement("label");
    label.className = "loc-item";
    label.innerHTML = `
      <input type="checkbox" value="${loc}" class="loc-checkbox-item" />
      <span>${loc}</span>
    `;

    const checkbox = label.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        label.classList.add("checked");
      } else {
        label.classList.remove("checked");
      }

      if (loc === "Others") {
        const customLocGroup = document.getElementById("customLocationGroup");
        const customLocInput = document.getElementById("customLocationInput");
        if (customLocGroup) {
          customLocGroup.style.display = checkbox.checked ? "block" : "none";
          if (checkbox.checked && customLocInput) customLocInput.focus();
        }
      }

      updateSelectedLocationCount();
    });

    container.appendChild(label);
  });
}

function renderCustomChips() {
  const container = document.getElementById("customChipsWrap");
  if (!container) return;

  container.innerHTML = "";

  customLocationsList.forEach((loc, idx) => {
    const chip = document.createElement("span");
    chip.className = "loc-chip";
    chip.innerHTML = `
      <i class="bx bx-map-pin"></i>
      <span>${loc}</span>
      <span class="loc-chip-remove" title="Remove">&times;</span>
    `;

    chip.querySelector(".loc-chip-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      customLocationsList.splice(idx, 1);
      renderCustomChips();
      updateSelectedLocationCount();
    });

    container.appendChild(chip);
  });
}

function addCustomLocationTag(rawText) {
  if (!rawText) return;
  const items = rawText.split(",").map((t) => t.trim()).filter(Boolean);
  let added = false;

  items.forEach((item) => {
    // If it's one of the standard locations, check that checkbox directly!
    let matchedStandard = false;
    document.querySelectorAll(".loc-checkbox-item").forEach((cb) => {
      if (cb.value.toLowerCase() === item.toLowerCase() && cb.value !== "Others") {
        cb.checked = true;
        cb.closest(".loc-item").classList.add("checked");
        matchedStandard = true;
        added = true;
      }
    });

    if (!matchedStandard && !customLocationsList.includes(item)) {
      customLocationsList.push(item);
      added = true;
    }
  });

  if (added) {
    renderCustomChips();
    updateSelectedLocationCount();
  }
}

function updateSelectedLocationCount() {
  const badge = document.getElementById("locationCountBadge");
  if (!badge) return;

  const count = getSelectedLocations().length;
  badge.innerHTML = `<i class="bx bx-check"></i> ${count} selected`;
}

function getSelectedLocations() {
  const checkedLocations = [];
  document.querySelectorAll(".loc-checkbox-item:checked").forEach((cb) => {
    if (cb.value !== "Others") {
      checkedLocations.push(cb.value);
    }
  });

  // Include custom location tags
  customLocationsList.forEach((loc) => {
    if (!checkedLocations.includes(loc)) {
      checkedLocations.push(loc);
    }
  });

  return checkedLocations;
}

function setSelectedLocations(locs) {
  const targetLocations = Array.isArray(locs) ? locs : [locs];
  customLocationsList = [];

  document.querySelectorAll(".loc-checkbox-item").forEach((cb) => {
    if (targetLocations.includes(cb.value)) {
      cb.checked = true;
      cb.closest(".loc-item").classList.add("checked");
    } else {
      cb.checked = false;
      cb.closest(".loc-item").classList.remove("checked");
    }
  });

  // Add any locations not in predefined ALL_LOCATIONS to custom list
  targetLocations.forEach((loc) => {
    if (loc && !ALL_LOCATIONS.includes(loc)) {
      if (!customLocationsList.includes(loc)) {
        customLocationsList.push(loc);
      }
    }
  });

  const customGroup = document.getElementById("customLocationGroup");
  if (customLocationsList.length > 0) {
    if (customGroup) customGroup.style.display = "block";
  }
  renderCustomChips();
  updateSelectedLocationCount();
}

function initJobs() {
  initJobEventListeners();

  db.ref("jobs").on("value", (snapshot) => {
    allJobs = [];
    snapshot.forEach((child) => {
      allJobs.push({ id: child.key, ...child.val() });
    });
    updateJobsUI();
  });
}

function populateDashboardStoreFilter() {
  const locFilterEl = document.getElementById("jobLocationFilter");
  if (!locFilterEl) return;
  const currentVal = locFilterEl.value;

  const storesSet = new Set();
  allJobs.forEach((j) => {
    if (j.location && j.location.trim()) storesSet.add(j.location.trim());
  });
  if (typeof ALL_LOCATIONS !== "undefined") {
    ALL_LOCATIONS.forEach((loc) => {
      if (loc !== "Others") storesSet.add(loc);
    });
  }

  const sortedStores = Array.from(storesSet).sort((a, b) => a.localeCompare(b));
  let html = `<option value="">All Stores / Locations (${allJobs.length})</option>`;
  sortedStores.forEach((s) => {
    const count = allJobs.filter((j) => (j.location || "").toLowerCase() === s.toLowerCase()).length;
    html += `<option value="${s}">${s} ${count > 0 ? `(${count})` : ''}</option>`;
  });
  locFilterEl.innerHTML = html;
  if (currentVal && storesSet.has(currentVal)) {
    locFilterEl.value = currentVal;
  }
}

function updateJobsUI() {
  const searchEl = document.getElementById("searchInput");
  const jobToolbarSearchEl = document.getElementById("jobSearchFilter");
  const query = (jobToolbarSearchEl && jobToolbarSearchEl.value.trim()) 
    ? jobToolbarSearchEl.value.trim().toLowerCase() 
    : (searchEl ? searchEl.value.trim().toLowerCase() : "");

  const locFilterEl = document.getElementById("jobLocationFilter");
  const selectedStore = locFilterEl ? locFilterEl.value.trim().toLowerCase() : "";

  populateDashboardStoreFilter();

  let filteredJobs = [...allJobs];

  if (query) {
    filteredJobs = filteredJobs.filter((job) => 
      (job.position || "").toLowerCase().includes(query) ||
      (job.location || "").toLowerCase().includes(query) ||
      (job.jobType || "").toLowerCase().includes(query) ||
      (job.requirements || "").toLowerCase().includes(query)
    );
  }

  if (selectedStore) {
    filteredJobs = filteredJobs.filter((job) =>
      (job.location || "").toLowerCase() === selectedStore
    );
  }

  // Update count badge
  const countBadge = document.getElementById("jobsCountBadge");
  if (countBadge) {
    if (filteredJobs.length === allJobs.length) {
      countBadge.innerText = `${allJobs.length} Openings`;
    } else {
      countBadge.innerText = `${filteredJobs.length} of ${allJobs.length} Openings`;
    }
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
    let typeClass = (job.jobType || "").toLowerCase().replace(/\s+/g, "-");
    const jtLower = (job.jobType || "").toLowerCase();
    const isBoth = jtLower.includes("both") || (jtLower.includes("full") && jtLower.includes("part"));

    if (isBoth) {
      typeClass = "full-part-time";
    }

    let tagsHTML = "";
    if (isBoth) {
      tagsHTML = `
        <span class="job-card-type full-time">Full Time</span>
        <span class="job-card-type part-time">Part Time</span>
      `;
    } else {
      tagsHTML = `<span class="job-card-type ${typeClass}">${job.jobType || 'N/A'}</span>`;
    }

    card.className = `job-card-item ${typeClass}`;
    card.innerHTML = `
      <div class="job-card-header">
        <div class="job-tags-wrap">
          ${tagsHTML}
        </div>
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
  const positionSelect = document.getElementById("jobPosition").value;
  const customPositionInput = document.getElementById("customPositionInput");
  const customPosition = customPositionInput ? customPositionInput.value.trim() : "";
  const jobType = document.getElementById("jobTypeSelect").value;
  const requirements = document.getElementById("jobRequirements").value.trim();

  // Determine final position
  let position = positionSelect;
  if (positionSelect === "Others") {
    if (!customPosition) {
      alert("Please specify the custom position name.");
      if (customPositionInput) customPositionInput.focus();
      return;
    }
    position = customPosition;
  }

  if (!position) {
    alert("Please select or enter a position.");
    return;
  }

  // Auto-commit any text left in customLocationInput
  const customLocInput = document.getElementById("customLocationInput");
  if (customLocInput && customLocInput.value.trim()) {
    addCustomLocationTag(customLocInput.value.trim());
    customLocInput.value = "";
  }

  const selectedLocations = getSelectedLocations();

  if (!selectedLocations || selectedLocations.length === 0) {
    alert("Please select at least one location or add a custom location.");
    return;
  }

  if (!jobType) {
    alert("Please select a job type.");
    return;
  }

  if (!requirements) {
    alert("Please enter job requirements.");
    return;
  }

  const saveBtn = document.getElementById("saveJobBtn");
  const originalBtnHTML = saveBtn.innerHTML;
  saveBtn.disabled = true;

  if (jobIdVal) {
    // Editing an existing single job
    saveBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> <span>Updating...</span>";
    const data = {
      position,
      location: selectedLocations[0],
      jobType,
      requirements,
      updatedAt: Date.now()
    };

    db.ref("jobs/" + jobIdVal).update(data)
      .then(() => {
        alert("Job updated successfully!");
        closeJobModal();
      })
      .catch((error) => {
        alert("Error updating job: " + error.message);
      })
      .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnHTML;
      });
  } else {
    // Bulk or single creation for all selected locations
    const count = selectedLocations.length;
    saveBtn.innerHTML = count > 1 
      ? `<i class='bx bx-loader-alt bx-spin'></i> <span>Creating ${count} Jobs...</span>`
      : "<i class='bx bx-loader-alt bx-spin'></i> <span>Saving...</span>";

    const updates = {};
    const now = Date.now();

    selectedLocations.forEach((loc, idx) => {
      const newKey = db.ref("jobs").push().key;
      updates["jobs/" + newKey] = {
        position,
        location: loc,
        jobType,
        requirements,
        createdAt: now - idx
      };
    });

    db.ref().update(updates)
      .then(() => {
        const msg = count > 1 
          ? `Successfully created ${count} job openings across all selected locations!`
          : "Job created successfully!";
        alert(msg);
        closeJobModal();
      })
      .catch((error) => {
        alert("Error creating job: " + error.message);
      })
      .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnHTML;
      });
  }
}

function editJob(job) {
  resetJobForm();
  document.getElementById("jobId").value = job.id;

  // Check if position exists in dropdown options
  const positionSelect = document.getElementById("jobPosition");
  let foundPosition = false;
  for (let i = 0; i < positionSelect.options.length; i++) {
    if (positionSelect.options[i].value === job.position) {
      positionSelect.value = job.position;
      foundPosition = true;
      break;
    }
  }

  const customPosGroup = document.getElementById("customPositionGroup");
  const customPosInput = document.getElementById("customPositionInput");
  if (!foundPosition && job.position) {
    positionSelect.value = "Others";
    if (customPosGroup) customPosGroup.style.display = "block";
    if (customPosInput) customPosInput.value = job.position;
  } else {
    if (customPosGroup) customPosGroup.style.display = "none";
    if (customPosInput) customPosInput.value = "";
  }

  // Set location
  if (job.location) {
    setSelectedLocations([job.location]);
  }

  if (job.jobType && job.jobType.toLowerCase().includes("both")) {
    document.getElementById("jobTypeSelect").value = "Full-Time & Part-Time";
  } else {
    document.getElementById("jobTypeSelect").value = job.jobType || "";
  }
  document.getElementById("jobRequirements").value = job.requirements || "";

  document.getElementById("jobFormTitle").innerText = "Edit Position";
  document.getElementById("saveJobBtn").innerHTML = "<i class='bx bx-check-double'></i> <span>Update Job</span>";

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
  
  const customPosGroup = document.getElementById("customPositionGroup");
  if (customPosGroup) customPosGroup.style.display = "none";
  const customPosInput = document.getElementById("customPositionInput");
  if (customPosInput) customPosInput.value = "";

  document.getElementById("jobTypeSelect").value = "";
  document.getElementById("jobRequirements").value = "";

  setSelectedLocations([]);
  customLocationsList = [];
  renderCustomChips();
  const customLocGroup = document.getElementById("customLocationGroup");
  if (customLocGroup) customLocGroup.style.display = "none";
  const customLocInput = document.getElementById("customLocationInput");
  if (customLocInput) customLocInput.value = "";

  const filterInput = document.getElementById("filterLocationInput");
  if (filterInput) {
    filterInput.value = "";
    document.querySelectorAll(".loc-item").forEach((item) => (item.style.display = "flex"));
  }

  document.getElementById("jobFormTitle").innerText = "Add New Position";
  document.getElementById("saveJobBtn").innerHTML = "<i class='bx bx-check-circle'></i> <span>Save Job</span>";
}

function closeJobModal() {
  const jobModal = document.getElementById("jobModal");
  if (jobModal) jobModal.classList.remove("active");
  resetJobForm();
}

// Job Toolbar Filter Listeners
const jobSearchFilterEl = document.getElementById("jobSearchFilter");
if (jobSearchFilterEl) {
  jobSearchFilterEl.addEventListener("input", () => {
    updateJobsUI();
  });
}

const jobLocationFilterEl = document.getElementById("jobLocationFilter");
if (jobLocationFilterEl) {
  jobLocationFilterEl.addEventListener("change", () => {
    updateJobsUI();
  });
}

const clearJobFiltersBtnEl = document.getElementById("clearJobFiltersBtn");
if (clearJobFiltersBtnEl) {
  clearJobFiltersBtnEl.addEventListener("click", () => {
    if (jobSearchFilterEl) jobSearchFilterEl.value = "";
    if (jobLocationFilterEl) jobLocationFilterEl.value = "";
    const navSearch = document.getElementById("searchInput");
    if (navSearch) navSearch.value = "";
    updateJobsUI();
  });
}
