
let enterBtn = document.querySelector("#enter");
let message = document.querySelector("#message");
let userForm = document.querySelector("#userinput");
let clearChatBtn = document.querySelector("#clearChat");
let chatBox = document.querySelector(".chatbox");
let chatScreen = document.querySelector(".chatbot-chatscreen");


let chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];


function initializeChat() {
    if (chatHistory.length === 0) {
        chatBox.innerHTML = `
            <li class="chat-incoming">
                <span class="material-symbols-outlined">smart_toy</span>
                <p>Hello! I'm here to help answer your questions about public awareness. What would you like to know?</p>
            </li>`;
    } else {
        
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


initializeChat();


let messageEnter = async (event) => {
    event.preventDefault();
    let userMessage = message.value.trim();
    if (userMessage === "") return;

    
    chatHistory.push({ role: "user", content: userMessage });
    sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));


    let outGoingMsg = document.createElement("li");
    outGoingMsg.classList.add("chat-outgoing");
    outGoingMsg.innerHTML = `
        <p>${userMessage}</p>
        <span class="material-symbols-outlined">person</span>`;
    chatBox.appendChild(outGoingMsg);
    message.value = "";
    chatScreen.scrollTop = chatScreen.scrollHeight;

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
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMessage,
                history: chatHistory.filter(msg => msg.role !== "bot")
            })
        });
        
        const data = await response.json();
        
        chatBox.removeChild(loadingMsg);
        
        chatHistory.push({ role: "bot", content: data.reply });
        sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        let incomingMsg = document.createElement("li");
        incomingMsg.classList.add("chat-incoming");
        incomingMsg.innerHTML = `
            <span class="material-symbols-outlined">smart_toy</span>
            <p>${data.reply}</p>`;
        chatBox.appendChild(incomingMsg);

    } catch (error) {
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

let clearChat = () => {
    chatHistory = [];
    sessionStorage.removeItem('chatHistory');
    
    chatBox.innerHTML = `
        <li class="chat-incoming">
            <span class="material-symbols-outlined">smart_toy</span>
            <p>Hello! I'm here to help answer your questions about public awareness. What would you like to know?</p>
        </li>`;
};


message.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        messageEnter(event);
    }
});

clearChatBtn.addEventListener("click", clearChat);
enterBtn.addEventListener("click", messageEnter);
userForm.addEventListener("submit", messageEnter);