// chatbot.js
let enterBtn = document.querySelector("#enter");
let message = document.querySelector("#message");
let userForm = document.querySelector("#userinput");
let clearChatBtn = document.querySelector("#clearChat");
let chatBox = document.querySelector(".chatbox");
let chatScreen = document.querySelector(".chatbot-chatscreen");

// Modified messageEnter function with AI integration
let messageEnter = async (event) => {
    event.preventDefault();
    let userMessage = message.value.trim();
    if (userMessage === "") return;

    // Add USER message to chat (existing functionality)
    let outGoingMsg = document.createElement("li");
    outGoingMsg.classList.add("chat-outgoing");
    outGoingMsg.innerHTML = `
        <p>${userMessage}</p>
        <span class="material-symbols-outlined">person</span>`;
    chatBox.appendChild(outGoingMsg);
    message.value = "";
    chatScreen.scrollTop = chatScreen.scrollHeight;

    // Get AI RESPONSE (new functionality)
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });
        
        const data = await response.json();
        
        // Add BOT response (modified to use real AI response)
        let incomingMsg = document.createElement("li");
        incomingMsg.classList.add("chat-incoming");
        incomingMsg.innerHTML = `
            <span class="material-symbols-outlined">smart_toy</span>
            <p>${data.reply}</p>`;
        chatBox.appendChild(incomingMsg);

    } catch (error) {
        // Fallback to original dummy response if API fails
        let incomingMsg = document.createElement("li");
        incomingMsg.classList.add("chat-incoming");
        incomingMsg.innerHTML = `
            <span class="material-symbols-outlined">smart_toy</span>
            <p>I'm having trouble connecting. Please try again later.</p>`;
        chatBox.appendChild(incomingMsg);
    }

    chatScreen.scrollTop = chatScreen.scrollHeight;
};

// Clear chat function (existing functionality - fixed syntax)
let clearChat = () => {
    chatBox.innerHTML = `
        <li class="chat-incoming">
            <span class="material-symbols-outlined">smart_toy</span>
            <p>Hello! I'm here to help answer your questions about public awareness. What would you like to know?</p>
        </li>`;
};

// Event listeners (existing functionality)
message.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        messageEnter(event);
    }
});

clearChatBtn.addEventListener("click", clearChat);
enterBtn.addEventListener("click", messageEnter);
userForm.addEventListener("submit", messageEnter);

