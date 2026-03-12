// simple chatbox logic using OpenAI Chat API (or placeholder)
// personality: firm, a bit rude, likes to tease users

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversation = [];

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

    // call to Groq API
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
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
appendMessage('ai', 'Ready. Ask me anything.');
