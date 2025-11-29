/**
 * FortuneOne AI Chat Widget
 * Self-initializing chat widget with WebSocket, Speech Recognition & TTS
 * Updated with Call + WhatsApp buttons and correct phone number
 */
(function() {
    'use strict';

    const script = document.currentScript;
    const BACKEND_URL = script.getAttribute('data-backend-url') || 'http://localhost:4000';
    const BUSINESS_ID = script.getAttribute('data-business-id') || 'bangkok-fortune';
    const DEFAULT_LANG = script.getAttribute('data-default-language') || 'en';
    
    // Phone configuration
    const PHONE_NUMBER = '+19296324665';
    const PHONE_DISPLAY = '929-632-4665';
    const WHATSAPP_LINK = 'https://wa.me/19296324665';

    let ws = null;
    let isOpen = false;
    let recognition = null;
    let isRecording = false;
    let isSending = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const DEBOUNCE_DELAY = 300;

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function init() {
        createWidget();
        connectWebSocket();
        setupSpeechRecognition();
    }

    function createWidget() {
        const container = document.createElement('div');
        container.id = 'fortuneone-chat-widget';
        container.innerHTML = `
            <button class="fortuneone-chat-button" aria-label="Open chat">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </button>
            <div class="fortuneone-chat-window">
                <div class="fortuneone-chat-header">
                    <h3>FortuneOne AI Receptionist</h3>
                    <button class="fortuneone-chat-close" aria-label="Close">&times;</button>
                </div>
                <div class="fortuneone-chat-messages"></div>
                <div class="fortuneone-chat-input-area">
                    <input type="text" class="fortuneone-chat-input" placeholder="Type a message...">
                    <button class="fortuneone-chat-voice" aria-label="Voice input">
                        <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93v2h4v2H8v-2h4v-2z"/></svg>
                    </button>
                    <button class="fortuneone-chat-send" aria-label="Send">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
                <div class="fortuneone-chat-actions">
                    <a href="tel:${PHONE_NUMBER}" class="fortuneone-action-btn fortuneone-call-btn">
                        <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        <span>Call ${PHONE_DISPLAY}</span>
                    </a>
                    <a href="${WHATSAPP_LINK}" target="_blank" class="fortuneone-action-btn fortuneone-whatsapp-btn">
                        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span>WhatsApp</span>
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        setupEventListeners(container);
    }

    function setupEventListeners(container) {
        const btn = container.querySelector('.fortuneone-chat-button');
        const closeBtn = container.querySelector('.fortuneone-chat-close');
        const chatWindow = container.querySelector('.fortuneone-chat-window');
        const input = container.querySelector('.fortuneone-chat-input');
        const sendBtn = container.querySelector('.fortuneone-chat-send');
        const voiceBtn = container.querySelector('.fortuneone-chat-voice');

        btn.addEventListener('click', () => {
            chatWindow.classList.add('open');
            btn.style.display = 'none';
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('open');
            btn.style.display = 'flex';
        });

        const debouncedSend = debounce((inputEl) => {
            sendMessage(inputEl);
        }, DEBOUNCE_DELAY);

        sendBtn.addEventListener('click', () => debouncedSend(input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                debouncedSend(input);
            }
        });
        voiceBtn.addEventListener('click', toggleVoice);
    }

    function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.log('[FortuneOne] WebSocket already connecting, skipping...');
            return;
        }
        
        const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws?business_id=' + BUSINESS_ID;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => { 
            console.log('[FortuneOne] Connected'); 
            reconnectAttempts = 0;
        };
        ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
        ws.onclose = () => { 
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`[FortuneOne] Disconnected, reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
                reconnectAttempts++;
                setTimeout(connectWebSocket, delay);
            } else {
                console.error('[FortuneOne] Max reconnection attempts reached');
            }
        };
        ws.onerror = (err) => { console.error('[FortuneOne] Error:', err); };
    }

    function sendMessage(input) {
        const text = input.value.trim();
        if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
        
        if (isSending) {
            console.log('[FortuneOne] Already sending, skipping duplicate...');
            return;
        }
        
        isSending = true;
        addMessage(text, 'user');
        ws.send(JSON.stringify({ type: 'text_input', content: text, language: DEFAULT_LANG }));
        input.value = '';
        showTyping();
        
        setTimeout(() => { isSending = false; }, 500);
    }

    function handleMessage(msg) {
        hideTyping();
        if (msg.type === 'text_output' && msg.content) {
            addMessage(msg.content, 'bot');
            speak(msg.content);
        }
    }

    function addMessage(text, sender) {
        const container = document.querySelector('.fortuneone-chat-messages');
        const div = document.createElement('div');
        div.className = 'fortuneone-message ' + sender;
        div.innerHTML = '<div class="fortuneone-message-content">' + text + '</div>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        const container = document.querySelector('.fortuneone-chat-messages');
        if (!container.querySelector('.fortuneone-typing')) {
            const div = document.createElement('div');
            div.className = 'fortuneone-typing';
            div.innerHTML = '<div class="fortuneone-typing-dot"></div><div class="fortuneone-typing-dot"></div><div class="fortuneone-typing-dot"></div>';
            container.appendChild(div);
        }
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        const typing = document.querySelector('.fortuneone-typing');
        if (typing) typing.remove();
    }

    function setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window)) return;
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = DEFAULT_LANG === 'th' ? 'th-TH' : 'en-US';
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            document.querySelector('.fortuneone-chat-input').value = text;
            sendMessage(document.querySelector('.fortuneone-chat-input'));
        };
        recognition.onend = () => {
            isRecording = false;
            document.querySelector('.fortuneone-chat-voice').classList.remove('recording');
        };
    }

    function toggleVoice() {
        if (!recognition) return;
        const btn = document.querySelector('.fortuneone-chat-voice');
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
            isRecording = true;
            btn.classList.add('recording');
        }
    }

    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = DEFAULT_LANG === 'th' ? 'th-TH' : 'en-US';
        speechSynthesis.speak(utterance);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
