// chatbot.js
let enterBtn = document.querySelector("#enter");
let message = document.querySelector("#message");
let userForm = document.querySelector("#userinput");
let clearChatBtn = document.querySelector("#clearChat");
let chatBox = document.querySelector(".chatbox");
let chatScreen = document.querySelector(".chatbot-chatscreen");

// Initialize chat history (empty array - critical fix)
let chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];

// Initialize chat with history or default message
function initializeChat() {
    if (chatHistory.length === 0) {
        // Show initial bot message without storing in history
        chatBox.innerHTML = `
            <li class="chat-incoming">
                <span class="material-symbols-outlined">smart_toy</span>
                <p>Hello! I'm here to help answer your questions about public awareness. What would you like to know?</p>
            </li>`;
    } else {
        // Load from existing history
        chatBox.innerHTML = chatHistory.map(msg => {
            return msg.role === "user" ? `
                <li class="chat-outgoing">
                    <p>${msg.content}</p>
                    <span class="material-symbols-outlined">person</span>
                </li>` : `
                <li class="chat-incoming">
                    <span class="material-symbols-outlined">smart_toy</span>
                    <p>${msg.content}</p>
                </li>`;
        }).join("");
    }
    chatScreen.scrollTop = chatScreen.scrollHeight;
}

// Initialize chat on page load
initializeChat();

// Modified messageEnter function with history fix
let messageEnter = async (event) => {
    event.preventDefault();
    let userMessage = message.value.trim();
    if (userMessage === "") return;

    // Add USER message to history and UI
    chatHistory.push({ role: "user", content: userMessage });
    sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));

    // Add USER message to chat
    let outGoingMsg = document.createElement("li");
    outGoingMsg.classList.add("chat-outgoing");
    outGoingMsg.innerHTML = `
        <p>${userMessage}</p>
        <span class="material-symbols-outlined">person</span>`;
    chatBox.appendChild(outGoingMsg);
    message.value = "";
    chatScreen.scrollTop = chatScreen.scrollHeight;

    // Add LOADING ANIMATION
    let loadingMsg = document.createElement("li");
    loadingMsg.classList.add("chat-loading");
    loadingMsg.innerHTML = `
        <span class="material-symbols-outlined">smart_toy</span>
        <div class="loading-dots">
            <div></div>
            <div></div>
            <div></div>
        </div>`;
    chatBox.appendChild(loadingMsg);
    chatScreen.scrollTop = chatScreen.scrollHeight;

    try {
        // Get AI response with history
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMessage,
                history: chatHistory.filter(msg => msg.role !== "bot") // Critical fix
            })
        });
        
        const data = await response.json();
        
        // Remove loading animation
        chatBox.removeChild(loadingMsg);
        
        // Add BOT response to history and UI
        chatHistory.push({ role: "bot", content: data.reply });
        sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        let incomingMsg = document.createElement("li");
        incomingMsg.classList.add("chat-incoming");
        incomingMsg.innerHTML = `
            <span class="material-symbols-outlined">smart_toy</span>
            <p>${data.reply}</p>`;
        chatBox.appendChild(incomingMsg);

    } catch (error) {
        // Remove loading animation on error
        chatBox.removeChild(loadingMsg);
        
        let incomingMsg = document.createElement("li");
        incomingMsg.classList.add("chat-incoming");
        incomingMsg.innerHTML = `
            <span class="material-symbols-outlined">smart_toy</span>
            <p>I'm having trouble connecting. Please try again later.</p>`;
        chatBox.appendChild(incomingMsg);
    }

    chatScreen.scrollTop = chatScreen.scrollHeight;
};

// Modified clear chat function
let clearChat = () => {
    // Completely reset history
    chatHistory = [];
    sessionStorage.removeItem('chatHistory');
    
    // Reset UI with initial message
    chatBox.innerHTML = `
        <li class="chat-incoming">
            <span class="material-symbols-outlined">smart_toy</span>
            <p>Hello! I'm here to help answer your questions about public awareness. What would you like to know?</p>
        </li>`;
};

// Event listeners
message.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        messageEnter(event);
    }
});

clearChatBtn.addEventListener("click", clearChat);
enterBtn.addEventListener("click", messageEnter);
userForm.addEventListener("submit", messageEnter);