const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

const messageTone = new Audio('/message-tone.mp3');

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`;
});

function sendMessage() {
  if (messageInput.value === '') return;

  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date(),
  };

  // Emit the message to the server
  socket.emit('message', data);

  // Add the message to the UI as sent
  addMessageToUI(true, data);

  // Save the message to localStorage
  saveMessageToLocalStorage(true, data);

  // Clear the input field
  messageInput.value = '';
}

socket.on('chat-message', (data) => {
  messageTone.play();

  // Add the message to the UI as received
  addMessageToUI(false, data);

  // Save the received message to localStorage
  saveMessageToLocalStorage(false, data);
});

function addMessageToUI(isOwnMessage, data) {
  clearFeedback();

  const element = `
    <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
      <p class="message">
        ${data.message}
        <span>${data.name} ● ${moment(data.dateTime).fromNow()}</span>
      </p>
    </li>
  `;

  messageContainer.innerHTML += element;
  scrollToBottom();
}

function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

messageInput.addEventListener('focus', () => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
  });
});

messageInput.addEventListener('keypress', () => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
  });
});

messageInput.addEventListener('blur', () => {
  socket.emit('feedback', {
    feedback: '',
  });
});

socket.on('feedback', (data) => {
  clearFeedback();
  const element = `
    <li class="message-feedback">
      <p class="feedback" id="feedback">${data.feedback}</p>
    </li>
  `;
  messageContainer.innerHTML += element;
});

function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((element) => {
    element.parentNode.removeChild(element);
  });
}

// Save message to localStorage
function saveMessageToLocalStorage(isOwnMessage, data) {
  const savedMessages = JSON.parse(localStorage.getItem('chat-history')) || [];
  savedMessages.push({ isOwnMessage, data });
  localStorage.setItem('chat-history', JSON.stringify(savedMessages));
}

// Load saved chat history from localStorage when the page is loaded
window.addEventListener('DOMContentLoaded', () => {
  const savedMessages = JSON.parse(localStorage.getItem('chat-history')) || [];

  // Clear the message container before loading history
  messageContainer.innerHTML = '';

  savedMessages.forEach((message) => {
    addMessageToUI(message.isOwnMessage, message.data);
  });
});
