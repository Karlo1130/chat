const socket = io();
let currentRoom = 'general';
let username = '';

document.getElementById('join').addEventListener('click', () => {
  username = document.getElementById('username').value.trim();
  currentRoom = document.getElementById('room').value.trim() || 'general';
  
  if(username) {
    socket.emit('joinRoom', currentRoom);
    document.querySelector('.chat-container').classList.remove('hidden');
    document.querySelector('.room-selector').classList.add('hidden');
  }
});

document.getElementById('send').addEventListener('click', sendMessage);
document.getElementById('message').addEventListener('keypress', (e) => {
  if(e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const messageInput = document.getElementById('message');
  const content = messageInput.value.trim();
  
  if(content) {
    socket.emit('sendMessage', {
      sender: username,
      content,
      room: currentRoom
    });
    messageInput.value = '';
  }
}

// Escuchar mensajes nuevos
socket.on('newMessage', (message) => {
  addMessageToUI(message);
});

// Cargar historial inicial
socket.on('messageHistory', (messages) => {
  const container = document.getElementById('messages');
  container.innerHTML = '';
  messages.forEach(addMessageToUI);
});

function addMessageToUI(message) {
  const container = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.innerHTML = `
    <strong>${message.sender}</strong>
    <span>${new Date(message.timestamp).toLocaleTimeString()}</span>
    <p>${message.content}</p>
  `;
  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
}