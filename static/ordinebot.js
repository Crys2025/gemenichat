console.log("GemeniBot JS loaded");

let openedAutomatically = false;
let pgConversation = [];

// deschide/închide fereastra
function toggleChat() {
    const chat = document.getElementById('ai-chat-box');
    if (!chat) return;
    chat.style.display = (chat.style.display === 'block') ? 'none' : 'block';
}

// scroll la ultimul mesaj
function scrollMessages() {
    const box = document.getElementById('ai-chat-messages');
    if (!box) return;
    box.scrollTop = box.scrollHeight;
}

// salvăm conversația (HTML) în sessionStorage
function saveChat() {
    const box = document.getElementById("ai-chat-messages");
    if (!box) return;
    sessionStorage.setItem("ordineChatHistory", box.innerHTML);
}

// adaugă mesaj de la user
function addUserMessage(msg) {
    const box = document.getElementById('ai-chat-messages');
    if (!box) return;
    box.innerHTML += `<div class="user-msg">${msg}</div>`;
    pgConversation.push({ role: "user", content: msg });
    scrollMessages();
    saveChat();
}

// adaugă mesaj de la bot (permite HTML – linkuri etc.)
function addBotMessage(msg) {
    const box = document.getElementById('ai-chat-messages');
    if (!box) return;
    box.innerHTML += `<div class="bot-msg">${msg}</div>`;
    pgConversation.push({ role: "assistant", content: msg });
    scrollMessages();
    saveChat();
}

// trimite mesajul la backend
async function sendMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;

    const msg = input.value.trim();
    if (!msg) return;

    addUserMessage(msg);
    input.value = "";

    // mesaj temporar "Scriu răspunsul..."
    addBotMessage("Scriu răspunsul...");

    try {
        const response = await fetch("https://gemenichat.onrender.com/ask", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ messages: pgConversation })
        });

        const data = await response.json();

        // ștergem "Scriu răspunsul..."
        const temp = document.querySelector(".bot-msg:last-child");
        if (temp) temp.remove();

        addBotMessage(data.answer);

    } catch (err) {
        const temp = document.querySelector(".bot-msg:last-child");
        if (temp) temp.remove();

        addBotMessage("❌ Serverul nu răspunde. Mai încearcă puțin.");
    }
}

// inițializare la încărcarea paginii
document.addEventListener("DOMContentLoaded", () => {
    const messagesBox = document.getElementById("ai-chat-messages");
    const bubble = document.getElementById("ai-bot-bubble");
    const input = document.getElementById("ai-chat-input");

    // 🔥 Restaurăm conversația salvată și reconstruim memoria
    const saved = sessionStorage.getItem("ordineChatHistory");
    if (saved && messagesBox) {
        messagesBox.innerHTML = saved;

        const nodes = messagesBox.querySelectorAll(".user-msg, .bot-msg");
        nodes.forEach(el => {
            const role = el.classList.contains("user-msg") ? "user" : "assistant";
            const content = el.textContent;
            pgConversation.push({ role, content });
        });

        scrollMessages();
    }

    if (bubble) {
        bubble.onclick = toggleChat;
    }

    if (input) {
        input.addEventListener("keydown", ev => {
            if (ev.key === "Enter") sendMessage();
        });
    }
});



