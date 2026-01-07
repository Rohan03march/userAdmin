/* ===============================
   SIDEBAR & UI LOGIC
================================ */

const allSideMenu = document.querySelectorAll("#sidebar .side-menu.top li a");

allSideMenu.forEach((item) => {
  const li = item.parentElement;
  item.addEventListener("click", () => {
    allSideMenu.forEach((i) => i.parentElement.classList.remove("active"));
    li.classList.add("active");
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

function updateUI() {
  const query = document.getElementById("searchInput").value.trim();

  // clone array to avoid mutation bugs
  const filtered = query ? filterUsers(query) : [...allUsers];

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
});

document.getElementById("searchInput").addEventListener("input", () => {
  currentPage = 1;
  updateUI();
});
