/**
 * FortuneOne AI Chat Widget
 * Self-initializing chat widget with WebSocket, Speech Recognition & TTS
 */
(function() {
  'use strict';

  const script = document.currentScript;
  const BACKEND_URL = script.getAttribute('data-backend-url') || 'http://localhost:4000';
  const BUSINESS_ID = script.getAttribute('data-business-id') || 'bangkok-fortune';
  const DEFAULT_LANG = script.getAttribute('data-default-language') || 'en';

  let ws = null;
  let isOpen = false;
  let recognition = null;
  let isRecording = false;

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
          <h3>FortuneOne AI Assistant</h3>
          <button class="fortuneone-chat-close" aria-label="Close">&times;</button>
        </div>
        <div class="fortuneone-chat-messages"></div>
        <div class="fortuneone-chat-input-area">
          <input type="text" class="fortuneone-chat-input" placeholder="Type a message...">
          <button class="fortuneone-chat-voice" aria-label="Voice input">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/></svg>
          </button>
          <button class="fortuneone-chat-send" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    setupEventListeners(container);
  }

  function setupEventListeners(container) {
    const btn = container.querySelector('.fortuneone-chat-button');
    const closeBtn = container.querySelector('.fortuneone-chat-close');
    const window = container.querySelector('.fortuneone-chat-window');
    const input = container.querySelector('.fortuneone-chat-input');
    const sendBtn = container.querySelector('.fortuneone-chat-send');
    const voiceBtn = container.querySelector('.fortuneone-chat-voice');

    btn.addEventListener('click', () => {
      window.classList.add('open');
      btn.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
      window.classList.remove('open');
      btn.style.display = 'flex';
    });

    sendBtn.addEventListener('click', () => sendMessage(input));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage(input);
    });

    voiceBtn.addEventListener('click', toggleVoice);
  }

  function connectWebSocket() {
    const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws?business_id=' + BUSINESS_ID;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => { console.log('[FortuneOne] Connected'); };
    ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
    ws.onclose = () => { setTimeout(connectWebSocket, 3000); };
    ws.onerror = (err) => { console.error('[FortuneOne] Error:', err); };
  }

  function sendMessage(input) {
    const text = input.value.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    addMessage(text, 'user');
    ws.send(JSON.stringify({ type: 'text_input', content: text, language: DEFAULT_LANG }));
    input.value = '';
    showTyping();
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
      container.scrollTop = container.scrollHeight;
    }
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
