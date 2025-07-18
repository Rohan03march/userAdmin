const allSideMenu = document.querySelectorAll("#sidebar .side-menu.top li a");

allSideMenu.forEach((item) => {
  const li = item.parentElement;

  item.addEventListener("click", function () {
    allSideMenu.forEach((i) => {
      i.parentElement.classList.remove("active");
    });
    li.classList.add("active");
  });
});

// TOGGLE SIDEBAR
const menuBar = document.querySelector("#content nav .bx.bx-menu");
const sidebar = document.getElementById("sidebar");

menuBar.addEventListener("click", function () {
  sidebar.classList.toggle("hide");
});

const searchButton = document.querySelector(
  "#content nav form .form-input button"
);
const searchButtonIcon = document.querySelector(
  "#content nav form .form-input button .bx"
);
const searchForm = document.querySelector("#content nav form");

searchButton.addEventListener("click", function (e) {
  if (window.innerWidth < 576) {
    e.preventDefault();
    searchForm.classList.toggle("show");
    if (searchForm.classList.contains("show")) {
      searchButtonIcon.classList.replace("bx-search", "bx-x");
    } else {
      searchButtonIcon.classList.replace("bx-x", "bx-search");
    }
  }
});

if (window.innerWidth < 768) {
  sidebar.classList.add("hide");
} else if (window.innerWidth > 576) {
  searchButtonIcon.classList.replace("bx-x", "bx-search");
  searchForm.classList.remove("show");
}

window.addEventListener("resize", function () {
  if (this.innerWidth > 576) {
    searchButtonIcon.classList.replace("bx-x", "bx-search");
    searchForm.classList.remove("show");
  }
});

const switchMode = document.getElementById("switch-mode");

switchMode.addEventListener("change", function () {
  if (this.checked) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
});

// 🌟 Firebase config
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

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Searching and Deleting
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", () => {
    searchUsers(searchInput.value).then((users) => {
      renderTable(users);
    });
  });

  // Load initial table
  searchUsers("").then((users) => {
    renderTable(users);
  });
});

async function searchUsers(query) {
  query = query.trim().toLowerCase();

  const snapshot = await db.ref("registrations").get();
  if (!snapshot.exists()) return [];

  const allUsers = Object.entries(snapshot.val()).map(([id, user]) => ({
    id,
    ...user,
  }));

  if (!query) return allUsers;

  return allUsers.filter((user) => {
    const name = (user.nameAsPerAadhaar || "").toLowerCase();
    const contact = (user.contactNumber || "").toLowerCase();
    const location = (user.workingLocation || "").toLowerCase();
    return (
      name.includes(query) ||
      contact.includes(query) ||
      location.includes(query)
    );
  });
}

function renderTable(users) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No users found.</td></tr>`;
    return;
  }

  users.forEach((user) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <a href="user.html?id=${encodeURIComponent(
          user.id
        )}" style="text-decoration:none; color:inherit;">
          <img src="${user.photo || ""}" alt="${
      user.nameAsPerAadhaar || "User"
    }"
             style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:10px;vertical-align:middle;">
          <span style="vertical-align:middle;">${
            user.nameAsPerAadhaar || "Unknown"
          }</span>
        </a>
      </td>
      <td>${user.contactNumber || "Null"}</td>
      <td>${user.workingLocation || "Null"}</td>
      <td>${user.submittedAt || "N/A"}</td>
      <td>
        <button class="delete-btn" data-id="${user.id}" style="
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        ">Delete</button>
      </td>
    `;

    const deleteBtn = tr.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        confirm(
          `Are you sure you want to delete ${
            user.nameAsPerAadhaar || "this user"
          }?`
        )
      ) {
        try {
          await db.ref(`registrations/${user.id}`).remove();
          alert("✅ User deleted successfully");

          // 🔄 Refresh the list properly
          const query = document.getElementById("searchInput").value.trim();
          const updatedUsers = await searchUsers(query);
          renderTable(updatedUsers);
        } catch (err) {
          alert("❌ Error deleting user: " + err.message);
        }
      }
    });

    tbody.appendChild(tr);
  });
}
