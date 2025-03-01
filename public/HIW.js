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