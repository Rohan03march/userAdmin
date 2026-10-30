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

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.sourceone.app&pcampaignid=web_share";

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

/**
 * Checks if a position is Picker & Packer (case-insensitive)
 */
function isPickerAndPacker(position) {
  if (!position) return false;
  const p = position.toLowerCase().trim();
  return (
    (p.includes("pick") && p.includes("pack")) ||
    p === "picker & packer" ||
    p === "picker and packer" ||
    p === "pickers and packers" ||
    p === "picker & packer staff"
  );
}

function initJobEventListeners() {
  if (isJobEventsInitialized) return;
  isJobEventsInitialized = true;

  // Render location checkboxes
  renderLocationCheckboxes();

  // Position selection handler
  const jobPositionSelect = document.getElementById("jobPosition");
  const customPositionGroup = document.getElementById("customPositionGroup");
  const customPositionInput = document.getElementById("customPositionInput");
  const locationsPanelCard = document.getElementById("locationsPanelCard");
  const pickerPackerNotice = document.getElementById("pickerPackerNotice");

  function handlePositionSelection() {
    const val = jobPositionSelect ? jobPositionSelect.value : "";
    if (val === "Others") {
      if (customPositionGroup) customPositionGroup.style.display = "block";
      if (customPositionInput) customPositionInput.focus();
    } else {
      if (customPositionGroup) customPositionGroup.style.display = "none";
      if (customPositionInput) customPositionInput.value = "";
    }

    // Toggle location panel vs Play Store notice for Picker & Packer
    const effectivePosition = val === "Others" && customPositionInput ? customPositionInput.value.trim() : val;
    if (isPickerAndPacker(effectivePosition)) {
      if (locationsPanelCard) locationsPanelCard.style.display = "none";
      if (pickerPackerNotice) pickerPackerNotice.style.display = "flex";
    } else {
      if (locationsPanelCard) locationsPanelCard.style.display = "block";
      if (pickerPackerNotice) pickerPackerNotice.style.display = "none";
    }
  }

  if (jobPositionSelect) {
    jobPositionSelect.addEventListener("change", handlePositionSelection);
  }

  if (customPositionInput) {
    customPositionInput.addEventListener("input", () => {
      if (jobPositionSelect && jobPositionSelect.value === "Others") {
        if (isPickerAndPacker(customPositionInput.value.trim())) {
          if (locationsPanelCard) locationsPanelCard.style.display = "none";
          if (pickerPackerNotice) pickerPackerNotice.style.display = "flex";
        } else {
          if (locationsPanelCard) locationsPanelCard.style.display = "block";
          if (pickerPackerNotice) pickerPackerNotice.style.display = "none";
        }
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

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getJobLocationsArray(job) {
  if (!job) return [];
  // For Picker & Packer, there is no physical location
  if (isPickerAndPacker(job.position)) {
    return [];
  }
  if (Array.isArray(job.locations) && job.locations.length > 0) {
    return job.locations.map((s) => String(s).trim()).filter(Boolean);
  }
  if (job.location && typeof job.location === "string" && !job.location.includes("Mobile App")) {
    return job.location.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Consolidates jobs so identical roles with multiple locations
 * are always represented as ONE opening card rather than multiple boxes.
 */
function getConsolidatedJobs() {
  const map = new Map();

  allJobs.forEach((job) => {
    const normPos = (job.position || "").trim().toLowerCase();
    const normType = (job.jobType || "").trim().toLowerCase();
    const key = `${normPos}|||${normType}`;

    const locs = getJobLocationsArray(job);
    const isPP = isPickerAndPacker(job.position);

    if (map.has(key)) {
      const existing = map.get(key);
      if (!isPP) {
        locs.forEach((l) => {
          if (!existing.locations.some((el) => el.toLowerCase() === l.toLowerCase())) {
            existing.locations.push(l);
          }
        });
        existing.location = existing.locations.join(", ");
      } else {
        existing.locations = [];
        existing.location = "SourceOne Mobile App";
        existing.isAppRedirect = true;
        existing.redirectUrl = PLAY_STORE_URL;
      }
      if (!existing.allIds.includes(job.id)) {
        existing.allIds.push(job.id);
      }
      if ((job.createdAt || 0) > (existing.createdAt || 0)) {
        existing.createdAt = job.createdAt;
      }
      if (job.requirements && (!existing.requirements || existing.requirements.length < job.requirements.length)) {
        existing.requirements = job.requirements;
      }
    } else {
      map.set(key, {
        id: job.id,
        allIds: [job.id],
        position: job.position,
        jobType: job.jobType,
        requirements: job.requirements || "",
        locations: isPP ? [] : [...locs],
        location: isPP ? "SourceOne Mobile App" : locs.join(", "),
        isAppRedirect: isPP,
        redirectUrl: isPP ? PLAY_STORE_URL : "",
        createdAt: job.createdAt || 0,
        updatedAt: job.updatedAt || 0
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Renders location pills/badges for a job card.
 * For Picker & Packer: renders Play Store redirect box with NO physical location.
 */
function renderJobLocations(locations, job) {
  // Picker & Packer has NO physical location - redirects to Play Store app
  if (job && isPickerAndPacker(job.position)) {
    return `
      <div class="job-card-app-redirect-box">
        <div class="app-redirect-badge">
          <i class="bx bxl-play-store"></i>
          <span>SourceOne App Only</span>
        </div>
        <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener noreferrer" class="btn-playstore-action" title="Redirects to SourceOne app on Google Play">
          <i class="bx bxl-google-play"></i>
          <span>Open on Play Store</span>
          <i class="bx bx-right-arrow-alt"></i>
        </a>
      </div>
    `;
  }

  if (!locations || locations.length === 0) {
    return `<div class="job-card-location single-loc"><i class="bx bxs-map"></i> <span>Location not specified</span></div>`;
  }

  if (locations.length === 1) {
    return `
      <div class="job-card-location single-loc">
        <i class="bx bxs-map"></i>
        <span class="job-loc-name" title="${escapeHtml(locations[0])}">${escapeHtml(locations[0])}</span>
      </div>
    `;
  }

  // Check if all 20 standard locations are present
  const standardLocationsLower = ALL_LOCATIONS.filter((l) => l !== "Others").map((l) => l.toLowerCase());
  const jobLocsLower = locations.map((l) => l.toLowerCase());
  const hasAllStandard = standardLocationsLower.every((l) => jobLocsLower.includes(l));

  if (hasAllStandard && locations.length >= 20) {
    return `
      <div class="job-card-location-multi">
        <div class="job-loc-header">
          <i class="bx bxs-map"></i>
          <span class="job-loc-all-badge" title="Available across all ${locations.length} store branches">
            <i class="bx bx-check-double"></i> All Locations (${locations.length} Stores)
          </span>
          <button type="button" class="job-loc-expand-btn" title="Toggle store list">
            <i class="bx bx-chevron-down"></i>
          </button>
        </div>
        <div class="job-loc-chips-grid collapsed">
          ${locations.map((loc) => `<span class="job-loc-chip">${escapeHtml(loc)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  // Multiple locations (2 or more)
  const previewLimit = 3;
  const showMoreCount = locations.length - previewLimit;

  return `
    <div class="job-card-location-multi">
      <div class="job-loc-header">
        <i class="bx bxs-map"></i>
        <span class="job-loc-count-label">${locations.length} Locations</span>
      </div>
      <div class="job-loc-chips-wrap">
        ${locations.slice(0, previewLimit).map((loc) => `<span class="job-loc-chip">${escapeHtml(loc)}</span>`).join("")}
        ${showMoreCount > 0 ? `
          <button type="button" class="job-loc-more-btn" title="Click to view all ${locations.length} locations">
            +${showMoreCount} more
          </button>
        ` : ""}
      </div>
      ${showMoreCount > 0 ? `
        <div class="job-loc-chips-all" style="display: none;">
          ${locations.map((loc) => `<span class="job-loc-chip">${escapeHtml(loc)}</span>`).join("")}
          <button type="button" class="job-loc-less-btn">Show less</button>
        </div>
      ` : ""}
    </div>
  `;
}

function populateDashboardStoreFilter(consolidatedList) {
  const locFilterEl = document.getElementById("jobLocationFilter");
  if (!locFilterEl) return;
  const currentVal = locFilterEl.value;

  const storesSet = new Set();
  consolidatedList.forEach((j) => {
    const locs = getJobLocationsArray(j);
    locs.forEach((l) => {
      if (l && l.trim()) storesSet.add(l.trim());
    });
  });
  if (typeof ALL_LOCATIONS !== "undefined") {
    ALL_LOCATIONS.forEach((loc) => {
      if (loc !== "Others") storesSet.add(loc);
    });
  }

  const sortedStores = Array.from(storesSet).sort((a, b) => a.localeCompare(b));
  let html = `<option value="">All Stores / Locations (${consolidatedList.length} Openings)</option>`;
  sortedStores.forEach((s) => {
    const count = consolidatedList.filter((j) => {
      const locs = getJobLocationsArray(j).map((l) => l.toLowerCase());
      return locs.includes(s.toLowerCase());
    }).length;
    html += `<option value="${s}">${s} ${count > 0 ? `(${count})` : ""}</option>`;
  });
  locFilterEl.innerHTML = html;
  if (currentVal && storesSet.has(currentVal)) {
    locFilterEl.value = currentVal;
  }
}

function getRoleIconClass(position) {
  const p = (position || "").toLowerCase();
  if (p.includes("picker") || p.includes("packer")) return "bxs-package";
  if (p.includes("manager")) return "bxs-user-badge";
  if (p.includes("quantity")) return "bx-coin-stack";
  if (p.includes("process")) return "bx-cog";
  if (p.includes("shift")) return "bx-time-five";
  if (p.includes("security") || p.includes("guard")) return "bxs-shield";
  if (p.includes("loading") || p.includes("unloading")) return "bx-transfer-alt";
  if (p.includes("housekeeping")) return "bx-spray-can";
  return "bxs-briefcase-alt-2";
}

function updateJobsUI() {
  const searchEl = document.getElementById("searchInput");
  const jobToolbarSearchEl = document.getElementById("jobSearchFilter");
  const query = (jobToolbarSearchEl && jobToolbarSearchEl.value.trim())
    ? jobToolbarSearchEl.value.trim().toLowerCase()
    : (searchEl ? searchEl.value.trim().toLowerCase() : "");

  const locFilterEl = document.getElementById("jobLocationFilter");
  const selectedStore = locFilterEl ? locFilterEl.value.trim().toLowerCase() : "";

  const consolidatedJobs = getConsolidatedJobs();
  populateDashboardStoreFilter(consolidatedJobs);

  let filteredJobs = [...consolidatedJobs];

  if (query) {
    filteredJobs = filteredJobs.filter((job) => {
      const locs = getJobLocationsArray(job);
      const locMatch = locs.some((l) => l.toLowerCase().includes(query)) || (job.location || "").toLowerCase().includes(query);
      const isPP = isPickerAndPacker(job.position);
      const appMatch = isPP && (query.includes("app") || query.includes("play") || query.includes("store"));
      return (
        (job.position || "").toLowerCase().includes(query) ||
        locMatch ||
        appMatch ||
        (job.jobType || "").toLowerCase().includes(query) ||
        (job.requirements || "").toLowerCase().includes(query)
      );
    });
  }

  if (selectedStore) {
    filteredJobs = filteredJobs.filter((job) => {
      const locs = getJobLocationsArray(job).map((l) => l.toLowerCase());
      return locs.includes(selectedStore);
    });
  }

  // Update count badge
  const countBadge = document.getElementById("jobsCountBadge");
  if (countBadge) {
    if (filteredJobs.length === consolidatedJobs.length) {
      countBadge.innerText = `${consolidatedJobs.length} Openings`;
    } else {
      countBadge.innerText = `${filteredJobs.length} of ${consolidatedJobs.length} Openings`;
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
      <div class="add-new-icon-circle">
        <i class="bx bx-plus"></i>
      </div>
      <span class="add-new-title">Post New Job</span>
      <span class="add-new-sub">Create opening across branches</span>
    </div>
  `;
  addCard.addEventListener("click", () => {
    resetJobForm();
    const jobModal = document.getElementById("jobModal");
    if (jobModal) jobModal.classList.add("active");
  });
  jobsListContainer.appendChild(addCard);

  // If no matching jobs
  if (filteredJobs.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "jobs-empty-state";
    emptyState.innerHTML = `
      <i class="bx bx-briefcase-alt-2"></i>
      <h4>No Job Openings Found</h4>
      <p>Try adjusting your search or location filter, or click "+ Add New Job" to post an opening.</p>
    `;
    jobsListContainer.appendChild(emptyState);
    return;
  }

  // 2. Render actual jobs (each position is ONE card)
  filteredJobs.forEach((job) => {
    const card = document.createElement("div");
    let typeClass = (job.jobType || "").toLowerCase().replace(/\s+/g, "-");
    const jtLower = (job.jobType || "").toLowerCase();
    const isBoth = jtLower.includes("both") || (jtLower.includes("full") && jtLower.includes("part"));

    if (isBoth) {
      typeClass = "full-part-time";
    }

    const isPP = isPickerAndPacker(job.position);

    let tagsHTML = "";
    if (isBoth) {
      tagsHTML = `
        <span class="job-card-type full-time">Full Time</span>
        <span class="job-card-type part-time">Part Time</span>
      `;
    } else {
      tagsHTML = `<span class="job-card-type ${typeClass}">${escapeHtml(job.jobType || 'N/A')}</span>`;
    }

    if (isPP) {
      tagsHTML += `
        <span class="job-card-type app-play-badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700;">
          <i class="bx bxl-play-store"></i> Play Store App
        </span>
      `;
    }

    const jobLocations = getJobLocationsArray(job);
    const locationsHTML = renderJobLocations(jobLocations, job);

    let redirectIconBtnHTML = "";
    if (isPP) {
      redirectIconBtnHTML = `
        <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener noreferrer" class="job-btn redirect-btn" title="Open Google Play Store">
          <i class="bx bx-link-external"></i>
        </a>
      `;
    }

    card.className = `job-card-item ${typeClass} ${isPP ? 'is-app-redirect' : ''}`;
    const roleIcon = getRoleIconClass(job.position);
    const subCategory = isPP ? "Mobile App Hiring" : "Store Operations";
    const locCount = jobLocations.length;
    const footerLocText = locCount > 1 
      ? `${locCount} Locations` 
      : (locCount === 1 ? jobLocations[0] : "All Stores");

    card.innerHTML = `
      <div class="job-card-header">
        <div class="job-tags-wrap">
          ${tagsHTML}
        </div>
        <div class="job-card-actions">
          ${redirectIconBtnHTML}
          <button class="job-btn edit-btn" title="Edit Job Opening"><i class="bx bxs-edit"></i></button>
          <button class="job-btn delete-btn" title="Delete Job Opening"><i class="bx bxs-trash"></i></button>
        </div>
      </div>

      <div class="job-title-row">
        <div class="job-role-icon ${typeClass} ${isPP ? 'is-pp' : ''}">
          <i class="bx ${roleIcon}"></i>
        </div>
        <div class="job-title-meta">
          <h4 class="job-card-title" title="${escapeHtml(job.position || 'N/A')}">${escapeHtml(job.position || 'N/A')}</h4>
          <span class="job-card-sub">${subCategory}</span>
        </div>
      </div>

      <div class="job-card-body">
        ${locationsHTML}
        <div class="job-card-req-box">
          <div class="req-header">
            <i class="bx bx-list-check"></i>
            <span>Role Overview & Requirements</span>
          </div>
          <p class="job-card-req">${escapeHtml(job.requirements || 'No specific requirements listed.')}</p>
        </div>
      </div>

      <div class="job-card-footer">
        <div class="job-status-pill">
          <span class="pulse-dot"></span>
          <span class="status-label">Active Vacancy</span>
        </div>
        <div class="job-footer-meta">
          ${isPP 
            ? '<span class="footer-app-tag"><i class="bx bxl-android"></i> App Role</span>' 
            : `<span class="footer-loc-count"><i class="bx bx-store"></i> ${escapeHtml(footerLocText)}</span>`
          }
        </div>
      </div>
    `;

    // If Picker & Packer, clicking the card redirects to Play Store
    if (isPP) {
      card.style.cursor = "pointer";
      card.title = "Click to open SourceOne app on Google Play Store";
      card.addEventListener("click", (e) => {
        if (e.target.closest(".job-card-actions") || e.target.closest("button") || e.target.closest("a")) {
          return;
        }
        window.open(PLAY_STORE_URL, "_blank");
      });
    }

    // Hook up more/less buttons inside card
    const moreBtn = card.querySelector(".job-loc-more-btn");
    const lessBtn = card.querySelector(".job-loc-less-btn");
    const chipsWrap = card.querySelector(".job-loc-chips-wrap");
    const chipsAll = card.querySelector(".job-loc-chips-all");

    if (moreBtn && chipsWrap && chipsAll) {
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chipsWrap.style.display = "none";
        chipsAll.style.display = "flex";
      });
    }

    if (lessBtn && chipsWrap && chipsAll) {
      lessBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chipsAll.style.display = "none";
        chipsWrap.style.display = "flex";
      });
    }

    const expandBtn = card.querySelector(".job-loc-expand-btn");
    const allBadge = card.querySelector(".job-loc-all-badge");
    const chipsGrid = card.querySelector(".job-loc-chips-grid");

    if (expandBtn && chipsGrid) {
      const toggleAll = (e) => {
        e.stopPropagation();
        const isCollapsed = chipsGrid.classList.contains("collapsed");
        if (isCollapsed) {
          chipsGrid.classList.remove("collapsed");
          expandBtn.innerHTML = '<i class="bx bx-chevron-up"></i>';
        } else {
          chipsGrid.classList.add("collapsed");
          expandBtn.innerHTML = '<i class="bx bx-chevron-down"></i>';
        }
      };
      expandBtn.addEventListener("click", toggleAll);
      if (allBadge) allBadge.addEventListener("click", toggleAll);
    }

    card.querySelector(".edit-btn").addEventListener("click", () => editJob(job));
    card.querySelector(".delete-btn").addEventListener("click", () => deleteJob(job));

    jobsListContainer.appendChild(card);
  });
}

function saveJob() {
  const jobIdVal = document.getElementById("jobId").value;
  const legacyIdsVal = document.getElementById("jobLegacyIds") ? document.getElementById("jobLegacyIds").value : "";
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

  const isPickerPacker = isPickerAndPacker(position);

  // Auto-commit any text left in customLocationInput
  const customLocInput = document.getElementById("customLocationInput");
  if (customLocInput && customLocInput.value.trim()) {
    addCustomLocationTag(customLocInput.value.trim());
    customLocInput.value = "";
  }

  let selectedLocations = [];
  if (!isPickerPacker) {
    selectedLocations = getSelectedLocations();

    if (!selectedLocations || selectedLocations.length === 0) {
      alert("Please select at least one location or add a custom location.");
      return;
    }
  } else {
    // Picker & Packer has NO physical location - managed via Google Play app
    selectedLocations = [];
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
    // Editing an existing job opening
    saveBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> <span>Updating Job...</span>";
    const data = {
      position,
      location: isPickerPacker ? "SourceOne Mobile App" : selectedLocations.join(", "),
      locations: selectedLocations,
      isAppRedirect: isPickerPacker,
      redirectUrl: isPickerPacker ? PLAY_STORE_URL : "",
      jobType,
      requirements,
      updatedAt: Date.now()
    };

    db.ref("jobs/" + jobIdVal).update(data)
      .then(() => {
        // If there were legacy duplicate IDs consolidated into this job, clean them up
        if (legacyIdsVal) {
          const idsToDelete = legacyIdsVal.split(",").map((id) => id.trim()).filter((id) => id && id !== jobIdVal);
          idsToDelete.forEach((id) => {
            db.ref("jobs/" + id).remove().catch(() => { });
          });
        }
        alert("Job opening updated successfully!");
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
    // Creating a single job opening with all selected locations
    saveBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> <span>Saving Job...</span>";

    // Check if a job with the same position and type already exists in allJobs
    const existingJob = allJobs.find((j) =>
      (j.position || "").trim().toLowerCase() === position.trim().toLowerCase() &&
      (j.jobType || "").trim().toLowerCase() === jobType.trim().toLowerCase()
    );

    if (existingJob) {
      // Merge locations into the existing job so it remains a single card
      const existingLocs = getJobLocationsArray(existingJob);
      const mergedLocations = isPickerPacker ? [] : Array.from(new Set([...existingLocs, ...selectedLocations]));

      const updateData = {
        position,
        locations: mergedLocations,
        location: isPickerPacker ? "SourceOne Mobile App" : mergedLocations.join(", "),
        isAppRedirect: isPickerPacker,
        redirectUrl: isPickerPacker ? PLAY_STORE_URL : "",
        jobType,
        requirements: requirements || existingJob.requirements || "",
        updatedAt: Date.now()
      };

      db.ref("jobs/" + existingJob.id).update(updateData)
        .then(() => {
          alert(`Job opening for "${position}" already existed. Its details have been updated!`);
          closeJobModal();
        })
        .catch((error) => {
          alert("Error saving job: " + error.message);
        })
        .finally(() => {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalBtnHTML;
        });
    } else {
      // Brand new single job opening
      const newKey = db.ref("jobs").push().key;
      const jobData = {
        position,
        location: isPickerPacker ? "SourceOne Mobile App" : selectedLocations.join(", "),
        locations: selectedLocations,
        isAppRedirect: isPickerPacker,
        redirectUrl: isPickerPacker ? PLAY_STORE_URL : "",
        jobType,
        requirements,
        createdAt: Date.now()
      };

      db.ref("jobs/" + newKey).set(jobData)
        .then(() => {
          alert("Job opening created successfully!");
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
}

function editJob(job) {
  resetJobForm();
  document.getElementById("jobId").value = job.id;
  if (document.getElementById("jobLegacyIds")) {
    document.getElementById("jobLegacyIds").value = (job.allIds || [job.id]).join(",");
  }

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

  // Handle location vs Play Store notice for Picker & Packer
  const isPP = isPickerAndPacker(job.position);
  const locationsPanelCard = document.getElementById("locationsPanelCard");
  const pickerPackerNotice = document.getElementById("pickerPackerNotice");

  if (isPP) {
    if (locationsPanelCard) locationsPanelCard.style.display = "none";
    if (pickerPackerNotice) pickerPackerNotice.style.display = "flex";
    setSelectedLocations([]);
  } else {
    if (locationsPanelCard) locationsPanelCard.style.display = "block";
    if (pickerPackerNotice) pickerPackerNotice.style.display = "none";
    const locs = getJobLocationsArray(job);
    setSelectedLocations(locs);
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

function deleteJob(jobOrId) {
  const idsToDelete = (typeof jobOrId === "object" && jobOrId !== null)
    ? (jobOrId.allIds && jobOrId.allIds.length > 0 ? jobOrId.allIds : [jobOrId.id])
    : [jobOrId];

  const confirmMsg = idsToDelete.length > 1
    ? `Delete this job opening across all locations?`
    : `Delete this job opening?`;

  if (confirm(confirmMsg)) {
    const promises = idsToDelete.map((id) => db.ref("jobs/" + id).remove());
    Promise.all(promises)
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
  if (document.getElementById("jobLegacyIds")) {
    document.getElementById("jobLegacyIds").value = "";
  }
  document.getElementById("jobPosition").value = "";

  const customPosGroup = document.getElementById("customPositionGroup");
  if (customPosGroup) customPosGroup.style.display = "none";
  const customPosInput = document.getElementById("customPositionInput");
  if (customPosInput) customPosInput.value = "";

  const locationsPanelCard = document.getElementById("locationsPanelCard");
  if (locationsPanelCard) locationsPanelCard.style.display = "block";
  const pickerPackerNotice = document.getElementById("pickerPackerNotice");
  if (pickerPackerNotice) pickerPackerNotice.style.display = "none";

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
