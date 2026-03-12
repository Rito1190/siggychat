// simple chatbox logic using OpenAI Chat API (or placeholder)
// personality: firm, a bit rude, likes to tease users

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let sourceText = '';
let conversation = [];

// preload specific web page as source
const PRELOAD_URL = 'https://www.ritualfoundation.org/docs/overview/what-is-ritual';

async function preloadSource() {
    try {
        const res = await fetch(PRELOAD_URL);
        if (res.ok) {
            sourceText = await res.text();
            appendMessage('ai', 'Preloaded web source is ready.');
        } else {
            console.warn('Failed to preload source:', res.status);
        }
    } catch (err) {
        console.error('Preload source error:', err);
    }
}

// initialize with system message defining personality
function initConversation() {
    conversation = [
        {
            role: 'system',
            content: `You are SIggyverse, an AI chatbot that is firm, a bit rude, loves to joke and tease users, but still answers questions about technology based on the provided source.`
        }
    ];
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user' : 'ai');
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendQuestion(question) {
    appendMessage('user', question);
    conversation.push({ role: 'user', content: question });

    // include source text context if available
    if (sourceText) {
        conversation.push({ role: 'system', content: `Source text: ${sourceText}` });
    }

    // call to Grok API (xAI) through backend proxy
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversation
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', response.status, errorData);
            appendMessage('ai', `Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            return;
        }
        
        const data = await response.json();
        const aiText = data.choices[0].message.content;
        appendMessage('ai', aiText);
        conversation.push({ role: 'assistant', content: aiText });
    } catch (err) {
        console.error('Fetch error:', err);
        appendMessage('ai', 'Error: ' + err.message);
    }
}

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) {
        sendQuestion(text);
        userInput.value = '';
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});



// start
initConversation();
preloadSource();
appendMessage('ai', 'Ready, default source is loaded. Ask me anything.');
