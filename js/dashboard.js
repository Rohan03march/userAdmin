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
      const recruitmentView = document.getElementById("recruitmentView");

      if (target === "dashboardView") {
        if (dashboardView) dashboardView.style.display = "block";
        if (jobListView) jobListView.style.display = "none";
        if (recruitmentView) recruitmentView.style.display = "none";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.placeholder = "Search Name, Contact, Location, Designation ...";
      } else if (target === "jobListView") {
        if (dashboardView) dashboardView.style.display = "none";
        if (jobListView) jobListView.style.display = "block";
        if (recruitmentView) recruitmentView.style.display = "none";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.placeholder = "Search Job Title, Location, Type ...";
      } else if (target === "recruitmentView") {
        if (dashboardView) dashboardView.style.display = "none";
        if (jobListView) jobListView.style.display = "none";
        if (recruitmentView) recruitmentView.style.display = "block";
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.placeholder = "Search Company, Contact, Job Title, Location, Phone ...";
      }

      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      currentPage = 1;
      recruitmentCurrentPage = 1;
      updateUI();
      updateJobsUI();
      if (typeof updateRecruitmentUI === "function") updateRecruitmentUI();
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

  // Initialize recruitment leads
  if (typeof initRecruitment === "function") {
    initRecruitment();
  }

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
  } else if (activeTab && activeTab.id === "recruitmentTabLi") {
    recruitmentCurrentPage = 1;
    if (typeof updateRecruitmentUI === "function") updateRecruitmentUI();
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


/* ==========================================================================
   RECRUITMENT & RECRUITER LEADS LOGIC
   Fetches and manages data from Firebase RTDB under /recruiter_leads
   ========================================================================== */

let allRecruiterLeads = [];
let recruitmentCurrentPage = 1;
const RECRUITMENT_PAGE_SIZE = 10;
let isRecruitmentEventsInitialized = false;

/**
 * Extracts a numeric timestamp (in milliseconds) from any timestamp/date field.
 */
function getLeadTimestampMs(lead) {
  if (!lead) return 0;
  const raw = lead.timestamp || lead.createdAt || lead.submittedAt || lead.date || lead.time;
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  const parsed = Date.parse(raw);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats date and time for the recruitment table cell.
 */
function formatLeadDate(lead) {
  const ms = getLeadTimestampMs(lead);
  let datePart = "N/A";
  let timePart = "";
  if (ms) {
    const d = new Date(ms);
    datePart = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    timePart = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } else if (lead.date || lead.time || lead.timestamp) {
    datePart = String(lead.date || lead.timestamp || "N/A");
    if (lead.time) timePart = String(lead.time);
  }

  const sourceHtml = lead.source ? `<span class="lead-source-tag"><i class="bx bx-radio-circle-marked"></i> ${escapeHtml(lead.source)}</span>` : "";

  return `
    <div class="lead-date-cell">
      <span class="lead-date-main">${escapeHtml(datePart)}</span>
      ${timePart ? `<span class="lead-time-sub">${escapeHtml(timePart)}</span>` : ""}
      ${sourceHtml}
    </div>
  `;
}

/**
 * Formats a timestamp into human-readable plain text.
 */
function formatLeadDatePlain(lead) {
  const ms = getLeadTimestampMs(lead);
  if (ms) return new Date(ms).toLocaleString("en-IN");
  return lead.date || lead.time || lead.timestamp || "N/A";
}

/**
 * Maps status keys to display labels for recruiter inquiries.
 */
function getLeadStatusLabel(status) {
  if (!status) return "New / Inbound";
  const s = String(status).toLowerCase().trim();
  switch (s) {
    case "new":
    case "inbound":
    case "pending":
      return "New / Inbound";
    case "contacted":
      return "Contacted";
    case "in discussion":
    case "discussion":
    case "yet":
      return "In Discussion";
    case "requirements finalized":
    case "finalized":
      return "Reqs Finalized";
    case "hiring started":
    case "selected":
      return "Hiring Started";
    case "fulfilled":
    case "closed":
    case "joined":
      return "Fulfilled";
    case "dropped":
    case "rejected":
    case "not interested":
      return "Dropped";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Maps status keys to CSS color classes for the status dropdown select pill.
 */
function getLeadStatusClass(status) {
  if (!status) return "status-new";
  const s = String(status).toLowerCase().trim();
  if (s === "new" || s === "inbound" || s === "pending") return "status-new";
  if (s === "contacted") return "status-contacted";
  if (s.includes("discuss") || s === "yet") return "status-in-discussion";
  if (s.includes("finalized") || s.includes("requirement")) return "status-requirements-finalized";
  if (s.includes("hiring") || s === "selected") return "status-hiring-started";
  if (s.includes("fulfill") || s.includes("closed") || s === "joined") return "status-fulfilled";
  if (s.includes("drop") || s.includes("reject") || s.includes("not")) return "status-dropped";
  return "status-new";
}

/**
 * Maps urgency strings to styling classes.
 */
function getUrgencyClass(urgency) {
  if (!urgency) return "urgency-normal";
  const u = String(urgency).toLowerCase().trim();
  if (u.includes("urgent") || u.includes("immediate") || u.includes("asap") || u.includes("high")) {
    return "urgency-urgent";
  }
  if (u.includes("moderate") || u.includes("medium") || u.includes("week") || u.includes("15")) {
    return "urgency-moderate";
  }
  return "urgency-normal";
}

/**
 * Formats minimum and maximum monthly salary cleanly.
 */
function formatSalaryRange(min, max) {
  const numMin = parseInt(min, 10);
  const numMax = parseInt(max, 10);
  if (!isNaN(numMin) && !isNaN(numMax)) {
    return `₹${numMin.toLocaleString("en-IN")} – ₹${numMax.toLocaleString("en-IN")}/mo`;
  }
  if (!isNaN(numMin)) {
    return `₹${numMin.toLocaleString("en-IN")}+ /mo`;
  }
  if (!isNaN(numMax)) {
    return `Up to ₹${numMax.toLocaleString("en-IN")}/mo`;
  }
  if (min || max) {
    return `${min || ""} - ${max || ""}`;
  }
  return "Negotiable";
}

/**
 * Cleans a phone number string for click-to-call and WhatsApp integration.
 */
function getCleanPhoneNumber(phoneStr) {
  if (!phoneStr) return "";
  const cleaned = String(phoneStr).replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.length === 10) return "91" + cleaned;
  return cleaned;
}

/**
 * Computes 1-2 character initials for the company avatar circle.
 */
function getCompanyInitials(name) {
  if (!name || typeof name !== "string") return "CO";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Computes 1-2 character initials for candidate avatars (fallback).
 */
function getCandidateInitials(name) {
  if (!name || typeof name !== "string") return "C";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Initializes recruitment listeners and subscribes to Firebase RTDB /recruiter_leads.
 */
function initRecruitment() {
  initRecruitmentEventListeners();

  db.ref("recruiter_leads").on("value", (snapshot) => {
    allRecruiterLeads = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        allRecruiterLeads.push({ id: child.key, ...child.val() });
      });
    }

    // Sort descending: most recent leads first
    allRecruiterLeads.sort((a, b) => getLeadTimestampMs(b) - getLeadTimestampMs(a));

    populateRecruitmentFilterOptions(allRecruiterLeads);
    updateRecruitmentUI();
  }, (error) => {
    console.error("Firebase error reading recruiter_leads:", error);
    const tbody = document.getElementById("recruitmentTableBody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 32px 0; color: #ef4444;">
            <i class="bx bx-error-circle" style="font-size: 24px; vertical-align: middle;"></i>
            Failed to load recruiter leads. Error: ${escapeHtml(error.message || "Permission or network error")}
          </td>
        </tr>
      `;
    }
  });
}

/**
 * Attaches UI event listeners for toolbar filters, exports, and modals.
 */
function initRecruitmentEventListeners() {
  if (isRecruitmentEventsInitialized) return;
  isRecruitmentEventsInitialized = true;

  // Search input filter
  const searchInput = document.getElementById("recruitmentSearchFilter");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }

  // Status dropdown filter
  const statusFilter = document.getElementById("recruitmentStatusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }

  // Urgency dropdown filter
  const urgencyFilter = document.getElementById("recruitmentUrgencyFilter");
  if (urgencyFilter) {
    urgencyFilter.addEventListener("change", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }

  // Location dropdown filter
  const locationFilter = document.getElementById("recruitmentLocationFilter");
  if (locationFilter) {
    locationFilter.addEventListener("change", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }

  // Date range filters
  const startDateFilter = document.getElementById("recruitmentStartDate");
  const endDateFilter = document.getElementById("recruitmentEndDate");
  if (startDateFilter) {
    startDateFilter.addEventListener("change", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }
  if (endDateFilter) {
    endDateFilter.addEventListener("change", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }

  // Clear filters button
  const clearBtn = document.getElementById("clearRecruitmentFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "";
      if (urgencyFilter) urgencyFilter.value = "";
      if (locationFilter) locationFilter.value = "";
      if (startDateFilter) startDateFilter.value = "";
      if (endDateFilter) endDateFilter.value = "";
      const navSearch = document.getElementById("searchInput");
      if (navSearch) navSearch.value = "";
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
  }

  // Export to Excel button
  const exportBtn = document.getElementById("exportRecruitmentExcelBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportRecruitmentToExcel);
  }

  // Modal close buttons
  const modal = document.getElementById("recruitmentLeadModal");
  const closeBtn = document.getElementById("closeLeadModalBtn");
  const closeFooterBtn = document.getElementById("closeLeadModalFooterBtn");

  const closeModal = () => {
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

/**
 * Populates dynamic urgency and location options in the recruitment toolbar filters.
 */
function populateRecruitmentFilterOptions(leads) {
  // 1. Populate Urgency Filter
  const urgencyFilter = document.getElementById("recruitmentUrgencyFilter");
  if (urgencyFilter) {
    const currentVal = urgencyFilter.value;
    const urgencyMap = new Map();

    leads.forEach((l) => {
      const urg = l.fillUrgency ? String(l.fillUrgency).trim() : "";
      if (urg) {
        urgencyMap.set(urg, (urgencyMap.get(urg) || 0) + 1);
      }
    });

    let urgencyHtml = `<option value="">All Urgencies (${leads.length})</option>`;
    Array.from(urgencyMap.keys()).sort().forEach((urg) => {
      urgencyHtml += `<option value="${escapeHtml(urg)}">${escapeHtml(urg)} (${urgencyMap.get(urg)})</option>`;
    });

    urgencyFilter.innerHTML = urgencyHtml;
    if (currentVal && urgencyMap.has(currentVal)) {
      urgencyFilter.value = currentVal;
    }
  }

  // 2. Populate Location Filter
  const locationFilter = document.getElementById("recruitmentLocationFilter");
  if (locationFilter) {
    const currentVal = locationFilter.value;
    const locationMap = new Map();

    leads.forEach((l) => {
      const loc = l.jobLocation ? String(l.jobLocation).trim() : "";
      if (loc) {
        locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
      }
    });

    let locationHtml = `<option value="">All Locations (${leads.length})</option>`;
    Array.from(locationMap.keys()).sort().forEach((loc) => {
      locationHtml += `<option value="${escapeHtml(loc)}">${escapeHtml(loc)} (${locationMap.get(loc)})</option>`;
    });

    locationFilter.innerHTML = locationHtml;
    if (currentVal && locationMap.has(currentVal)) {
      locationFilter.value = currentVal;
    }
  }
}

/**
 * Returns the filtered list of recruiter leads based on active search, status, urgency, location, and date filters.
 */
function getFilteredRecruiterLeads() {
  const globalSearchEl = document.getElementById("searchInput");
  const inlineSearchEl = document.getElementById("recruitmentSearchFilter");
  const activeTab = document.querySelector("#sidebar .side-menu.top li.active");
  const isRecruitmentTabActive = activeTab && activeTab.id === "recruitmentTabLi";

  const query = (inlineSearchEl && inlineSearchEl.value.trim())
    ? inlineSearchEl.value.trim().toLowerCase()
    : (isRecruitmentTabActive && globalSearchEl && globalSearchEl.value.trim() ? globalSearchEl.value.trim().toLowerCase() : "");

  const statusFilterEl = document.getElementById("recruitmentStatusFilter");
  const selectedStatus = statusFilterEl ? statusFilterEl.value.trim().toLowerCase() : "";

  const urgencyFilterEl = document.getElementById("recruitmentUrgencyFilter");
  const selectedUrgency = urgencyFilterEl ? urgencyFilterEl.value.trim().toLowerCase() : "";

  const locationFilterEl = document.getElementById("recruitmentLocationFilter");
  const selectedLocation = locationFilterEl ? locationFilterEl.value.trim().toLowerCase() : "";

  const startDateEl = document.getElementById("recruitmentStartDate");
  const endDateEl = document.getElementById("recruitmentEndDate");

  let startMs = 0;
  if (startDateEl && startDateEl.value) {
    startMs = new Date(startDateEl.value + "T00:00:00").getTime();
  }

  let endMs = 0;
  if (endDateEl && endDateEl.value) {
    endMs = new Date(endDateEl.value + "T23:59:59.999").getTime();
  }

  return allRecruiterLeads.filter((lead) => {
    // 1. Search Query Filter across all 24 schema fields
    if (query) {
      const company = (lead.companyName || "").toLowerCase();
      const person = (lead.contactPersonName || "").toLowerCase();
      const phone = String(lead.contactPhone || lead.phoneNumber || "").toLowerCase();
      const email = (lead.contactEmail || "").toLowerCase();
      const title = (lead.jobTitle || "").toLowerCase();
      const loc = (lead.jobLocation || "").toLowerCase();
      const address = (lead.jobAddress || "").toLowerCase();
      const skills = (lead.skillsRequired || "").toLowerCase();
      const profile = (lead.contactProfile || "").toLowerCase();
      const type = (lead.jobType || "").toLowerCase();
      const urgency = (lead.fillUrgency || "").toLowerCase();
      const info = (lead.additionalInfo || "").toLowerCase();
      const source = (lead.source || "").toLowerCase();
      const status = (lead.status || "").toLowerCase();

      const matches = company.includes(query) ||
                      person.includes(query) ||
                      phone.includes(query) ||
                      email.includes(query) ||
                      title.includes(query) ||
                      loc.includes(query) ||
                      address.includes(query) ||
                      skills.includes(query) ||
                      profile.includes(query) ||
                      type.includes(query) ||
                      urgency.includes(query) ||
                      info.includes(query) ||
                      source.includes(query) ||
                      status.includes(query);
      if (!matches) return false;
    }

    // 2. Status Filter
    if (selectedStatus) {
      const leadStatus = (lead.status || "new").toLowerCase();
      if (selectedStatus === "new") {
        if (leadStatus !== "new" && leadStatus !== "inbound" && leadStatus !== "pending" && leadStatus !== "") return false;
      } else if (selectedStatus === "contacted") {
        if (!leadStatus.includes("contacted")) return false;
      } else if (selectedStatus === "in discussion") {
        if (!leadStatus.includes("discuss") && leadStatus !== "yet") return false;
      } else if (selectedStatus === "requirements finalized") {
        if (!leadStatus.includes("finalized") && !leadStatus.includes("requirement")) return false;
      } else if (selectedStatus === "hiring started") {
        if (!leadStatus.includes("hiring") && leadStatus !== "selected") return false;
      } else if (selectedStatus === "fulfilled") {
        if (!leadStatus.includes("fulfill") && !leadStatus.includes("closed") && leadStatus !== "joined") return false;
      } else if (selectedStatus === "dropped") {
        if (!leadStatus.includes("drop") && !leadStatus.includes("reject") && !leadStatus.includes("not")) return false;
      } else {
        if (!leadStatus.includes(selectedStatus)) return false;
      }
    }

    // 3. Urgency Filter
    if (selectedUrgency) {
      const leadUrgency = (lead.fillUrgency || "").toLowerCase().trim();
      if (leadUrgency !== selectedUrgency) return false;
    }

    // 4. Location Filter
    if (selectedLocation) {
      const leadLocation = (lead.jobLocation || "").toLowerCase().trim();
      if (leadLocation !== selectedLocation) return false;
    }

    // 5. Date Range Filter
    if (startMs || endMs) {
      const leadMs = getLeadTimestampMs(lead);
      if (leadMs) {
        if (startMs && leadMs < startMs) return false;
        if (endMs && leadMs > endMs) return false;
      } else if (startMs || endMs) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Re-renders the recruitment statistics metrics, recruiter inquiries table, and pagination controls.
 */
function updateRecruitmentUI() {
  const filtered = getFilteredRecruiterLeads();

  // 1. Count Badge
  const badgeEl = document.getElementById("recruitmentCountBadge");
  if (badgeEl) {
    if (filtered.length === allRecruiterLeads.length) {
      badgeEl.innerText = `${allRecruiterLeads.length} Leads`;
    } else {
      badgeEl.innerText = `${filtered.length} of ${allRecruiterLeads.length} Leads`;
    }
  }

  // 2. Render Table Rows (5 Columns: Date, Company, Contact Person, Number, Action)
  const tbody = document.getElementById("recruitmentTableBody");
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 48px 16px; color: var(--dark-grey);">
          <div style="font-size: 38px; margin-bottom: 8px; opacity: 0.6;"><i class="bx bxs-inbox"></i></div>
          <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 4px; color: var(--dark);">No Recruiter Leads Found</h4>
          <p style="font-size: 13px; color: var(--dark-grey); margin: 0;">Try adjusting your search query, status, urgency, location, or date range filters.</p>
        </td>
      </tr>
    `;
    renderRecruitmentPagination(0);
    return;
  }

  // Pagination slice
  const totalPages = Math.ceil(filtered.length / RECRUITMENT_PAGE_SIZE);
  if (recruitmentCurrentPage > totalPages) {
    recruitmentCurrentPage = Math.max(1, totalPages);
  }

  const startIdx = (recruitmentCurrentPage - 1) * RECRUITMENT_PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + RECRUITMENT_PAGE_SIZE);

  tbody.innerHTML = "";

  pageItems.forEach((lead) => {
    const tr = document.createElement("tr");

    // 1. Date
    const dateHtml = formatLeadDate(lead);

    // 2. Company
    const companyName = lead.companyName || "Unnamed Company";
    const initials = getCompanyInitials(companyName);
    const orgSize = lead.organizationSize ? escapeHtml(lead.organizationSize) : "";

    // 3. Contact Person
    const contactPerson = lead.contactPersonName || "Not Provided";
    const contactProfile = lead.contactProfile ? escapeHtml(lead.contactProfile) : "";

    // 4. Contact Number
    const rawPhone = lead.contactPhone || lead.phoneNumber || lead.phone || "";
    const cleanPhone = getCleanPhoneNumber(rawPhone);

    tr.innerHTML = `
      <td style="padding-left: 16px; white-space: nowrap;">${dateHtml}</td>
      <td>
        <div class="lead-company-cell">
          <div class="company-avatar">${initials}</div>
          <div class="company-name-wrap">
            <span class="company-name-title" title="${escapeHtml(companyName)}">${escapeHtml(companyName)}</span>
            ${orgSize ? `<span class="org-size-pill"><i class="bx bx-buildings"></i> ${orgSize}</span>` : ""}
          </div>
        </div>
      </td>
      <td>
        <div class="contact-person-cell">
          <span class="contact-name-title" title="${escapeHtml(contactPerson)}">${escapeHtml(contactPerson)}</span>
          ${contactProfile ? `<span class="contact-profile-pill"><i class="bx bx-id-card"></i> ${contactProfile}</span>` : ""}
        </div>
      </td>
      <td style="white-space: nowrap;">
        ${rawPhone ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="tel:${cleanPhone}" class="lead-contact-link phone" title="Click to call ${escapeHtml(String(rawPhone))}">
              <i class="bx bx-phone"></i> ${escapeHtml(String(rawPhone))}
            </a>
            <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${contactPerson !== 'Not Provided' ? contactPerson : ''}, thank you for reaching out to SourceOne regarding your inquiry for ${companyName}.`)}" target="_blank" rel="noopener noreferrer" class="lead-action-btn wa-btn" style="width: 28px; height: 28px; font-size: 14px;" title="Chat on WhatsApp">
              <i class="bx bxl-whatsapp"></i>
            </a>
          </div>
        ` : `<span style="color: var(--dark-grey); font-size: 12px; font-style: italic;">No Phone</span>`}
      </td>
      <td style="text-align: right; padding-right: 18px;">
        <div class="lead-actions-cell">
          <button type="button" class="lead-action-btn view-btn" title="View Full Details">
            <i class="bx bx-show"></i>
          </button>
          <button type="button" class="lead-action-btn delete-btn" title="Delete Inquiry">
            <i class="bx bxs-trash"></i>
          </button>
        </div>
      </td>
    `;

    // View Details click
    const viewBtn = tr.querySelector(".view-btn");
    if (viewBtn) {
      viewBtn.addEventListener("click", () => showLeadDetailsModal(lead));
    }

    // Delete Lead click
    const deleteBtn = tr.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => deleteLead(lead));
    }

    tbody.appendChild(tr);
  });

  // 4. Render Pagination Controls
  renderRecruitmentPagination(filtered.length);
}

/**
 * Updates a recruiter lead's status in Firebase RTDB /recruiter_leads/{leadId}.
 */
function updateLeadStatus(leadId, newStatus) {
  if (!leadId) return;

  db.ref(`recruiter_leads/${leadId}`).update({
    status: newStatus,
    statusUpdatedAt: Date.now(),
    updatedAt: Date.now()
  }).then(() => {
    const idx = allRecruiterLeads.findIndex((l) => l.id === leadId);
    if (idx !== -1) {
      allRecruiterLeads[idx].status = newStatus;
      allRecruiterLeads[idx].statusUpdatedAt = Date.now();
    }
  }).catch((err) => {
    alert("Failed to update status: " + err.message);
    updateRecruitmentUI();
  });
}

/**
 * Permanently removes a recruiter inquiry record from Firebase RTDB.
 */
function deleteLead(lead) {
  if (!lead || !lead.id) return;
  const company = lead.companyName || "this company";
  const role = lead.jobTitle || "opening";

  if (!confirm(`Are you sure you want to delete the hiring inquiry for "${company}" (${role})?`)) {
    return;
  }

  db.ref(`recruiter_leads/${lead.id}`).remove().then(() => {
    allRecruiterLeads = allRecruiterLeads.filter((l) => l.id !== lead.id);
    updateRecruitmentUI();
  }).catch((err) => {
    alert("Failed to delete lead: " + err.message);
  });
}

/**
 * Renders and displays the Lead Details modal with all 24 schema fields grouped into 5 structured visual cards.
 */
function showLeadDetailsModal(lead) {
  if (!lead) return;
  try {
    const modal = document.getElementById("recruitmentLeadModal");
    const modalTitle = document.getElementById("leadModalTitle");
    const modalBody = document.getElementById("leadModalBody");
    if (!modal || !modalBody) return;

  const company = lead.companyName || "Employer Inquiry";
  const role = lead.jobTitle ? ` – ${lead.jobTitle}` : "";
  if (modalTitle) modalTitle.innerText = `${company}${role}`;

  const rawPhone = lead.contactPhone || lead.phoneNumber || lead.phone || "";
  const cleanPhone = getCleanPhoneNumber(rawPhone);
  const contactPerson = lead.contactPersonName || "Not Provided";
  const jobTitle = lead.jobTitle || "Role Not Specified";

  // Parse skills into array tags
  let skillsHtml = "";
  if (lead.skillsRequired) {
    const skillsList = Array.isArray(lead.skillsRequired)
      ? lead.skillsRequired
      : String(lead.skillsRequired).split(/[,|\n]+/).map((s) => s.trim()).filter(Boolean);

    if (skillsList.length > 0) {
      skillsHtml = `
        <div class="lead-modal-skills-cloud">
          ${skillsList.map((skill) => `<span class="lead-modal-skill-pill">${escapeHtml(skill)}</span>`).join("")}
        </div>
      `;
    } else {
      skillsHtml = escapeHtml(String(lead.skillsRequired));
    }
  }

  // Check which keys are handled
  const handledKeys = new Set([
    "id", "key",
    "companyName", "organizationSize",
    "contactPersonName", "contactProfile", "contactPhone", "contactEmail", "candidateCallWindow",
    "jobTitle", "jobType", "numberOfOpenings", "fillUrgency", "hiringFrequency", "jobTimings",
    "monthlySalaryMin", "monthlySalaryMax", "bonusOffered",
    "jobLocation", "jobAddress",
    "candidateExperience", "skillsRequired", "additionalInfo", "source", "status", "timestamp",
    "statusUpdatedAt", "updatedAt", "createdAt"
  ]);

  // Collect any remaining custom unhandled fields
  const extraFields = [];
  Object.keys(lead).forEach((k) => {
    if (!handledKeys.has(k) && lead[k] !== undefined && lead[k] !== null && String(lead[k]).trim() !== "") {
      const formattedKey = k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (str) => str.toUpperCase());
      extraFields.push({ label: formattedKey, value: String(lead[k]) });
    }
  });

  const salaryDisplay = formatSalaryRange(lead.monthlySalaryMin, lead.monthlySalaryMax);
  const submissionDate = formatLeadDatePlain(lead);
  const statusLabel = getLeadStatusLabel(lead.status);
  const statusClass = getLeadStatusClass(lead.status);
  const currentStatus = String(lead.status || "new").trim();

  const formatSalaryVal = (val) => {
    if (val === undefined || val === null || String(val).trim() === "") return "N/A";
    const cleaned = String(val).replace(/,/g, "").trim();
    const num = parseInt(cleaned, 10);
    return !isNaN(num) ? `₹${num.toLocaleString("en-IN")}` : escapeHtml(String(val));
  };

  modalBody.innerHTML = `
    <div class="lead-modal-sections-grid">
      <!-- Section 1: Company & Contact Person Info -->
      <div class="lead-modal-card">
        <div class="lead-modal-card-header">
          <i class="bx bxs-business"></i>
          <h4>Company & Contact Person</h4>
        </div>
        <div class="lead-modal-fields-grid">
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Company Name</span>
            <span class="lead-modal-field-value" style="font-weight: 700; color: #2563eb;">${escapeHtml(lead.companyName || "N/A")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Organization Size</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.organizationSize || "Not Specified")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Contact Person</span>
            <span class="lead-modal-field-value" style="font-weight: 600;">${escapeHtml(contactPerson)}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Contact Profile / Role</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.contactProfile || "Not Specified")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Contact Phone</span>
            <span class="lead-modal-field-value">
              ${rawPhone ? `
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <a href="tel:${cleanPhone}" class="lead-contact-link phone">
                    <i class="bx bx-phone"></i> ${escapeHtml(String(rawPhone))}
                  </a>
                  <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${contactPerson !== 'Not Provided' ? contactPerson : ''}, thank you for contacting SourceOne regarding hiring for ${lead.companyName || 'your company'}.`)}" target="_blank" rel="noopener noreferrer" class="lead-contact-link phone" style="background: rgba(16, 185, 129, 0.12); color: #047857; border-color: rgba(16, 185, 129, 0.25);">
                    <i class="bx bxl-whatsapp"></i> WhatsApp
                  </a>
                </div>
              ` : `<span style="color: var(--dark-grey);">Not Provided</span>`}
            </span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Contact Email</span>
            <span class="lead-modal-field-value">
              ${lead.contactEmail ? `
                <a href="mailto:${escapeHtml(lead.contactEmail)}" class="lead-contact-link email" style="display: inline-flex;">
                  <i class="bx bx-envelope"></i> ${escapeHtml(lead.contactEmail)}
                </a>
              ` : `<span style="color: var(--dark-grey);">Not Provided</span>`}
            </span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Preferred Call Window</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.candidateCallWindow || "Anytime")}</span>
          </div>
        </div>
      </div>

      <!-- Section 2: Job & Hiring Requirements -->
      <div class="lead-modal-card">
        <div class="lead-modal-card-header">
          <i class="bx bxs-briefcase-alt-2"></i>
          <h4>Job & Hiring Requirements</h4>
        </div>
        <div class="lead-modal-fields-grid">
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Job Title / Designation</span>
            <span class="lead-modal-field-value" style="font-weight: 700;">${escapeHtml(jobTitle)}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Job Type</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.jobType || "Full-Time")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Number of Openings</span>
            <span class="lead-modal-field-value" style="font-weight: 700; color: #059669;">${escapeHtml(String(lead.numberOfOpenings || "1"))} Openings</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Fill Urgency</span>
            <span class="lead-modal-field-value">
              <span class="urgency-pill ${getUrgencyClass(lead.fillUrgency)}">
                <i class="bx bx-zap"></i> ${escapeHtml(lead.fillUrgency || "Normal")}
              </span>
            </span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Hiring Frequency</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.hiringFrequency || "One-Time Need")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Job / Shift Timings</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.jobTimings || "Standard Shifts")}</span>
          </div>
        </div>
      </div>

      <!-- Section 3: Compensation & Bonus -->
      <div class="lead-modal-card">
        <div class="lead-modal-card-header">
          <i class="bx bx-rupee"></i>
          <h4>Compensation & Incentives</h4>
        </div>
        <div class="lead-modal-fields-grid">
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Monthly Salary Range</span>
            <span class="lead-modal-field-value" style="font-weight: 700; color: #059669; font-size: 14.5px;">${salaryDisplay}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Min Salary</span>
            <span class="lead-modal-field-value">${formatSalaryVal(lead.monthlySalaryMin)}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Max Salary</span>
            <span class="lead-modal-field-value">${formatSalaryVal(lead.monthlySalaryMax)}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Bonus / Incentives Offered</span>
            <span class="lead-modal-field-value">
              ${lead.bonusOffered ? `
                <span class="bonus-offered-badge"><i class="bx bx-gift"></i> ${escapeHtml(lead.bonusOffered)}</span>
              ` : `<span style="color: var(--dark-grey);">None Specified</span>`}
            </span>
          </div>
        </div>
      </div>

      <!-- Section 4: Workplace Location & Address -->
      <div class="lead-modal-card">
        <div class="lead-modal-card-header">
          <i class="bx bxs-map-pin"></i>
          <h4>Workplace Location & Address</h4>
        </div>
        <div class="lead-modal-fields-grid">
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Job Location / Area</span>
            <span class="lead-modal-field-value" style="font-weight: 600;">
              <i class="bx bx-map-pin" style="color: #2563eb;"></i> ${escapeHtml(lead.jobLocation || "Not Specified")}
            </span>
          </div>
          <div class="lead-modal-field" style="grid-column: 1 / -1;">
            <span class="lead-modal-field-label">Full Workplace Address</span>
            <span class="lead-modal-field-value" style="line-height: 1.45;">${escapeHtml(lead.jobAddress || "Not Specified")}</span>
          </div>
        </div>
      </div>

      <!-- Section 5: Candidate Profile, Skills & System Meta -->
      <div class="lead-modal-card">
        <div class="lead-modal-card-header">
          <i class="bx bxs-user-detail"></i>
          <h4>Candidate Profile, Skills & Inquiry Info</h4>
        </div>
        <div class="lead-modal-fields-grid">
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Candidate Experience Needed</span>
            <span class="lead-modal-field-value" style="font-weight: 600;">${escapeHtml(lead.candidateExperience || "Fresher / Any Experience")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Inquiry Source</span>
            <span class="lead-modal-field-value">${escapeHtml(lead.source || "Direct Website / App")}</span>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Current Status</span>
            <div style="margin-top: 3px;">
              <select class="recruitment-status-select ${statusClass}" id="modalLeadStatusSelect" data-lead-id="${lead.id}" title="Change Lead Status">
                <option value="new" ${currentStatus.toLowerCase() === "new" || currentStatus.toLowerCase() === "inbound" || currentStatus.toLowerCase() === "pending" ? "selected" : ""}>New / Inbound</option>
                <option value="contacted" ${currentStatus.toLowerCase() === "contacted" ? "selected" : ""}>Contacted</option>
                <option value="in discussion" ${currentStatus.toLowerCase() === "in discussion" || currentStatus.toLowerCase() === "yet" || currentStatus.toLowerCase().includes("discuss") ? "selected" : ""}>In Discussion</option>
                <option value="requirements finalized" ${currentStatus.toLowerCase() === "requirements finalized" || currentStatus.toLowerCase().includes("finalized") ? "selected" : ""}>Reqs Finalized</option>
                <option value="hiring started" ${currentStatus.toLowerCase() === "hiring started" || currentStatus.toLowerCase() === "selected" || currentStatus.toLowerCase().includes("hiring") ? "selected" : ""}>Hiring Started</option>
                <option value="fulfilled" ${currentStatus.toLowerCase() === "fulfilled" || currentStatus.toLowerCase() === "joined" || currentStatus.toLowerCase().includes("fulfill") ? "selected" : ""}>Fulfilled</option>
                <option value="dropped" ${currentStatus.toLowerCase() === "dropped" || currentStatus.toLowerCase() === "rejected" || currentStatus.toLowerCase().includes("drop") ? "selected" : ""}>Dropped</option>
              </select>
            </div>
          </div>
          <div class="lead-modal-field">
            <span class="lead-modal-field-label">Submission Date & Time</span>
            <span class="lead-modal-field-value">${escapeHtml(submissionDate)}</span>
          </div>
          <div class="lead-modal-field" style="grid-column: 1 / -1;">
            <span class="lead-modal-field-label">Skills Required</span>
            <span class="lead-modal-field-value">${skillsHtml || `<span style="color: var(--dark-grey);">No specific skills listed</span>`}</span>
          </div>
          ${lead.additionalInfo ? `
            <div class="lead-modal-field" style="grid-column: 1 / -1;">
              <span class="lead-modal-field-label">Additional Instructions / Notes</span>
              <div class="lead-modal-note-box">${escapeHtml(lead.additionalInfo)}</div>
            </div>
          ` : ""}
        </div>
      </div>

      ${extraFields.length > 0 ? `
        <!-- Extra Dynamic Attributes -->
        <div class="lead-modal-card">
          <div class="lead-modal-card-header">
            <i class="bx bx-list-plus"></i>
            <h4>Additional Inbound Attributes</h4>
          </div>
          <div class="lead-modal-fields-grid">
            ${extraFields.map((field) => `
              <div class="lead-modal-field">
                <span class="lead-modal-field-label">${escapeHtml(field.label)}</span>
                <span class="lead-modal-field-value">${escapeHtml(field.value)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;

  // Attach status change listener inside modal
  const modalStatusSelect = modalBody.querySelector("#modalLeadStatusSelect");
  if (modalStatusSelect) {
    modalStatusSelect.addEventListener("change", (e) => {
      const newStatus = e.target.value;
      modalStatusSelect.className = `recruitment-status-select ${getLeadStatusClass(newStatus)}`;
      updateLeadStatus(lead.id, newStatus);
    });
  }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (err) {
    console.error("Error opening recruitment lead details modal:", err);
    alert("Unable to open lead details: " + err.message);
  }
}

/**
 * Renders pagination buttons and page counter for recruitment leads.
 */
function renderRecruitmentPagination(totalItems) {
  const paginationContainer = document.getElementById("recruitmentPagination");
  const pageInfoContainer = document.getElementById("recruitmentPageInfo");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  if (totalItems === 0) {
    if (pageInfoContainer) pageInfoContainer.textContent = "0 leads found";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / RECRUITMENT_PAGE_SIZE));

  if (recruitmentCurrentPage > totalPages) {
    recruitmentCurrentPage = totalPages;
  }
  if (recruitmentCurrentPage < 1) {
    recruitmentCurrentPage = 1;
  }

  const startIdx = (recruitmentCurrentPage - 1) * RECRUITMENT_PAGE_SIZE + 1;
  const endIdx = Math.min(startIdx + RECRUITMENT_PAGE_SIZE - 1, totalItems);
  if (pageInfoContainer) {
    pageInfoContainer.textContent = `Showing ${startIdx}–${endIdx} of ${totalItems} leads`;
  }

  // Previous Page Button
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "nav-btn";
  prevBtn.innerHTML = "<i class='bx bx-chevron-left'></i> Prev";
  prevBtn.disabled = recruitmentCurrentPage <= 1;
  prevBtn.addEventListener("click", () => {
    if (recruitmentCurrentPage > 1) {
      recruitmentCurrentPage--;
      updateRecruitmentUI();
    }
  });
  paginationContainer.appendChild(prevBtn);

  // Numbered Page Buttons
  const maxButtons = 5;
  let startPage = Math.max(1, recruitmentCurrentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.type = "button";
    firstBtn.textContent = "1";
    firstBtn.addEventListener("click", () => {
      recruitmentCurrentPage = 1;
      updateRecruitmentUI();
    });
    paginationContainer.appendChild(firstBtn);

    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.className = "dots";
      dots.textContent = "...";
      paginationContainer.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.type = "button";
    pageBtn.textContent = i;
    if (i === recruitmentCurrentPage) {
      pageBtn.classList.add("active");
    }
    pageBtn.addEventListener("click", () => {
      recruitmentCurrentPage = i;
      updateRecruitmentUI();
    });
    paginationContainer.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.className = "dots";
      dots.textContent = "...";
      paginationContainer.appendChild(dots);
    }

    const lastBtn = document.createElement("button");
    lastBtn.type = "button";
    lastBtn.textContent = totalPages;
    lastBtn.addEventListener("click", () => {
      recruitmentCurrentPage = totalPages;
      updateRecruitmentUI();
    });
    paginationContainer.appendChild(lastBtn);
  }

  // Next Page Button
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "nav-btn";
  nextBtn.innerHTML = "Next <i class='bx bx-chevron-right'></i>";
  nextBtn.disabled = recruitmentCurrentPage >= totalPages;
  nextBtn.addEventListener("click", () => {
    if (recruitmentCurrentPage < totalPages) {
      recruitmentCurrentPage++;
      updateRecruitmentUI();
    }
  });
  paginationContainer.appendChild(nextBtn);
}

/**
 * Exports all currently filtered recruiter inquiries to an Excel workbook using SheetJS.
 * Maps all 24 schema fields with clean, readable English column headers.
 */
function exportRecruitmentToExcel() {
  if (typeof XLSX === "undefined") {
    alert("SheetJS library is not loaded. Please verify internet connection.");
    return;
  }

  const filtered = getFilteredRecruiterLeads();
  if (filtered.length === 0) {
    alert("No recruitment leads match your current filter criteria.");
    return;
  }

  const exportRows = filtered.map((lead, idx) => {
    const rawDate = getLeadTimestampMs(lead);
    const dateStr = rawDate ? new Date(rawDate).toLocaleString("en-IN") : (lead.date || lead.time || lead.timestamp || "N/A");

    const row = {
      "S.No": idx + 1,
      "Submission Date": dateStr,
      "Company Name": lead.companyName || "",
      "Organization Size": lead.organizationSize || "",
      "Contact Person Name": lead.contactPersonName || "",
      "Contact Profile / Role": lead.contactProfile || "",
      "Contact Phone": lead.contactPhone || lead.phoneNumber || "",
      "Contact Email": lead.contactEmail || "",
      "Candidate Call Window": lead.candidateCallWindow || "",
      "Job Title": lead.jobTitle || "",
      "Job Type": lead.jobType || "",
      "Number of Openings": lead.numberOfOpenings || "1",
      "Fill Urgency": lead.fillUrgency || "",
      "Hiring Frequency": lead.hiringFrequency || "",
      "Job Timings": lead.jobTimings || "",
      "Monthly Salary Min (₹)": lead.monthlySalaryMin !== undefined && lead.monthlySalaryMin !== null ? String(lead.monthlySalaryMin) : "",
      "Monthly Salary Max (₹)": lead.monthlySalaryMax !== undefined && lead.monthlySalaryMax !== null ? String(lead.monthlySalaryMax) : "",
      "Bonus Offered": lead.bonusOffered || "",
      "Job Location": lead.jobLocation || "",
      "Job Address": lead.jobAddress || "",
      "Candidate Experience": lead.candidateExperience || "",
      "Skills Required": Array.isArray(lead.skillsRequired) ? lead.skillsRequired.join(", ") : (lead.skillsRequired || ""),
      "Additional Info": lead.additionalInfo || "",
      "Source": lead.source || "Website",
      "Status": getLeadStatusLabel(lead.status)
    };

    // Include other dynamic attributes if present
    const standardKeys = new Set([
      "id", "key",
      "companyName", "organizationSize",
      "contactPersonName", "contactProfile", "contactPhone", "phoneNumber", "phone", "contactEmail", "candidateCallWindow",
      "jobTitle", "jobType", "numberOfOpenings", "fillUrgency", "hiringFrequency", "jobTimings",
      "monthlySalaryMin", "monthlySalaryMax", "bonusOffered",
      "jobLocation", "jobAddress",
      "candidateExperience", "skillsRequired", "additionalInfo", "source", "status",
      "timestamp", "createdAt", "submittedAt", "date", "time", "updatedAt", "statusUpdatedAt"
    ]);

    Object.keys(lead).forEach((k) => {
      if (!standardKeys.has(k) && lead[k] !== undefined && lead[k] !== null) {
        row[k] = String(lead[k]);
      }
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Recruiter Leads");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `recruiter_leads_${todayStr}.xlsx`);
}
