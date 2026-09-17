// Initialize Lucide icons
lucide.createIcons();

// Setup Marked.js with Highlight.js
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

// Elements
const chatHistory = document.getElementById('chatHistory');
const welcomeScreen = document.getElementById('welcomeScreen');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const newChatBtn = document.getElementById('newChatBtn');
const exportBtn = document.getElementById('exportBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const modelSelect = document.getElementById('modelSelect');
const personaSelect = document.getElementById('personaSelect');

// Settings Elements
const apiKeyInput = document.getElementById('apiKey');
const toggleVisibilityBtn = document.getElementById('toggleVisibilityBtn');
const temperatureInput = document.getElementById('temperature');
const tempValue = document.getElementById('tempValue');
const maxTokensInput = document.getElementById('maxTokens');
const tokensValue = document.getElementById('tokensValue');

// Metrics Elements
const speedMetric = document.getElementById('speedMetric');
const latencyMetric = document.getElementById('latencyMetric');
const tokensMetric = document.getElementById('tokensMetric');

// State
let conversation = [];
let abortController = null;
let isGenerating = false;

// Personas
const personas = {
    general: "You are a helpful AI assistant. Be concise and accurate.",
    code: "You are an expert software engineer. Provide clean, well-documented code with explanations.",
    creative: "You are a creative writer. Use evocative language and think outside the box."
};

const DEFAULT_GROQ_KEY = '';

// Load Settings
function loadSettings() {
    const key = localStorage.getItem('groq_api_key') || DEFAULT_GROQ_KEY;
    apiKeyInput.value = key;
    
    const temp = localStorage.getItem('echo_temp') || '1.0';
    temperatureInput.value = temp;
    tempValue.textContent = temp;
    
    const tokens = localStorage.getItem('echo_tokens') || '4096';
    maxTokensInput.value = tokens;
    tokensValue.textContent = tokens;
    
    const history = localStorage.getItem('echo_history');
    if (history) {
        conversation = JSON.parse(history);
        renderHistory();
    }
}

function saveHistory() {
    localStorage.setItem('echo_history', JSON.stringify(conversation));
}

function renderHistory() {
    if (conversation.length > 0) {
        welcomeScreen.classList.add('hidden');
        // Clear all except welcome screen
        const msgs = chatHistory.querySelectorAll('.message');
        msgs.forEach(m => m.remove());
        
        conversation.forEach(msg => {
            if (msg.role !== 'system') {
                appendMessage(msg.role, msg.content, false);
            }
        });
    } else {
        welcomeScreen.classList.remove('hidden');
        const msgs = chatHistory.querySelectorAll('.message');
        msgs.forEach(m => m.remove());
    }
}

// Event Listeners for Settings
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

toggleVisibilityBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleVisibilityBtn.innerHTML = '<i data-lucide="eye-off"></i>';
    } else {
        apiKeyInput.type = 'password';
        toggleVisibilityBtn.innerHTML = '<i data-lucide="eye"></i>';
    }
    lucide.createIcons();
});

temperatureInput.addEventListener('input', (e) => {
    tempValue.textContent = e.target.value;
});

maxTokensInput.addEventListener('input', (e) => {
    tokensValue.textContent = e.target.value;
});

saveSettingsBtn.addEventListener('click', () => {
    localStorage.setItem('groq_api_key', apiKeyInput.value);
    localStorage.setItem('echo_temp', temperatureInput.value);
    localStorage.setItem('echo_tokens', maxTokensInput.value);
    settingsModal.classList.add('hidden');
});

// Auto-resize textarea
promptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

stopBtn.addEventListener('click', () => {
    if (abortController) {
        abortController.abort();
    }
});

newChatBtn.addEventListener('click', () => {
    conversation = [];
    saveHistory();
    renderHistory();
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
        conversation = [];
        saveHistory();
        renderHistory();
    }
});

exportBtn.addEventListener('click', () => {
    if (conversation.length === 0) return;
    
    let mdContent = `# Echo Mind Chat Export\n\n`;
    conversation.forEach(msg => {
        if (msg.role !== 'system') {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            mdContent += `### ${role}\n${msg.content}\n\n---\n\n`;
        }
    });
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
});

// Starter Cards
document.querySelectorAll('.starter-card').forEach(card => {
    card.addEventListener('click', () => {
        promptInput.value = card.textContent;
        sendMessage();
    });
});

function appendMessage(role, content, isStreaming = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    if (role === 'assistant') {
        const markdownDiv = document.createElement('div');
        markdownDiv.className = 'markdown-body';
        markdownDiv.innerHTML = marked.parse(content);
        msgDiv.appendChild(markdownDiv);
        
        // Add copy buttons to code blocks
        addCopyButtons(msgDiv);
    } else {
        msgDiv.textContent = content;
    }
    
    chatHistory.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv;
}

function updateMessage(msgElement, content) {
    const markdownDiv = msgElement.querySelector('.markdown-body');
    if (markdownDiv) {
        markdownDiv.innerHTML = marked.parse(content);
        addCopyButtons(msgElement);
    }
    scrollToBottom();
}

function scrollToBottom() {
    chatHistory.parentElement.scrollTop = chatHistory.parentElement.scrollHeight;
}

function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach(pre => {
        if (!pre.querySelector('.copy-btn')) {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.innerHTML = '<i data-lucide="copy"></i>';
            btn.onclick = () => {
                const code = pre.querySelector('code').innerText;
                navigator.clipboard.writeText(code);
                btn.innerHTML = '<i data-lucide="check"></i>';
                setTimeout(() => {
                    btn.innerHTML = '<i data-lucide="copy"></i>';
                    lucide.createIcons();
                }, 2000);
            };
            pre.appendChild(btn);
        }
    });
    lucide.createIcons();
}

/**
 * Dispatches the active user message to the Groq stream inference endpoint,
 * handling chunk decoding, markdown rendering, and autoscroll.
 * @returns {Promise<void>}
 */
async function sendMessage() {
    const content = promptInput.value.trim();
    const apiKey = localStorage.getItem('groq_api_key') || DEFAULT_GROQ_KEY;
    
    if (!content) return;

    if (isGenerating) return;

    // Setup initial system prompt if new conversation
    if (conversation.length === 0) {
        const persona = personaSelect.value;
        conversation.push({ role: 'system', content: personas[persona] });
        welcomeScreen.classList.add('hidden');
    }

    // Add user message
    conversation.push({ role: 'user', content });
    appendMessage('user', content);
    
    promptInput.value = '';
    promptInput.style.height = 'auto';
    
    // UI state
    isGenerating = true;
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    speedMetric.textContent = '0.0';
    latencyMetric.textContent = '0';
    tokensMetric.textContent = '0';

    const assistantMsgElement = appendMessage('assistant', '<span class="typing">...</span>');
    let assistantContent = '';
    let tokenCount = 0;
    const startTime = performance.now();
    let firstTokenTime = null;

    abortController = new AbortController();

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelSelect.value,
                messages: conversation,
                temperature: parseFloat(temperatureInput.value),
                max_tokens: parseInt(maxTokensInput.value),
                stream: true
            }),
            signal: abortController.signal
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (!firstTokenTime) {
                firstTokenTime = performance.now();
                latencyMetric.textContent = Math.round(firstTokenTime - startTime);
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.substring(6));
                        const chunk = data.choices[0]?.delta?.content || '';
                        assistantContent += chunk;
                        
                        // Roughly estimate tokens as word parts
                        tokenCount++;
                        tokensMetric.textContent = tokenCount;
                        
                        const now = performance.now();
                        const elapsedSecs = (now - firstTokenTime) / 1000;
                        if (elapsedSecs > 0) {
                            speedMetric.textContent = (tokenCount / elapsedSecs).toFixed(1);
                        }

                        updateMessage(assistantMsgElement, assistantContent);
                    } catch (e) {
                        console.error('Error parsing SSE line:', line, e);
                    }
                }
            }
        }
        
        conversation.push({ role: 'assistant', content: assistantContent });
        saveHistory();

    } catch (error) {
        if (error.name === 'AbortError') {
            conversation.push({ role: 'assistant', content: assistantContent + '\n\n*[Generation stopped by user]*' });
            updateMessage(assistantMsgElement, assistantContent + '\n\n*[Generation stopped by user]*');
            saveHistory();
        } else {
            updateMessage(assistantMsgElement, `**Error:** ${error.message}`);
        }
    } finally {
        isGenerating = false;
        sendBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        abortController = null;
    }
}

// Init
loadSettings();

// Escape key listener for settings modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
    }
});

// Session telemetry
function logSessionMetrics() {
    console.debug(`[EchoMind] Active conversation turns: ${conversation.length}`);
}

// Global copy code utility
window.copyCodeToClipboard = function(code) {
    navigator.clipboard.writeText(code).then(() => {
        console.debug('[EchoMind] Code block copied to clipboard');
    });
};
