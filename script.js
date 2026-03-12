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
    const msgContainer = document.createElement('div');
    msgContainer.classList.add('message-container', role === 'user' ? 'user-container' : 'ai-container');
    
    if (role === 'ai') {
        const avatar = document.createElement('img');
        avatar.src = 'Siggyverse.png';
        avatar.alt = 'SIggyverse avatar';
        avatar.classList.add('message-avatar');
        msgContainer.appendChild(avatar);
    }
    
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user' : 'ai');
    msgDiv.innerText = text;
    msgContainer.appendChild(msgDiv);
    
    chatWindow.appendChild(msgContainer);
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
                model: 'openai/gpt-oss-120b',
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

// ============================================
// RITUAL DOCUMENTATION INTEGRATION
// Tambahkan kode ini ke file script.js Anda
// ============================================

// Konfigurasi Document Store untuk Ritual Documentation
const RITUAL_DOCS = {
    vectorStorePath: 'vector-store.json',
    documentsPath: 'documents/',
    enableLogging: true
};

// Class untuk mengelola dokumentasi Ritual
class RitualDocumentStore {
    constructor() {
        this.data = null;
        this.documents = [];
        this.searchIndex = new Map();
        this.initialized = false;
        this.stats = {
            queries: 0,
            documentsFound: 0,
            lastQuery: null
        };
    }

    // Inisialisasi: load vector store
    async initialize() {
        try {
            this.log('📚 Loading Ritual documentation...');
            
            // Load vector store JSON
            const response = await fetch(RITUAL_DOCS.vectorStorePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.data = await response.json();
            this.documents = this.data.documents;
            
            // Build search index untuk pencarian cepat
            this.buildSearchIndex();
            
            this.initialized = true;
            this.log(`✅ Ritual docs siap: ${this.documents.length} dokumen terindex`);
            this.log(`📖 Topik: ${this.data.metadata.name}`);
            
            return true;
        } catch (error) {
            console.error('❌ Gagal load Ritual docs:', error);
            return false;
        }
    }

    // Build search index dari keywords dan chunks
    buildSearchIndex() {
        this.searchIndex.clear();
        
        this.documents.forEach(doc => {
            // Index keywords
            doc.keywords.forEach(keyword => {
                const key = keyword.toLowerCase();
                if (!this.searchIndex.has(key)) {
                    this.searchIndex.set(key, []);
                }
                this.searchIndex.get(key).push({
                    docId: doc.id,
                    relevance: 3, // Keyword match = high relevance
                    type: 'keyword'
                });
            });
            
            // Index title dan summary
            const titleWords = doc.title.toLowerCase().split(/\s+/);
            titleWords.forEach(word => {
                if (word.length > 3) {
                    const key = word;
                    if (!this.searchIndex.has(key)) {
                        this.searchIndex.set(key, []);
                    }
                    this.searchIndex.get(key).push({
                        docId: doc.id,
                        relevance: 2, // Title match = medium relevance
                        type: 'title'
                    });
                }
            });
        });
        
        this.log(`🔍 Search index built: ${this.searchIndex.size} keywords`);
    }

    // Cari dokumen relevan berdasarkan query
    search(query, limit = 3) {
        this.stats.queries++;
        this.stats.lastQuery = query;
        
        if (!this.initialized || !this.documents.length) {
            return [];
        }
        
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        
        // Hitung relevansi setiap dokumen
        const relevanceScores = new Map();
        
        this.documents.forEach(doc => {
            let score = 0;
            const matches = [];
            
            // Cek di title
            if (doc.title.toLowerCase().includes(queryLower)) {
                score += 10;
                matches.push('title');
            }
            
            // Cek di keywords
            doc.keywords.forEach(keyword => {
                if (keyword.toLowerCase().includes(queryLower)) {
                    score += 8;
                    matches.push('keyword');
                }
            });
            
            // Cek di summary
            if (doc.summary.toLowerCase().includes(queryLower)) {
                score += 5;
                matches.push('summary');
            }
            
            // Cek di chunks
            doc.chunks.forEach((chunk, index) => {
                if (chunk.toLowerCase().includes(queryLower)) {
                    score += 3;
                    matches.push(`chunk_${index}`);
                }
            });
            
            // Cek per kata untuk partial matching
            queryWords.forEach(word => {
                if (doc.title.toLowerCase().includes(word)) score += 2;
                if (doc.summary.toLowerCase().includes(word)) score += 1;
                doc.keywords.forEach(k => {
                    if (k.toLowerCase().includes(word)) score += 1;
                });
            });
            
            if (score > 0) {
                relevanceScores.set(doc.id, {
                    doc: doc,
                    score: score,
                    matches: matches
                });
            }
        });
        
        // Urutkan berdasarkan skor dan ambil top results
        const results = Array.from(relevanceScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        this.stats.documentsFound = results.length;
        
        return results;
    }

    // Dapatkan context untuk AI prompt
    getContextForQuery(query) {
        const results = this.search(query);
        
        if (results.length === 0) {
            return '';
        }
        
        let context = '📚 **Dokumentasi Ritual - Informasi Relevan:**\n\n';
        
        results.forEach((result, index) => {
            const doc = result.doc;
            context += `**${index + 1}. ${doc.title}**\n`;
            context += `> ${doc.summary}\n\n`;
            
            // Ambil chunk paling relevan
            const queryLower = query.toLowerCase();
            const relevantChunks = doc.chunks
                .filter(chunk => chunk.toLowerCase().includes(queryLower))
                .slice(0, 2);
            
            if (relevantChunks.length > 0) {
                context += 'Kutipan:\n';
                relevantChunks.forEach(chunk => {
                    context += `"${chunk}"\n`;
                });
            }
            
            context += `🔗 ${doc.url}\n\n`;
        });
        
        context += 'Gunakan informasi di atas untuk menjawab pertanyaan user tentang Ritual.\n\n';
        
        return context;
    }

    // Dapatkan semua topik yang tersedia
    getAllTopics() {
        return this.documents.map(doc => ({
            title: doc.title,
            slug: doc.slug,
            keywords: doc.keywords.slice(0, 5),
            summary: doc.summary.substring(0, 100) + '...'
        }));
    }

    // Cari dokumen spesifik berdasarkan slug
    getDocumentBySlug(slug) {
        return this.documents.find(doc => doc.slug === slug);
    }

    // Dapatkan statistik
    getStats() {
        return {
            ...this.stats,
            totalDocuments: this.documents.length,
            totalKeywords: this.searchIndex.size,
            topics: this.documents.map(d => d.title)
        };
    }

    // Logging utility
    log(message) {
        if (RITUAL_DOCS.enableLogging) {
            console.log(`[RitualDocs] ${message}`);
        }
    }
}

// ============================================
// INTEGRASI DENGAN AI CHAT ANDA
// ============================================

// Inisialisasi document store
const ritualDocs = new RitualDocumentStore();

// Fungsi untuk memperkaya prompt dengan konteks Ritual
async function enrichPromptWithRitualDocs(userMessage) {
    if (!ritualDocs.initialized) {
        await ritualDocs.initialize();
    }
    
    const context = ritualDocs.getContextForQuery(userMessage);
    
    if (context) {
        return context + '\nPertanyaan user: ' + userMessage;
    } else {
        return userMessage;
    }
}

// Fungsi untuk mendapatkan response dengan sumber
async function getRitualEnhancedResponse(userMessage, aiResponse) {
    if (!ritualDocs.initialized) {
        await ritualDocs.initialize();
    }
    
    const results = ritualDocs.search(userMessage);
    
    if (results.length > 0) {
        const sources = results.map(r => r.doc.title).join(', ');
        return {
            response: aiResponse,
            sources: sources,
            documents: results.map(r => ({
                title: r.doc.title,
                url: r.doc.url,
                relevance: r.score
            }))
        };
    }
    
    return {
        response: aiResponse,
        sources: null,
        documents: []
    };
}

// ============================================
// FUNGSI UNTUK DIPANGGIL DARI CHAT ANDA
// ============================================

// Panggil fungsi ini di awal saat halaman dimuat
async function initRitualDocs() {
    await ritualDocs.initialize();
    
    // Tampilkan topics di console untuk debugging
    console.log('📋 Topik yang tersedia:', ritualDocs.getAllTopics().map(t => t.title));
    
    return ritualDocs;
}

// MODIFIKASI FUNGSI SEND MESSAGE ANDA
// Contoh: jika fungsi sendMessage Anda bernama `sendMessage`
async function sendMessageWithRitual() {
    const userMessage = document.getElementById('messageInput').value;
    
    // Tampilkan pesan user
    displayUserMessage(userMessage);
    
    try {
        // Enrich prompt dengan konteks dari Ritual docs
        const enhancedPrompt = await enrichPromptWithRitualDocs(userMessage);
        
        // Panggil AI Anda dengan enhanced prompt
        // 🔴 GANTI INI DENGAN PANGGILAN AI ANDA
        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
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
        
        // Dapatkan response dengan sumber dokumen
        const enhanced = await getRitualEnhancedResponse(userMessage, aiResponse);
        
        // Tampilkan response
        let finalResponse = enhanced.response;
        if (enhanced.sources) {
            finalResponse += `\n\n📚 **Sumber:** ${enhanced.sources}`;
        }
        
        displayAssistantMessage(finalResponse);
        
    } catch (error) {
        console.error('Error:', error);
        displayErrorMessage('Maaf, terjadi kesalahan.');
    }
}

// ============================================
// FUNGSI UTILITY UNTUK UI
// ============================================

// Tampilkan panel dokumen di chat
function createRitualDocsPanel() {
    const panel = document.createElement('div');
    panel.className = 'ritual-docs-panel';
    panel.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
        font-family: Arial, sans-serif;
    `;
    
    panel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📚</span>
            <div>
                <h3 style="margin: 0; font-size: 16px;">Ritual Documentation</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                    15 dokumen siap: Account Abstraction, Crypto×AI, Enshrined Models, Symphony, Resonance, Guardians, dll.
                </p>
            </div>
        </div>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 5px;">
            ${ritualDocs.documents.slice(0, 5).map(doc => `
                <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 15px; font-size: 12px;">
                    ${doc.title}
                </span>
            `).join('')}
            <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 15px; font-size: 12px;">
                +${ritualDocs.documents.length - 5} lainnya
            </span>
        </div>
    `;
    
    return panel;
}

// Fungsi untuk mencari di dokumentasi (bisa dipanggil dari console)
window.searchRitualDocs = function(query) {
    return ritualDocs.search(query);
};

// Auto-initialize saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    await initRitualDocs();
    
    // Tambahkan panel ke chat (sesuaikan selector dengan chat Anda)
    const chatContainer = document.querySelector('.chat-container') || document.body;
    const panel = createRitualDocsPanel();
    chatContainer.insertBefore(panel, chatContainer.firstChild);
});

// start
initConversation();
appendMessage('ai', 'Ready. Ask me anything.');



