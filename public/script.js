const openPopUp = document.getElementById("openPopUp");
const popupBox = document.getElementById("popupBox");
const closePopup = document.querySelector(".close");

openPopUp.addEventListener("click", () => {
    popupBox.style.display = "flex";
});

closePopup.addEventListener("click", () => {
    popupBox.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === popupBox) {
        popupBox.style.display = "none";
    }
});

// Sign in with Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((result) => {
        // Success: User is signed in
      })
      .catch((error) => {
        console.error("Error signing in:", error.message);
      });
  }
  
  // Sign out
  function signOut() {
    auth.signOut()
      .then(() => {
        // Success: User is signed out
      })
      .catch((error) => {
        console.error("Error signing out:", error.message);
      });
  }
  
  // Track authentication state
  auth.onAuthStateChanged((user) => {
    const signInBtn = document.getElementById("signInBtn");
    const signOutBtn = document.getElementById("signOutBtn");
    const userInfo = document.getElementById("userInfo");
  
    if (user) {
      // User is logged in
      signInBtn.style.display = "none";
      signOutBtn.style.display = "block";
      userInfo.style.display = "block";
      document.getElementById("userName").textContent = user.displayName;
      document.getElementById("userEmail").textContent = user.email;
    } else {
      // User is logged out
      signInBtn.style.display = "block";
      signOutBtn.style.display = "none";
      userInfo.style.display = "none";
    }
  });