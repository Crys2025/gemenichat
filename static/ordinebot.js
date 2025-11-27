console.log("GemeniBot JS loaded");

let openedAutomatically = false;
let pgConversation = [];

/* ======================================================
   FUNCTIE LINKIFY - transforma linkurile in <a>
====================================================== */
function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => {
        return `<a href="${url}" target="_blank" class="ai-link">${url}</a>`;
    });
}

/* ======================================================
   DESCHIDE / INCHIDE FEREASTRA
====================================================== */
function toggleChat() {
    const chat = document.getElementById('ai-chat-box');
    if (!chat) return;

    chat.style.display = (chat.style.display === 'block') ? 'none' : 'block';
    scrollMessages();
}

/* ======================================================
   SCROLL
====================================================== */
function scrollMessages() {
    const box = document.getElementById('ai-chat-messages');
    if (!box) return;
    box.scrollTop = box.scrollHeight;
}

/* ======================================================
   SALVARE CONVERSATIE
====================================================== */
function saveChat() {
    const box = document.getElementById("ai-chat-messages");
    if (!box) return;
    sessionStorage.setItem("GemeniBotHistory", box.innerHTML);
}

/* ======================================================
   ADAUGĂ MESAJ USER
====================================================== */
function addUserMessage(msg) {
    const box = document.getElementById('ai-chat-messages');
    if (!box) return;

    box.innerHTML += `<div class="user-msg">${msg}</div>`;
    pgConversation.push({ role: "user", content: msg });

    scrollMessages();
    saveChat();
}

/* ======================================================
   ADAUGĂ MESAJ BOT (CU HTML + LINKURI)
====================================================== */
function addBotMessage(msg) {
    const box = document.getElementById('ai-chat-messages');
    if (!box) return;

    box.innerHTML += `<div class="bot-msg">${linkify(msg)}</div>`;
    pgConversation.push({ role: "assistant", content: msg });

    scrollMessages();
    saveChat();
}

/* ======================================================
   ARATA ANIMATIA DE TYPING
====================================================== */
function showTyping() {
    const typingBox = document.getElementById("ai-typing");
    typingBox.style.display = "flex";
    scrollMessages();
}

function hideTyping() {
    const typingBox = document.getElementById("ai-typing");
    typingBox.style.display = "none";
}

/* ======================================================
   TRIMITE MESAJ
====================================================== */
async function sendMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;

    const msg = input.value.trim();
    if (!msg) return;

    addUserMessage(msg);
    input.value = "";

    showTyping();

    try {
        const response = await fetch("https://gemenichat.onrender.com/ask", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ messages: pgConversation })
        });

        const data = await response.json();
        hideTyping();
        addBotMessage(data.answer);

    } catch (err) {
        hideTyping();
        addBotMessage("❌ Serverul nu răspunde acum. Încearcă din nou.");
    }
}

/* ======================================================
   INITIALIZARE
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const messagesBox = document.getElementById("ai-chat-messages");
    const bubble = document.getElementById("ai-bot-bubble");
    const input = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("ai-chat-send");

    /*  Restaurăm conversația salvată */
    const saved = sessionStorage.getItem("GemeniBotHistory");
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

    if (bubble) bubble.onclick = toggleChat;

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            sendMessage();
        });
    }

    if (input) {
        input.addEventListener("keydown", ev => {
            if (ev.key === "Enter") sendMessage();
        });
    }
});




