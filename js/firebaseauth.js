// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
  authDomain: "login-9338e.firebaseapp.com",
  projectId: "login-9338e",
  storageBucket: "login-9338e.firebasestorage.app",
  messagingSenderId: "649880075591",
  appId: "1:649880075591:web:a5cd336a03d80e9b656062",
  measurementId: "G-GT8TRDM62Y",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

function showMessage(message, divId) {
  var messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function () {
    messageDiv.style.opacity = 0;
  }, 5000);
}
const signUp = document.getElementById("submitSignUp");
signUp.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("rEmail").value;
  const password = document.getElementById("rPassword").value;
  const firstName = document.getElementById("fName").value;
  const lastName = document.getElementById("lName").value;

  const auth = getAuth();
  const db = getFirestore();

  const originalText = signUp.innerHTML;
  signUp.innerHTML = '<div class="loader"></div>';
  signUp.disabled = true;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
      };
      // showMessage("Account Created Successfully", "signUpMessage");
      // const docRef = doc(db, "users", user.uid);
      // setDoc(docRef, userData)
      //   .then(() => {
      //     window.location.href = "dashboard.html";
      //   })
      const docRef = doc(db, "users", user.uid);
      setDoc(docRef, { ...userData, permission: false }) // set permission to false by default
        .then(() => {
          showMessage("User created. Wait for admin to give login access.", "signUpMessage");
          signUp.innerHTML = originalText;
          signUp.disabled = false;
        })
        .catch((error) => {
          console.error("error writing document", error);
          signUp.innerHTML = originalText;
          signUp.disabled = false;
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode == "auth/email-already-in-use") {
        showMessage("Email Address Already Exists !!!", "signUpMessage");
      } else {
        showMessage("unable to create User", "signUpMessage");
      }
      signUp.innerHTML = originalText;
      signUp.disabled = false;
    });
});

const signIn = document.getElementById("submitSignIn");
signIn.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const auth = getAuth();

  const originalText = signIn.innerHTML;
  signIn.innerHTML = '<div class="loader"></div>';
  signIn.disabled = true;

  // signInWithEmailAndPassword(auth, email, password)
  //   .then((userCredential) => {
  //     showMessage("login is successful", "signInMessage");
  //     const user = userCredential.user;
  //     localStorage.setItem("loggedInUserId", user.uid);
  //     window.location.href = "dashboard.html";
  //   })
  //   .catch((error) => {
  //     const errorCode = error.code;
  //     if (errorCode === "auth/invalid-credential") {
  //       showMessage("Incorrect Email or Password", "signInMessage");
  //     } else {
  //       showMessage("Account does not Exist", "signInMessage");
  //     }
  //   });
  signInWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;
    const db = getFirestore();

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      showMessage("Account data not found. Contact admin.", "signInMessage");
      signIn.innerHTML = originalText;
      signIn.disabled = false;
      return;
    }

    const userData = docSnap.data();
    if (!userData.permission) {
      showMessage("Permission not yet given. Please contact admin.", "signInMessage");
      signIn.innerHTML = originalText;
      signIn.disabled = false;
      return;
    }

    localStorage.setItem("loggedInUserId", user.uid);
    window.location.href = "dashboard.html";
  })
  .catch((error) => {
    console.error("SignIn error:", error);
    const errorCode = error.code;
    if (errorCode === "auth/invalid-credential") {
      showMessage("Incorrect Email or Password", "signInMessage");
    } else if (errorCode === "auth/too-many-requests") {
      showMessage("Too many failed attempts. Please try again later.", "signInMessage");
    } else if (errorCode) {
      showMessage("Error: " + errorCode, "signInMessage");
    } else {
      showMessage("Error: " + error.message, "signInMessage");
    }
    signIn.innerHTML = originalText;
    signIn.disabled = false;
  });

});

//Password recovery

const recoverLink = document.getElementById("recoverPasswordLink");

recoverLink.addEventListener("click", (event) => {
  event.preventDefault();

  const email = prompt("Enter your email to recover your password:");

  if (!email) {
    showMessage("You must enter an email address.", "signInMessage");
    return;
  }

  const auth = getAuth();

  // Try to send reset email
  sendPasswordResetEmail(auth, email)
    .then(() => {
      showMessage(
        "Password reset email sent to your registered email address. Please check your inbox.",
        "signInMessage"
      );
    })
    .catch((error) => {
      if (error.code === "auth/user-not-found") {
        showMessage(
          "No account found with this email. Please check and try again.",
          "signInMessage"
        );
      } else if (error.code === "auth/invalid-email") {
        showMessage("Invalid email address format.", "signInMessage");
      } else {
        showMessage(
          "Something went wrong. Please try again later.",
          "signInMessage"
        );
      }
    });
});
