// script.js

// Global Variables and Initialization
let userName; // Stores the user's name, set via sessionStorage
let currentTabIndex = 0; // Tracks the currently active tab index for tab switching
let transactions = []; // Array to store P2P transactions for the preview widget
let pendingTransactions = []; // Array to store all P2P transactions, including those not yet displayed
let lastLocalTransactionId = null; // Track the last locally added transaction ID

// DOM Elements for Chat Functionality
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const emojiBtn = document.getElementById('emoji-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const themeToggle = document.getElementById('theme-toggle');
const contactSupport = document.getElementById('contact-support');
const readDocs = document.getElementById('read-docs');
const refreshTips = document.getElementById('refreshTips');
const resetSession = document.getElementById('reset-session');
const clearCache = document.getElementById('clear-cache');
const reconnectNetwork = document.getElementById('reconnect-network');
const purgeHistory = document.getElementById('purge-history');
const emojiPicker = document.getElementById('emoji-picker');
const expandButton = document.getElementById('expand-chat');
const closeButton = document.getElementById('close-chat');
const overlay = document.getElementById('dashboard-overlay');
const dashboardContainer = document.querySelector('.dashboard-container');

// Variables for Chat Expansion
let isExpanded = false; // Tracks if the chat window is expanded
let originalParent = null; // Stores the original parent of the chat window when expanded
let placeholder = null; // Placeholder element used during chat expansion

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// DOMContentLoaded Event Listener
// Initializes the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and script started');

    // Initialize Socket.io
    // Sets up the WebSocket connection for real-time communication
    const socket = io();
    console.log('Socket.io initialized');

    // Prompt for User Name
    // Retrieves or prompts for the user's name and stores it in sessionStorage
    userName = sessionStorage.getItem('userName');
    if (!userName) {
        userName = prompt('Please enter your name:', 'User');
        if (!userName || userName.trim() === '') {
            userName = 'User'; // Default name if none provided
        }
        sessionStorage.setItem('userName', userName);
    }
    console.log('User name set to:', userName);

    // Tab Switching Setup
    // Handles tab navigation in the dashboard
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            const newTabIndex = index;
            const direction = newTabIndex > currentTabIndex ? 'left' : 'right';

            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.transform = direction === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
            });

            // Add active class to the clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.transform = 'translateX(0)';
            }

            currentTabIndex = newTabIndex;
            console.log(`Switched to tab: ${tabId}`);

            // Request P2P transaction history when switching to P2P tab
            if (tabId === 'p2p') {
                socket.emit('requestP2PTransactionHistory');
                console.log('Requested P2P transaction history on tab switch');
            }
        });
    });

    // Request P2P transaction history from the server on page load
    socket.emit('requestP2PTransactionHistory');
    console.log('Requested P2P transaction history on page load');

    // Initialize Chat and Other Features
    setupChat(socket);
    setupEmojiPicker();
    setupChatExpansion();
    setupQuickAccessTools();
    setupThemeToggle();
    setupFaqAndQna();
    setupChatbotSupport();
    setupSupportAnalytics();
    setupP2PTransfer(socket);
    setupBotChat(socket);
    setupViewButtons();

    // Add fade-in effect after content is loaded
    window.addEventListener('load', () => {
        console.log('Window loaded, adding fade class');
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            setTimeout(() => {
                dashboardContainer.classList.add('fade');
                console.log('Fade class added to dashboard-container');
            }, 100);
        } else {
            console.error('Dashboard container not found for fade effect');
        }
    });
});

// Tab Switching Function
// Programmatically switches to a specified tab (e.g., from "View All FAQs" button)
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const targetTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (!targetTab || !targetContent) {
        console.error(`Tab or content not found for tabId: ${tabId}`);
        return;
    }

    // Remove active class from all tabs and contents
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.transform = 'translateX(100%)'; // Default to right for consistency
    });

    // Add active class to the target tab and content
    targetTab.classList.add('active');
    targetContent.classList.add('active');
    targetContent.style.transform = 'translateX(0)';

    // Update currentTabIndex based on the new tab
    currentTabIndex = Array.from(tabs).findIndex(tab => tab.getAttribute('data-tab') === tabId);
    console.log(`Switched to tab: ${tabId}, new currentTabIndex: ${currentTabIndex}`);

    // Request P2P transaction history when switching to P2P tab
    if (tabId === 'p2p') {
        const socket = io();
        socket.emit('requestP2PTransactionHistory');
        console.log('Requested P2P transaction history on programmatic tab switch');
    }
}

// Toast Notification System
// Displays temporary notifications on the screen
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Chat Functionality Setup
// Initializes the main chat window (ByteChat Live Messaging)
function setupChat(socket) {
    let isUserAtBottom = true; // Tracks if the user is scrolled to the bottom of the chat

    // Auto-scroll to the bottom of the chat
    function scrollToBottom() {
        chatBox.scrollTop = 0;
        console.log('Scrolled to bottom, scrollTop:', chatBox.scrollTop);
    }

    // Update the status of a message (e.g., Sent -> Delivered -> Read)
    function updateStatus(messageElement, status) {
        const statusSpan = messageElement.querySelector('.status');
        if (statusSpan) statusSpan.textContent = status;
    }

    // Get the current timestamp in [HH:MM AM/PM] format
    function getTimestamp() {
        const now = new Date();
        return `[${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}]`;
    }

    // Send a message from the user
    function sendMessage() {
        console.log('Sending message...');
        const message = userInput.value.trim();
        const hasFile = fileInput.files.length > 0;

        if (!message && !hasFile) {
            console.log('No message or file to send');
            return;
        }

        if (message) {
            const timestamp = getTimestamp();
            const messageData = {
                type: 'user',
                userName: userName,
                content: message,
                timestamp: timestamp,
                status: 'Sent'
            };

            socket.emit('sendMessage', messageData);

            // Simulate a bot response after a delay
            setTimeout(() => {
                const botResponse = getBotResponse(message);
                const botMessageData = {
                    type: 'bot',
                    userName: 'ByteBot',
                    content: botResponse,
                    timestamp: getTimestamp(),
                    status: 'Sent'
                };
                socket.emit('sendMessage', botMessageData);
            }, 500);
        }

        userInput.value = '';
        scrollToBottom();
    }

    // Get a simple bot response based on the user's message
    function getBotResponse(userMessage) {
        if (!userMessage) return `Hello! How can I assist you today, ${userName}?`;
        userMessage = userMessage.toLowerCase();
        if (userMessage.includes('help')) return "I'm here to assist! What do you need help with?";
        if (userMessage.includes('time')) return `The current time is ${new Date().toLocaleTimeString()}.`;
        if (userMessage.includes('thanks')) return "You're welcome! 😊";
        return `Hello! How can I assist you today, ${userName}?`;
    }

    // Create a message element for the chat
    function createMessageElement(messageData, index) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageData.type === 'user' || messageData.type === 'file' ? 'user' : 'bot');
        messageElement.setAttribute('data-message-id', index);

        let content = '';
        if (messageData.type === 'file') {
            if (messageData.content.isImage) {
                const img = document.createElement('img');
                img.src = messageData.content.filePath;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                messageElement.appendChild(img);
                content = `Image: <a href="${messageData.content.filePath}" class="file-link" data-file-id="${messageData.content.fileId}" download="${messageData.content.fileName}">${messageData.content.fileName}</a>`;
            } else {
                content = `File: <a href="${messageData.content.filePath}" class="file-link" data-file-id="${messageData.content.fileId}" download="${messageData.content.fileName}">${messageData.content.fileName}</a>`;
            }
        } else {
            content = messageData.content;
        }

        let messageHTML = `
            <span class="username">${messageData.type === 'bot' ? 'ByteBot' : messageData.userName}</span>
            <span class="avatar"><i class="fas ${messageData.type === 'bot' ? 'fa-robot' : 'fa-user'}"></i></span>
            <span class="content">${content}</span>
            <span class="timestamp">${messageData.timestamp}</span>
            <span class="status">${messageData.status}</span>
        `;

        if ((messageData.type === 'user' || messageData.type === 'file') && messageData.userName === userName) {
            messageHTML += `
                <div class="message-actions">
                    ${messageData.type === 'user' ? '<button class="edit-btn action-button"><i class="fas fa-edit"></i> Edit</button>' : ''}
                    <button class="delete-btn action-button"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
        }

        messageElement.innerHTML = messageHTML;

        if ((messageData.type === 'user' || messageData.type === 'file') && messageData.userName === userName) {
            if (messageData.type === 'user') {
                const editBtn = messageElement.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => {
                    const newContent = prompt('Edit your message:', messageData.content);
                    if (newContent && newContent.trim() !== '') {
                        socket.emit('editMessage', { messageId: index, newContent: newContent.trim() });
                    }
                });
            }

            const deleteBtn = messageElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this message?')) {
                    socket.emit('deleteMessage', { messageId: index });
                }
            });
        }

        return messageElement;
    }

    // Handle scroll events to determine if the user is at the bottom
    chatBox.addEventListener('scroll', () => {
        isUserAtBottom = chatBox.scrollTop === 0;
        console.log('Scroll event, isUserAtBottom:', isUserAtBottom, 'scrollTop:', chatBox.scrollTop);
    });

    // Send button click event
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            console.log('Send button clicked');
            socket.emit('stopTyping', { userName });
            sendMessage();
        });
    } else {
        console.error('Send button not found');
    }

    // User input events for typing indicator and sending messages
    if (userInput) {
        let typingTimeout;
        let isTyping = false;

        userInput.addEventListener('input', () => {
            if (!isTyping) {
                console.log(`${userName} is typing...`);
                socket.emit('typing', { userName });
                isTyping = true;
            }

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                console.log(`${userName} stopped typing.`);
                socket.emit('stopTyping', { userName });
                isTyping = false;
            }, 5000);
        });

        userInput.addEventListener('keypress', (e) => {
            console.log('Key pressed:', e.key);
            if (e.key === 'Enter') {
                console.log(`${userName} stopped typing (message sent).`);
                socket.emit('stopTyping', { userName });
                isTyping = false;
                clearTimeout(typingTimeout);
                sendMessage();
            }
        });
    } else {
        console.error('User input not found');
    }

    // File attachment handling
    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            console.log('Attach button clicked');
            fileInput.click();
        });
    } else {
        console.error('Attach button not found');
    }

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                const timestamp = getTimestamp();
                const formData = new FormData();
                formData.append('file', file);

                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (!data.success) throw new Error(data.message || 'File upload failed');

                        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        const fileData = {
                            name: file.name,
                            path: data.filePath,
                            userName: userName,
                            timestamp: timestamp,
                            fileId: fileId
                        };

                        socket.emit('uploadFile', fileData);
                        fileInput.value = '';
                        scrollToBottom();
                    })
                    .catch(error => {
                        console.error('File upload failed:', error);
                        showToast('❌ Failed to upload file. Please try again.');
                    });
            } else {
                console.log('No file selected');
            }
        });
    } else {
        console.error('File input not found');
    }

    // Socket.io Event Listeners for Chat
    // Load chat history from the server
    socket.on('chatHistory', (history) => {
        console.log('Received chat history:', history);
        chatBox.innerHTML = '';
        history.forEach((msg, index) => {
            if (msg) {
                const messageElement = createMessageElement(msg, index);
                chatBox.prepend(messageElement);
            }
        });
        scrollToBottom();
    });

    // Handle new messages from the server
    socket.on('message', (messageData, messageId) => {
        console.log('Received message:', messageData, 'Message ID:', messageId);
        const messageElement = createMessageElement(messageData, messageId);
        chatBox.prepend(messageElement);

        if (messageData.type === 'user' || messageData.type === 'file') {
            setTimeout(() => updateStatus(messageElement, 'Delivered'), 1000);
            setTimeout(() => updateStatus(messageElement, 'Read'), 2000);
        }

        if (isUserAtBottom || messageData.userName === userName) {
            scrollToBottom();
        }
    });

    // Handle edited messages
    socket.on('messageEdited', ({ messageId, newContent }) => {
        console.log('Message edited:', messageId, newContent);
        const messageElement = chatBox.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const contentSpan = messageElement.querySelector('.content');
            contentSpan.textContent = newContent;
        }
    });

    // Handle deleted messages
    socket.on('messageDeleted', (messageId) => {
        console.log('Message deleted:', messageId);
        const messageElement = chatBox.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });

    // Typing Indicator Logic
    const typingUsers = new Set();

    socket.on('userTyping', ({ userName: typingUser }) => {
        console.log(`Received userTyping event for ${typingUser}`);
        if (typingUser !== userName) {
            typingUsers.add(typingUser);
            updateTypingIndicator();
        }
    });

    socket.on('userStoppedTyping', ({ userName: typingUser }) => {
        console.log(`Received userStoppedTyping event for ${typingUser}`);
        typingUsers.delete(typingUser);
        updateTypingIndicator();
    });

    function updateTypingIndicator() {
        console.log('Updating typing indicator, typingUsers:', Array.from(typingUsers));
        let typingIndicator = chatBox.querySelector('.typing-indicator');

        if (typingUsers.size > 0) {
            const typingText = Array.from(typingUsers).join(', ') + (typingUsers.size === 1 ? ' is typing...' : ' are typing...');
            
            if (typingIndicator) {
                typingIndicator.querySelector('.content').textContent = typingText;
            } else {
                typingIndicator = document.createElement('div');
                typingIndicator.classList.add('message', 'typing-indicator');
                typingIndicator.innerHTML = `
                    <span class="avatar"><i class="fas fa-keyboard"></i></span>
                    <span class="content">${typingText}</span>
                `;
                chatBox.prepend(typingIndicator);
                console.log('Created typing indicator:', typingText);
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
                console.log('Removed typing indicator');
            }
        }

        if (isUserAtBottom) {
            scrollToBottom();
        }
    }
}

// Emoji Picker Setup
// Initializes the emoji picker for the chat input
function setupEmojiPicker() {
    const emojiCategories = {
        'Smiley & People': ['😊', '😂', '😍', '🤔', '😎', '😅', '🙃', '🤯', '🤗', '🤭', '🙄', '😡', '💀', '🤝', '👍', '👎', '🙌', '👏', '✌️'],
        'Love & Affection': ['❤️', '💕', '💞', '💔', '😘', '🥰', '😏', '💋'],
        'Actions & Gestures': ['👉', '👈', '👆', '👇', '✋', '🤙', '🖖', '🤜🤛', '🤞', '👀'],
        'Fun & Celebrations': ['🎉', '🔥', '🎂', '🍕', '🎵', '🎮', '🏆', '⚡', '🎯'],
        'Nature & Objects': ['🌍', '🌟', '☀️', '🌙', '🌈', '☕', '🍺', '🏀', '⚽'],
        'Special Chat Emojis': ['✅', '❌', '🔄', '📌', '📎', '💡']
    };

    if (emojiBtn && emojiPicker) {
        emojiPicker.innerHTML = '';
        const closeButton = document.createElement('button');
        closeButton.textContent = '✖';
        closeButton.classList.add('emoji-close-btn');
        closeButton.addEventListener('click', () => {
            emojiPicker.style.display = 'none';
            console.log('Emoji picker closed via close button');
        });
        emojiPicker.appendChild(closeButton);

        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('emoji-category-container');
        Object.keys(emojiCategories).forEach(category => {
            const tab = document.createElement('button');
            tab.textContent = category;
            tab.classList.add('emoji-tab');
            tab.addEventListener('click', () => showCategory(category));
            categoryContainer.appendChild(tab);
        });
        emojiPicker.appendChild(categoryContainer);

        let activeCategory = Object.keys(emojiCategories)[0];
        Object.keys(emojiCategories).forEach(category => {
            const emojiDiv = document.createElement('div');
            emojiDiv.classList.add('emoji-category');
            emojiDiv.style.display = category === activeCategory ? 'flex' : 'none';
            emojiCategories[category].forEach(emoji => {
                const emojiButton = document.createElement('button');
                emojiButton.textContent = emoji;
                emojiButton.classList.add('emoji-option');
                emojiButton.addEventListener('click', () => {
                    userInput.value += emoji;
                    userInput.focus();
                    emojiPicker.style.display = 'none';
                    console.log('Emoji selected:', emoji);
                });
                emojiDiv.appendChild(emojiButton);
            });
            emojiPicker.appendChild(emojiDiv);
        });

        function showCategory(category) {
            document.querySelectorAll('.emoji-category').forEach(div => div.style.display = 'none');
            document.querySelectorAll('.emoji-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelector(`.emoji-category:nth-child(${Object.keys(emojiCategories).indexOf(category) + 3})`).style.display = 'flex';
            document.querySelector(`.emoji-tab:contains("${category}")`).classList.add('active');
            activeCategory = category;
            console.log('Switched to category:', category);
        }

        emojiBtn.addEventListener('click', () => {
            console.log('Emoji button clicked, toggling picker');
            const currentDisplay = window.getComputedStyle(emojiPicker).display;
            emojiPicker.style.display = currentDisplay === 'block' ? 'none' : 'block';
            console.log('Emoji picker display set to:', emojiPicker.style.display);
        });
    } else {
        console.error('Emoji button or picker element not found');
    }
}

// Chat Expansion Setup
// Handles expanding and collapsing the chat window
function setupChatExpansion() {
    function toggleChatExpansion() {
        console.log('toggleChatExpansion called, current isExpanded:', isExpanded);
        isExpanded = !isExpanded;
        const chatWindow = document.querySelector('.chat-window');
        console.log('Toggling chat expansion, new isExpanded:', isExpanded);

        const initialStyle = window.getComputedStyle(chatWindow);
        console.log('Initial width:', initialStyle.width);
        console.log('Initial height:', initialStyle.height);
        console.log('Initial position:', initialStyle.position);

        chatWindow.classList.toggle('chat-expanded');

        if (isExpanded) {
            originalParent = chatWindow.parentNode;
            placeholder = document.createElement('div');
            placeholder.classList.add('chat-placeholder');
            placeholder.style.width = initialStyle.width;
            placeholder.style.height = initialStyle.height;
            originalParent.insertBefore(placeholder, chatWindow);

            document.body.appendChild(chatWindow);

            overlay.classList.add('active');
            dashboardContainer.classList.add('blurred');
        } else {
            overlay.classList.remove('active');
            dashboardContainer.classList.remove('blurred');

            chatWindow.style.width = '';
            chatWindow.style.height = '';
            chatWindow.style.position = '';
            chatWindow.style.top = '';
            chatWindow.style.left = '';
            chatWindow.style.transform = '';
            chatWindow.style.maxWidth = '';
            chatWindow.style.maxHeight = '';
            chatWindow.style.zIndex = '';

            if (originalParent && placeholder) {
                originalParent.replaceChild(chatWindow, placeholder);
                placeholder = null;
                originalParent = null;
            }
        }

        console.log('Classes after toggle:', chatWindow.classList.toString());

        const computedStyle = window.getComputedStyle(chatWindow);
        console.log('Computed width:', computedStyle.width);
        console.log('Computed height:', computedStyle.height);
        console.log('Computed position:', computedStyle.position);
        console.log('Computed top:', computedStyle.top);
        console.log('Computed left:', computedStyle.left);
        console.log('Computed transform:', computedStyle.transform);
        console.log('Computed z-index:', computedStyle.zIndex);

        console.log('Overlay classList:', overlay.classList.toString());
        console.log('Dashboard container classList:', dashboardContainer.classList.toString());

        // Scroll to bottom after expansion
        const chatBox = document.getElementById('chat-box');
        chatBox.scrollTop = 0;
    }

    if (expandButton) {
        expandButton.removeEventListener('click', toggleChatExpansion);
        expandButton.addEventListener('click', () => {
            console.log('Expand button clicked');
            toggleChatExpansion();
        });
    } else {
        console.error('Expand button not found');
    }

    if (closeButton) {
        closeButton.removeEventListener('click', toggleChatExpansion);
        closeButton.addEventListener('click', () => {
            console.log('Close button clicked');
            toggleChatExpansion();
        });
    } else {
        console.error('Close button not found');
    }
}

// Quick Access Tools Setup
// Initializes buttons in the Quick Access Tools widget
function setupQuickAccessTools() {
    const tips = [
        "Use the 'Attach' button to share files in real time.",
        "Type /help in chat for a list of commands.",
        "You can double-click a message to edit it.",
        "Use keyboard shortcuts to speed up your support!"
    ];

    if (contactSupport) {
        contactSupport.addEventListener('click', () => {
            console.log('Contact support clicked');
            showToast('📩 This would open a direct support chat.');
        });
    } else {
        console.error('Contact support not found');
    }

    if (readDocs) {
        readDocs.addEventListener('click', () => {
            console.log('Read docs clicked');
            showToast('📚 Documentation coming soon.');
        });
    } else {
        console.error('Read docs not found');
    }

    if (resetSession) {
        resetSession.addEventListener('click', () => {
            console.log('Reset session clicked');
            showToast('🧼 Session has been reset successfully!');
        });
    } else {
        console.error('Reset session button not found');
    }

    if (clearCache) {
        clearCache.addEventListener('click', () => {
            console.log('Clear cache clicked');
            showToast('🗑️ Cache has been cleared successfully!');
        });
    } else {
        console.error('Clear cache button not found');
    }

    if (reconnectNetwork) {
        reconnectNetwork.addEventListener('click', () => {
            console.log('Reconnect network clicked');
            showToast('🌐 Network has been reconnected successfully!');
        });
    } else {
        console.error('Reconnect network button not found');
    }

    if (purgeHistory) {
        purgeHistory.addEventListener('click', () => {
            console.log('Purge history clicked');
            showToast('🔥 History has been purged successfully!');
        });
    } else {
        console.error('Purge history button not found');
    }

    if (refreshTips) {
        refreshTips.addEventListener('click', () => {
            console.log('Refresh tips clicked');
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            document.getElementById('tipText').textContent = randomTip;
            showToast('💡 Tip refreshed!');
        });
    } else {
        console.error('Refresh tips button not found');
    }
}

// Theme Toggle Setup
// Handles switching between skeuomorphic and frosted themes
function setupThemeToggle() {
    if (themeToggle) {
        const skeuomorphicTheme = document.getElementById('skeuomorphic-theme');
        const frostedTheme = document.getElementById('frosted-theme');
        let isSkeuomorphic = true;

        themeToggle.addEventListener('click', () => {
            console.log('Theme toggle clicked');
            if (isSkeuomorphic) {
                skeuomorphicTheme.disabled = true;
                frostedTheme.disabled = false;
                themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Skeuomorphic Theme';
                console.log('Switched to frosted theme');
            } else {
                skeuomorphicTheme.disabled = false;
                frostedTheme.disabled = true;
                themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Frosted Theme';
                console.log('Switched to skeuomorphic theme');
            }
            isSkeuomorphic = !isSkeuomorphic;
            localStorage.setItem('theme', isSkeuomorphic ? 'skeuomorphic' : 'frosted');
        });

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'frosted') {
            skeuomorphicTheme.disabled = true;
            frostedTheme.disabled = false;
            themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Skeuomorphic Theme';
            isSkeuomorphic = false;
            console.log('Loaded frosted theme from localStorage');
        } else {
            console.log('Loaded skeuomorphic theme (default or from localStorage)');
        }
    } else {
        console.error('Theme toggle not found');
    }
}

// FAQ and Q&A Setup
// Initializes FAQ toggles and Q&A card flip functionality
function setupFaqAndQna() {
    // Knowledge Base: FAQ Toggle
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    // Q&A and P2P Q&A Card Flip Functionality
    const qnaCards = document.querySelectorAll('.qna-card, .p2p-qna-card');
    qnaCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });
}

// Chatbot Support Setup
// Initializes the Chatbot Support widget with personality toggle
function setupChatbotSupport() {
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const personality = option.getAttribute('data-personality');
            console.log(`Chatbot personality set to: ${personality}`);
        });
    });
}

// Support Analytics Setup
// Initializes the Support Analytics widget with response time data
function setupSupportAnalytics() {
    const responseTimes = [40, 50, 30, 60, 45, 55, 35];
    const bars = document.querySelectorAll('.response-time-graph .bar');
    bars.forEach((bar, index) => {
        bar.style.setProperty('--bar-height', `${responseTimes[index]}%`);
        bar.textContent = `${responseTimes[index]} min`;
    });

    // Ticket Status Overview: Update Ticket Counts
    const openTicketsElement = document.getElementById('open-tickets');
    const resolvedTicketsElement = document.getElementById('resolved-tickets');
    const ticketsInQueue = 5;
    const ticketsResolved = 3;

    if (openTicketsElement && resolvedTicketsElement) {
        openTicketsElement.textContent = ticketsInQueue;
        resolvedTicketsElement.textContent = ticketsResolved;
    }

    // Support Metrics: Circle Graph (Not in DOM, but keeping for completeness)
    const circle1 = document.getElementById('circle-1');
    const circle2 = document.getElementById('circle-2');
    const circle3 = document.getElementById('circle-3');

    const metrics = {
        resolutionRate: 75,
        responseTime: 62.5,
        satisfactionRate: 50
    };

    if (circle1 && circle2 && circle3) {
        circle1.style.setProperty('--percent', `${metrics.resolutionRate}%`);
        circle1.querySelector('.circle-label').textContent = `${metrics.resolutionRate}%`;
        
        circle2.style.setProperty('--percent', `${metrics.responseTime}%`);
        circle2.querySelector('.circle-label').textContent = `${metrics.responseTime}%`;
        
        circle3.style.setProperty('--percent', `${metrics.satisfactionRate}%`);
        circle3.querySelector('.circle-label').textContent = `${metrics.satisfactionRate}%`;
    }
}

// P2P Transfer Functionality
// Handles the P2P Money Transfer widget, including sending/requesting money
function setupP2PTransfer(socket) {
    // Add a transaction to the DOM
    // Adds a transaction to the Recent Transfers list with a date field and transactionId for deduplication
    function addTransaction(type, amount, peer, note) {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            const li = document.createElement('li');
            li.classList.add(type);

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const user = userName || 'User';
            const line1 = document.createElement('span');
            line1.classList.add('transaction-line-1');
            const line2 = document.createElement('span');
            line2.classList.add('transaction-line-2');

            if (type === 'sent') {
                line1.textContent = `${user} sent $${amount} to ${peer} at ${time}`;
                line2.textContent = `$${amount} sent to ${peer} – ${time}${note ? ` [Note: ${note}]` : ''}`;
            } else if (type === 'requested') {
                line1.textContent = `${user} requested $${amount} from ${peer} at ${time}`;
                line2.textContent = `$${amount} requested from ${peer} – ${time}${note ? ` [Note: ${note}]` : ''}`;
            }

            li.appendChild(line1);
            li.appendChild(line2);
            transactionList.prepend(li);

            // Generate a unique transactionId
            const transactionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            // Emit the transaction to the server with a date field and transactionId
            const transaction = { type, amount, peer, note, timestamp: time, userName, date: new Date().toISOString(), transactionId };
            socket.emit('addP2PTransaction', transaction);
            console.log('Emitted addP2PTransaction:', transaction);

            // Set the last local transaction ID
            lastLocalTransactionId = transactionId;

            // Add to pending transactions if not already present
            if (!pendingTransactions.some(t => t.transactionId === transactionId)) {
                pendingTransactions.unshift(transaction);
                console.log('Added to pendingTransactions:', pendingTransactions);
            }

            autoscrollTransactionList();
        } else {
            console.error('Transaction list not found when adding transaction');
        }
    }

    // Update the P2P Activity preview widget
    // Displays the latest transactions in the dashboard tab
    function updateP2PPreview() {
        const previewList = document.querySelector('.p2p-preview ul#p2p-preview-transaction-list');
        if (previewList) {
            previewList.innerHTML = '';
            transactions.forEach(({ type, amount, peer, note, timestamp }) => {
                const li = document.createElement('li');
                li.classList.add(type);
                const line1 = document.createElement('span');
                line1.classList.add('transaction-line-1');
                line1.textContent = `User ${type} $${amount} ${type === 'sent' ? 'to' : 'from'} ${peer} at ${timestamp}`;
                const line2 = document.createElement('span');
                line2.classList.add('transaction-line-2');
                line2.textContent = `$${amount} ${type} ${type === 'sent' ? 'to' : 'from'} ${peer} – ${timestamp} ${note ? `(${note})` : ''}`;
                li.appendChild(line1);
                li.appendChild(line2);
                previewList.appendChild(li);
            });
            console.log('Updated P2P preview with transactions:', transactions);
        } else {
            console.error('P2P Preview list not found');
        }
    }

    // Autoscroll the transaction list to the top
    // Ensures the latest transaction is visible
    function autoscrollTransactionList() {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            console.log('autoscrollTransactionList called');
            setTimeout(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const scrollHeight = transactionList.scrollHeight;
                        const clientHeight = transactionList.clientHeight;
                        const maxScrollTop = scrollHeight - clientHeight;

                        console.log('Scroll parameters - scrollTop before:', transactionList.scrollTop, 'scrollHeight:', scrollHeight, 'clientHeight:', clientHeight, 'maxScrollTop:', maxScrollTop);
                        console.log('Number of transactions:', transactionList.children.length);

                        if (maxScrollTop > 0) {
                            transactionList.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                            console.log('Autoscrolled to top, scrollTop after:', transactionList.scrollTop);
                        } else {
                            console.log('No scroll needed, content fits within clientHeight');
                        }

                        setTimeout(() => {
                            console.log('Final scrollTop check:', transactionList.scrollTop);
                            console.log('Visible transaction at top:', transactionList.children[0]?.textContent);
                        }, 500);
                    });
                });
            }, 100);
        } else {
            console.error('Transaction list not found for autoscroll');
        }
    }

    // Load transactions into the main transaction list
    function loadTransactions(history) {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            transactionList.innerHTML = ''; // Clear existing list
            // Sort history by date, newest first, with improved timestamp fallback
            history.sort((a, b) => {
                let dateA = a.date && !isNaN(new Date(a.date)) ? new Date(a.date) : null;
                let dateB = b.date && !isNaN(new Date(b.date)) ? new Date(b.date) : null;
                if (dateA && dateB) {
                    // If both dates are valid, sort by date
                    return dateB - dateA; // Newest first
                }
                // Fallback to timestamp if date is missing or invalid
                const timeA = a.timestamp || '12:00 AM';
                const timeB = b.timestamp || '12:00 AM';
                const parseTime = (timeStr) => {
                    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
                    if (!timeMatch) {
                        console.warn(`Invalid timestamp format: ${timeStr}, defaulting to epoch`);
                        return new Date(0); // Fallback to epoch if timestamp is invalid
                    }
                    let hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const period = timeMatch[3].toUpperCase();
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    // Use a fixed date (e.g., today) to ensure consistent comparison
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                };
                dateA = dateA || parseTime(timeA);
                dateB = dateB || parseTime(timeB);
                console.log(`Sorting in loadTransactions - Transaction A: ${JSON.stringify(a)}, Date A: ${dateA.toISOString()}`);
                console.log(`Sorting in loadTransactions - Transaction B: ${JSON.stringify(b)}, Date B: ${dateB.toISOString()}`);
                return dateB - dateA; // Newest first
            });
            console.log('Sorted history in loadTransactions:', history.map(t => ({ timestamp: t.timestamp, date: t.date, amount: t.amount })));
            history.reverse().forEach(({ type, amount, peer, note, timestamp, userName: storedUserName }) => {
                const li = document.createElement('li');
                li.classList.add(type);
                const line1 = document.createElement('span');
                line1.classList.add('transaction-line-1');
                const line2 = document.createElement('span');
                line2.classList.add('transaction-line-2');
                const user = storedUserName || 'User';
                if (type === 'sent') {
                    line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'requested') {
                    line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                }
                li.appendChild(line1);
                li.appendChild(line2);
                transactionList.prepend(li); // Prepend to maintain newest-first order
            });
            autoscrollTransactionList();
            console.log('Loaded transactions from server:', history.length);
        } else {
            console.error('Transaction list not found for loading transactions');
            // If P2P tab is not active, store the history in pendingTransactions
            pendingTransactions = history;
            console.log('Stored transactions in pendingTransactions:', pendingTransactions);
        }
    }


    // Add a single transaction to the DOM with retry logic
    function addTransactionToDOM(transaction, retryCount = 0) {
        const maxRetries = 5;
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            const { type, amount, peer, note, timestamp, userName: storedUserName } = transaction;
            const li = document.createElement('li');
            li.classList.add(type);
            const line1 = document.createElement('span');
            line1.classList.add('transaction-line-1');
            const line2 = document.createElement('span');
            line2.classList.add('transaction-line-2');
            const user = storedUserName || 'User';
            if (type === 'sent') {
                line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
            } else if (type === 'requested') {
                line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
            }
            li.appendChild(line1);
            li.appendChild(line2);
            transactionList.prepend(li);
            autoscrollTransactionList();
            console.log('Added transaction to DOM:', transaction);
        } else if (retryCount < maxRetries) {
            console.warn(`Transaction list not found, retrying (${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => addTransactionToDOM(transaction, retryCount + 1), 500);
        } else {
            console.error('Transaction list not found after max retries');
            // Fallback: Store the transaction and force a re-render when the tab is switched
            pendingTransactions.unshift(transaction);
            console.log('Stored transaction for later rendering:', pendingTransactions);
        }
    }

    // Force re-render of the transaction list
    function forceRenderTransactions() {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            transactionList.innerHTML = ''; // Clear existing list
            // Sort pendingTransactions by date, newest first, with improved timestamp fallback
            pendingTransactions.sort((a, b) => {
                let dateA = a.date && !isNaN(new Date(a.date)) ? new Date(a.date) : null;
                let dateB = b.date && !isNaN(new Date(b.date)) ? new Date(b.date) : null;
                if (dateA && dateB) {
                    // If both dates are valid, sort by date
                    return dateB - dateA; // Newest first
                }
                // Fallback to timestamp if date is missing or invalid
                const timeA = a.timestamp || '12:00 AM';
                const timeB = b.timestamp || '12:00 AM';
                const parseTime = (timeStr) => {
                    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
                    if (!timeMatch) {
                        console.warn(`Invalid timestamp format: ${timeStr}, defaulting to epoch`);
                        return new Date(0); // Fallback to epoch if timestamp is invalid
                    }
                    let hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const period = timeMatch[3].toUpperCase();
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    // Use a fixed date (e.g., today) to ensure consistent comparison
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                };
                dateA = dateA || parseTime(timeA);
                dateB = dateB || parseTime(timeB);
                console.log(`Sorting in forceRenderTransactions - Transaction A: ${JSON.stringify(a)}, Date A: ${dateA.toISOString()}`);
                console.log(`Sorting in forceRenderTransactions - Transaction B: ${JSON.stringify(b)}, Date B: ${dateB.toISOString()}`);
                return dateB - dateA; // Newest first
            });
            console.log('Sorted pendingTransactions in forceRenderTransactions:', pendingTransactions.map(t => ({ timestamp: t.timestamp, date: t.date, amount: t.amount })));
            pendingTransactions.forEach(({ type, amount, peer, note, timestamp, userName: storedUserName }) => {
                const li = document.createElement('li');
                li.classList.add(type);
                const line1 = document.createElement('span');
                line1.classList.add('transaction-line-1');
                const line2 = document.createElement('span');
                line2.classList.add('transaction-line-2');
                const user = storedUserName || 'User';
                if (type === 'sent') {
                    line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'requested') {
                    line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                }
                li.appendChild(line1);
                li.appendChild(line2);
                transactionList.prepend(li); // Prepend to maintain newest-first order
            });
            autoscrollTransactionList();
            console.log('Forced re-render of transactions:', pendingTransactions);
        } else {
            console.error('Transaction list not found for forced re-render');
        }
    }

    // DOM Elements for P2P Transfer Form
    const sendMoneyBtn = document.querySelector('.p2p-send-button');
    const cancelBtn = document.querySelector('.form-buttons .cancel-button');
    const requestBtn = document.querySelector('.request-button');
    const amountInput = document.querySelector('.amount-input');
    const peerSelect = document.querySelector('.peer-select');
    const noteInput = document.querySelector('.note-input');
    const confirmationPrompt = document.querySelector('#confirmation-prompt');
    const confirmationMessage = document.querySelector('#confirmation-message');
    const confirmButton = document.querySelector('.confirmation-prompt .confirm-button');
    const cancelPromptButton = document.querySelector('.confirmation-prompt .cancel-button');
    const transactionLog = document.querySelector('.transaction-log');
    const p2pToast = document.querySelector('#p2p-toast');
    const toastMessage = document.querySelector('#toast-message');
    const closeToast = document.querySelector('.close-toast');
    const requestPrompt = document.querySelector('#request-prompt');
    const requestMessage = document.querySelector('#request-message');
    const requestAmountInput = document.querySelector('.request-amount-input');
    const requestNoteInput = document.querySelector('.request-note-input');
    const requestConfirmButton = document.querySelector('.request-prompt .request-confirm-button');
    const requestCancelButton = document.querySelector('.request-prompt .request-cancel-button');

    // Setup P2P Transfer Form Event Listeners
    if (sendMoneyBtn && cancelBtn && requestBtn && amountInput && peerSelect && noteInput && confirmationPrompt && confirmationMessage && confirmButton && cancelPromptButton && transactionLog && p2pToast && toastMessage && closeToast && requestPrompt && requestMessage && requestAmountInput && requestNoteInput && requestConfirmButton && requestCancelButton) {
        // Send Money Button
        sendMoneyBtn.addEventListener('click', () => {
            console.log('Send Money button clicked');
            const amount = parseFloat(amountInput.value);
            const peer = peerSelect.value;

            if (isNaN(amount) || amount <= 0) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please enter a valid amount greater than 0.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            if (!peer) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please select a peer to send money to.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            confirmationMessage.textContent = `Are you sure you want to send $${amount}.00 to ${peer}?`;
            confirmationPrompt.classList.add('show');
            console.log('Confirmation prompt shown');
        });

        // Confirm Send Money
        confirmButton.addEventListener('click', () => {
            console.log('Confirm button clicked');
            const amount = parseFloat(amountInput.value);
            const peer = peerSelect.value;
            const note = noteInput.value.trim();

            confirmationPrompt.classList.remove('show');

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const transactionData = {
                userName: userName,
                peer: peer,
                amount: amount,
                timestamp: timestamp,
                note: note
            };

            socket.emit('sendMoney', transactionData);
            console.log('Emitted sendMoney:', transactionData);

            p2pToast.className = 'p2p-toast success';
            toastMessage.textContent = `💸 Successfully sent $${amount} to ${peer}!`;
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);

            amountInput.value = '';
            noteInput.value = '';
            console.log('Confirmation prompt hidden after confirm');
        });

        // Cancel Send Money Prompt
        cancelPromptButton.addEventListener('click', () => {
            console.log('Cancel prompt button clicked');
            confirmationPrompt.classList.remove('show');
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Transaction cancelled.';
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);
            console.log('Confirmation prompt hidden after cancel');
        });

        // Cancel Form
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            amountInput.value = '';
            noteInput.value = '';
            peerSelect.value = '';
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Form reset.';
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);
        });

        // Request Payment Button
        requestBtn.addEventListener('click', () => {
            console.log('Request Payment button clicked');
            const peer = peerSelect.value;

            if (!peer) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please select a peer to request payment from.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            requestMessage.textContent = `Request payment from ${peer}`;
            requestPrompt.classList.add('show');
            console.log('Request prompt shown');
        });

        // Confirm Request Payment
        requestConfirmButton.addEventListener('click', () => {
            console.log('Request Confirm button clicked');
            const amount = parseFloat(requestAmountInput.value);
            const note = requestNoteInput.value.trim();
            const peer = peerSelect.value;

            if (isNaN(amount) || amount <= 0) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please enter a valid amount greater than 0.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            requestPrompt.classList.remove('show');

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const requestData = {
                userName: userName,
                peer: peer,
                amount: amount,
                note: note,
                timestamp: timestamp
            };

            socket.emit('requestPayment', requestData);
            console.log('Emitted requestPayment:', requestData);

            p2pToast.className = 'p2p-toast request';
            toastMessage.textContent = `📩 Payment request of $${amount}.00 sent to ${peer}!`;
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);

            requestAmountInput.value = '';
            requestNoteInput.value = '';
            console.log('Request prompt hidden after confirm');
        });

        // Cancel Request Payment Prompt
        requestCancelButton.addEventListener('click', () => {
            console.log('Request Cancel button clicked');
            requestPrompt.classList.remove('show');
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Payment request cancelled.';
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);

            requestAmountInput.value = '';
            requestNoteInput.value = '';
            console.log('Request prompt hidden after cancel');
        });

        // Close Toast Notification
        closeToast.addEventListener('click', () => {
            p2pToast.classList.remove('show');
        });

        // Socket.io Event Listeners for P2P Transactions
        const debouncedLoadTransactions = debounce(loadTransactions, 500);

        socket.on('p2pTransactionHistory', (history) => {
            console.log('Received p2pTransactionHistory at:', new Date().toISOString(), history);
            transactions = history.slice(0, 3); // Limit to 3 most recent for preview
            pendingTransactions = history; // Store all transactions
            updateP2PPreview();
            debouncedLoadTransactions(history); // Load into main transaction list with debounce
        });

        socket.on('newP2PTransaction', (transaction) => {
            console.log('Received newP2PTransaction at:', new Date().toISOString(), transaction);
            if (!transaction) {
                console.error('Received invalid transaction data:', transaction);
                return;
            }
            // Skip if this transaction was added by the local client
            if (transaction.transactionId === lastLocalTransactionId) {
                console.log('Skipping local transaction:', transaction.transactionId);
                return;
            }
            // Check if the transaction already exists in pendingTransactions
            if (!pendingTransactions.some(t => t.transactionId === transaction.transactionId)) {
                transactions.unshift(transaction);
                if (transactions.length > 3) {
                    transactions.pop();
                }
                updateP2PPreview();
                // Add to pending transactions
                pendingTransactions.unshift(transaction);
                console.log('Updated pendingTransactions:', pendingTransactions);
                // Add to DOM if P2P tab is active
                const activeTab = document.querySelector('.tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'p2p') {
                    addTransactionToDOM(transaction);
                } else {
                    console.log('P2P tab not active, transaction will be added when tab is switched');
                }
            } else {
                console.log('Transaction already exists, skipping:', transaction.transactionId);
            }
        });

        socket.on('moneySent', (transactionData) => {
            console.log('Received moneySent event:', transactionData);
            if (transactionData.userName !== userName) {
                addTransaction('sent', transactionData.amount, transactionData.peer, transactionData.note);
            }

            if (transactionData.userName === userName) {
                p2pToast.className = 'p2p-toast success';
                toastMessage.textContent = `💸 Successfully sent $${transactionData.amount} to ${transactionData.peer}!`;
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
            }
        });

        socket.on('paymentRequested', (requestData) => {
            console.log('Received paymentRequested event:', requestData);
            if (requestData.userName !== userName) {
                addTransaction('requested', requestData.amount, requestData.peer, requestData.note);
            }

            if (requestData.peer === userName) {
                p2pToast.className = 'p2p-toast request';
                toastMessage.textContent = `📩 ${requestData.userName} requested $${requestData.amount}.00 from you!${requestData.note ? ` (Note: ${requestData.note})` : ''}`;
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
            }
        });
    } else {
        console.error('Send money elements not found in Active P2P Connections widget');
    }

    // Update tab switching to force re-render of transactions
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId === 'p2p') {
                setTimeout(forceRenderTransactions, 500);
            }
        });
    });
}

// Bot Chat Functionality
// Initializes the Bot Chat widget for automated support
function setupBotChat(socket) {
    const botChatBox = document.getElementById('bot-chat-box');
    const botUserInput = document.getElementById('bot-user-input');
    const botSendBtn = document.getElementById('bot-send-btn');

    let conversationState = 'initial';

    // Add initial bot message on page load
    addBotMessage('Welcome! This chat is for help and support. Hello! How can I assist you today?');

    function addBotMessage(content) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log('Timestamp:', timestamp);
        const message = document.createElement('div');
        message.classList.add('message', 'bot');
        message.innerHTML = `
            <span class="username">ByteBot</span>
            <span class="content">${content}</span>
            <span class="timestamp">[${timestamp}]</span>
        `;
        if (botChatBox) {
            botChatBox.appendChild(message);
            botChatBox.scrollTop = botChatBox.scrollHeight;
        } else {
            console.error('botChatBox not found');
        }
    }

    function addUserMessage(content) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log('Timestamp:', timestamp);
        const message = document.createElement('div');
        message.classList.add('message', 'user');
        message.innerHTML = `
            <span class="username">You</span>
            <span class="content">${content}</span>
            <span class="timestamp">[${timestamp}]</span>
        `;
        if (botChatBox) {
            botChatBox.appendChild(message);
            botChatBox.scrollTop = botChatBox.scrollHeight;
            console.log('Added user message and scrolled to bottom:', content);
        } else {
            console.error('botChatBox not found');
        }
    }

    function handleBotResponse(userMessage) {
        userMessage = userMessage.toLowerCase();
        let response = '';

        if (conversationState === 'initial') {
            if (userMessage.includes('password')) {
                response = 'To reset your password, go to Settings > Account > Reset Password. Does that help?';
                conversationState = 'password';
            } else if (userMessage.includes('support') || userMessage.includes('help')) {
                response = 'I can help with common issues, or you can contact support. What’s your question?';
                conversationState = 'support';
            } else {
                response = 'I’m not sure I understand. Can you ask about something specific, like password reset or support?';
            }
        } else if (conversationState === 'password') {
            if (userMessage.includes('yes')) {
                response = 'Great! If you need help with anything else, just ask.';
                conversationState = 'initial';
            } else {
                response = 'I’m sorry that didn’t help. Would you like to escalate to Live Chat or open a Ticket?';
                conversationState = 'escalate';
            }
        } else if (conversationState === 'support') {
            response = 'You can contact support via Live Chat or by opening a Ticket. Would you like to escalate to Live Chat or open a Ticket?';
            conversationState = 'escalate';
        } else if (conversationState === 'escalate') {
            if (userMessage.includes('live chat')) {
                response = 'Switching you to Live Chat...';
                setTimeout(() => switchTab('dashboard'), 1000);
            } else if (userMessage.includes('ticket')) {
                response = 'Opening a Ticket for you...';
                setTimeout(() => switchTab('dashboard'), 1000);
            } else {
                response = 'Please choose: Live Chat or Ticket?';
            }
        }

        setTimeout(() => addBotMessage(response), 500);
    }

    if (botSendBtn) {
        botSendBtn.addEventListener('click', () => {
            const message = botUserInput.value.trim();
            if (message) {
                addUserMessage(message);
                handleBotResponse(message);
                botUserInput.value = '';
            }
        });
    } else {
        console.error('botSendBtn not found');
    }

    if (botUserInput) {
        botUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                botSendBtn.click();
            }
        });
    } else {
        console.error('botUserInput not found');
    }
}

// View Buttons Setup
// Initializes buttons that navigate to other tabs (e.g., View All FAQs, View More P2P)
function setupViewButtons() {
    // View All FAQs Button
    const viewAllFaqsBtn = document.querySelector('.view-all-faqs');
    if (viewAllFaqsBtn) {
        viewAllFaqsBtn.addEventListener('click', () => {
            console.log('View All FAQs button clicked');
            const tabId = viewAllFaqsBtn.getAttribute('data-tab') || 'qna';
            switchTab(tabId);
            setTimeout(() => {
                const targetWidget = document.querySelector('#qna .qna-grid-container');
                if (targetWidget) {
                    targetWidget.scrollIntoView({ behavior: 'smooth' });
                    console.log('Scrolled to Frequently Asked Questions widget');
                } else {
                    console.error('Frequently Asked Questions widget not found in #qna');
                }
            }, 100);
        });
    } else {
        console.error('View All FAQs button not found');
    }

    // View More P2P Button
    const viewMoreP2PBtn = document.querySelector('.view-more-p2p');
    if (viewMoreP2PBtn) {
        viewMoreP2PBtn.addEventListener('click', () => {
            switchTab('p2p');
            setTimeout(() => {
                const targetWidget = document.querySelector('.active-p2p-connections .transaction-log');
                if (targetWidget) {
                    targetWidget.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        });
    } else {
        console.error('View More P2P button not found');
    }
}