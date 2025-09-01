const socket = io();

// DOM 요소들
const loginForm = document.getElementById('login-form');
const chatMain = document.getElementById('chat-main');
const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const currentUserSpan = document.getElementById('current-user');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const usersListDiv = document.getElementById('users-list');
const userCountSpan = document.getElementById('user-count');
const typingIndicator = document.getElementById('typing-indicator');

let currentUsername = '';
let typingTimer = null;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    usernameInput.focus();
});

// 로그인 처리
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinChat();
    }
});

function joinChat() {
    const username = usernameInput.value.trim();
    if (username) {
        currentUsername = username;
        socket.emit('join', username);
        showChatMain();
    }
}

function showChatMain() {
    loginForm.style.display = 'none';
    chatMain.style.display = 'block';
    currentUserSpan.textContent = currentUsername;
    messageInput.focus();
}

// 채팅방 나가기
leaveBtn.addEventListener('click', () => {
    if (confirm('채팅방을 나가시겠습니까?')) {
        socket.disconnect();
        location.reload();
    }
});

// 메시지 전송
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentUsername) {
        socket.emit('chat message', {
            username: currentUsername,
            message: message
        });
        messageInput.value = '';
        stopTyping();
    }
}

// 타이핑 상태 처리
messageInput.addEventListener('input', () => {
    if (!typingTimer) {
        socket.emit('typing', { username: currentUsername, isTyping: true });
    }
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        stopTyping();
    }, 1000);
});

function stopTyping() {
    if (typingTimer) {
        socket.emit('typing', { username: currentUsername, isTyping: false });
        typingTimer = null;
    }
}

// Socket 이벤트 리스너들
socket.on('chat message', (data) => {
    addMessage(data, data.username === currentUsername);
});

socket.on('user joined', (data) => {
    addSystemMessage(data.message);
});

socket.on('user left', (data) => {
    addSystemMessage(data.message);
});

socket.on('users list', (users) => {
    updateUsersList(users);
});

socket.on('typing', (data) => {
    if (data.username !== currentUsername) {
        if (data.isTyping) {
            typingIndicator.textContent = `${data.username}님이 입력 중입니다...`;
        } else {
            typingIndicator.textContent = '';
        }
    }
});

// 메시지 추가 함수
function addMessage(data, isOwnMessage) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.textContent = `${data.username} • ${data.timestamp}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = data.message;
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 사용자 목록 업데이트
function updateUsersList(users) {
    usersListDiv.innerHTML = '';
    userCountSpan.textContent = users.length;
    
    users.forEach(username => {
        const userDiv = document.createElement('div');
        userDiv.className = `user-item ${username === currentUsername ? 'current-user' : ''}`;
        userDiv.textContent = username;
        usersListDiv.appendChild(userDiv);
    });
}

// 연결 상태 처리
socket.on('connect', () => {
    console.log('서버에 연결되었습니다.');
});

socket.on('disconnect', () => {
    console.log('서버와의 연결이 끊어졌습니다.');
    addSystemMessage('서버와의 연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
});

socket.on('reconnect', () => {
    console.log('서버에 재연결되었습니다.');
    addSystemMessage('서버에 재연결되었습니다.');
    if (currentUsername) {
        socket.emit('join', currentUsername);
    }
});
