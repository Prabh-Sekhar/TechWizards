let enterBtn = document.querySelector("#enter");
let chatOutgoing = document.querySelector(".chat-outgoing");
let message = document.querySelector("#message");
let userForm = document.querySelector("#userinput");
let clearChatBtn = document.querySelector("#clearChat");
let chatBox = document.querySelector(".chatbox");
let chatScreen = document.querySelector(".chatbot-chatscreen");

let messageEnter = (event) => {
    event.preventDefault();
    let userMessage = message.value.trim();
    if (userMessage === "") return;


    let outGoingMsg = document.createElement("li");
    outGoingMsg.classList.add("chat-outgoing");
    outGoingMsg.innerHTML = `
    <p>${userMessage}</p>
    <span class="material-symbols-outlined">person</span>`;
    chatBox.appendChild(outGoingMsg);

    message.value = "";

    chatScreen.scrollTop = chatScreen.scrollHeight;
    
    let incomingMsg = document.createElement("li");
    incomingMsg.classList.add("chat-incoming");
    incomingMsg.innerHTML = `
    <span class="material-symbols-outlined">smart_toy</span>
    <p>I'm just a bot! You said: "${userMessage}"</p>
    `;
    chatBox.appendChild(incomingMsg);

    chatScreen.scrollTop = chatScreen.scrollHeight;

    message.value = "";
}

let clearChat = () => {
    chatBox.innerHTML = `
    <li class="chat-incoming">
    <span class="material-symbols-outlined">smart_toy</span>
    <p>Hello! I'm here to help answer your questions about public awareness. What would you like to know?</p>
    </li>`;
}

message.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        messageEnter(event);
    }
});

clearChatBtn.addEventListener("click", clearChat);
enterBtn.addEventListener("click", messageEnter);
userForm.addEventListener("submit", messageEnter);





