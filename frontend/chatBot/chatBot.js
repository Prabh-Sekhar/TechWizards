let enterBtn = document.querySelector("#enter");
let chatOutgoing = document.querySelector(".chat-outgoing");
let message = document.querySelector("#message");
let incomingChat = document.querySelector("#usertext");
let userForm = document.querySelector("#userinput");

let messageEnter = (event) => {
    event.preventDefault();
    if (message.value.trim() === "") return;

    chatOutgoing.style.display = "flex";
    incomingChat.innerText = message.value;
    message.value = "";
};

message.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        messageEnter(event);
    }
});

enterBtn.addEventListener("click", messageEnter);
userForm.addEventListener("submit", messageEnter);





