// script.js

// Add event listener when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and script started');

    // Initialize socket.io
    const socket = io();
    console.log('Socket.io initialized');

    // Prompt for user name if not already set (use sessionStorage for tab-specific user names)
    let userName = sessionStorage.getItem('userName');
    if (!userName) {
        userName = prompt('Please enter your name:', 'User');
        if (!userName || userName.trim() === '') {
            userName = 'User'; // Default name if none provided
        }
        sessionStorage.setItem('userName', userName);
    }
    console.log('User name set to:', userName);

    // Tab Switching Functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentTabIndex = 0;

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
            targetContent.classList.add('active');
            targetContent.style.transform = 'translateX(0)';

            currentTabIndex = newTabIndex;
            console.log(`Switched to tab: ${tabId}`);
        });
    });

    // Chat functionality
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
    let isExpanded = false;
    let originalParent = null;
    let placeholder = null;

    // Verify elements exist
    console.log({
        chatBox: !!chatBox,
        userInput: !!userInput,
        sendBtn: !!sendBtn,
        emojiBtn: !!emojiBtn,
        attachBtn: !!attachBtn,
        fileInput: !!fileInput,
        themeToggle: !!themeToggle,
        contactSupport: !!contactSupport,
        readDocs: !!readDocs,
        refreshTips: !!refreshTips,
        resetSession: !!resetSession,
        clearCache: !!clearCache,
        reconnectNetwork: !!reconnectNetwork,
        purgeHistory: !!purgeHistory,
        emojiPicker: !!emojiPicker,
        expandButton: !!expandButton,
        closeButton: !!closeButton,
        overlay: !!overlay,
        dashboardContainer: !!dashboardContainer
    });

    // Toast Notification System
    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300); // Match the fade-out animation duration
        }, duration);
    }

    // Contact Support Button
    if (contactSupport) {
        contactSupport.addEventListener('click', () => {
            console.log('Contact support clicked');
            showToast('📩 This would open a direct support chat.');
        });
    } else {
        console.error('Contact support not found');
    }

    // Read Docs Button
    if (readDocs) {
        readDocs.addEventListener('click', () => {
            console.log('Read docs clicked');
            showToast('📚 Documentation coming soon.');
        });
    } else {
        console.error('Read docs not found');
    }

    // Quick Access Tools Buttons
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

    // Refresh Tips Button
    const tips = [
        "Use the 'Attach' button to share files in real time.",
        "Type /help in chat for a list of commands.",
        "You can double-click a message to edit it.",
        "Use keyboard shortcuts to speed up your support!"
    ];

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

    // Custom emoji picker setup with categories
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

    // Expand/Collapse Chat Functionality (Updated)
    const toggleChatExpansion = () => {
        console.log('toggleChatExpansion called, current isExpanded:', isExpanded);
        isExpanded = !isExpanded;
        const chatWindow = document.querySelector('.chat-window');
        console.log('Toggling chat expansion, new isExpanded:', isExpanded);

        // Log current styles before toggling
        const initialStyle = window.getComputedStyle(chatWindow);
        console.log('Initial width:', initialStyle.width);
        console.log('Initial height:', initialStyle.height);
        console.log('Initial position:', initialStyle.position);

        // Toggle the chat-expanded class
        chatWindow.classList.toggle('chat-expanded');

        if (isExpanded) {
                    // Store the original parent and create a placeholder
                    originalParent = chatWindow.parentNode;
                    placeholder = document.createElement('div');
                    placeholder.classList.add('chat-placeholder');
                    placeholder.style.width = initialStyle.width;
                    placeholder.style.height = initialStyle.height;
                    originalParent.insertBefore(placeholder, chatWindow);

                    // Move the chat window to the body
                    document.body.appendChild(chatWindow);

                    // Apply overlay and blur effects
                    overlay.classList.add('active');
                    dashboardContainer.classList.add('blurred');
                } else {
                    // Remove overlay and blur effects
                    overlay.classList.remove('active');
                    dashboardContainer.classList.remove('blurred');

                    // Clear inline styles to ensure the widget falls back to CSS Grid styles
                    chatWindow.style.width = '';
                    chatWindow.style.height = '';
                    chatWindow.style.position = '';
                    chatWindow.style.top = '';
                    chatWindow.style.left = '';
                    chatWindow.style.transform = '';
                    chatWindow.style.maxWidth = '';
                    chatWindow.style.maxHeight = '';
                    chatWindow.style.zIndex = '';

                    // Move the chat window back to its original position
                    if (originalParent && placeholder) {
                        originalParent.replaceChild(chatWindow, placeholder);
                        placeholder = null;
                        originalParent = null;
                    }
                }

        // Log classes after toggling
        console.log('Classes after toggle:', chatWindow.classList.toString());

        // Log computed styles to verify dimensions
        const computedStyle = window.getComputedStyle(chatWindow);
        console.log('Computed width:', computedStyle.width);
        console.log('Computed height:', computedStyle.height);
        console.log('Computed position:', computedStyle.position);
        console.log('Computed top:', computedStyle.top);
        console.log('Computed left:', computedStyle.left);
        console.log('Computed transform:', computedStyle.transform);
        console.log('Computed z-index:', computedStyle.zIndex);

        // Log overlay and dashboard state
        console.log('Overlay classList:', overlay.classList.toString());
        console.log('Dashboard container classList:', dashboardContainer.classList.toString());

        // Scroll to bottom when expanding/collapsing
        scrollToBottom();
        };

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

        // Attach event listeners with error handling
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                console.log('Send button clicked');
                socket.emit('stopTyping', { userName }); // Stop typing when message is sent
                sendMessage();
            });
        } else {
            console.error('Send button not found');
        }

        if (userInput) {
            let typingTimeout;
            let isTyping = false; // Track if the user is currently typing

            userInput.addEventListener('input', () => {
                // Only emit 'typing' if the user wasn't already typing
                if (!isTyping) {
                    console.log(`${userName} is typing...`);
                    socket.emit('typing', { userName });
                    isTyping = true;
                }

            // Clear the previous timeout and set a new one
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                console.log(`${userName} stopped typing.`);
                socket.emit('stopTyping', { userName });
                isTyping = false;
            }, 5000); // Wait 5 seconds after the last keystroke
        });

        userInput.addEventListener('keypress', (e) => {
            console.log('Key pressed:', e.key);
            if (e.key === 'Enter') {
                console.log(`${userName} stopped typing (message sent).`);
                socket.emit('stopTyping', { userName }); // Stop typing when message is sent
                isTyping = false;
                clearTimeout(typingTimeout); // Clear the timeout since the message was sent
                sendMessage();
            }
        });
    } else {
        console.error('User input not found');
    }

    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            console.log('Attach button clicked');
            fileInput.click();
        });
    } else {
        console.error('Attach button not found');
    }

    if (themeToggle) {
        // Get the stylesheet links
        const skeuomorphicTheme = document.getElementById('skeuomorphic-theme');
        const frostedTheme = document.getElementById('frosted-theme');
        
        // Track the current theme (start with skeuomorphic)
        let isSkeuomorphic = true;

        themeToggle.addEventListener('click', () => {
            console.log('Theme toggle clicked');
            if (isSkeuomorphic) {
                // Switch to frosted theme
                skeuomorphicTheme.disabled = true;
                frostedTheme.disabled = false;
                themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Skeuomorphic Theme';
                console.log('Switched to frosted theme');
            } else {
                // Switch to skeuomorphic theme
                skeuomorphicTheme.disabled = false;
                frostedTheme.disabled = true;
                themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Frosted Theme';
                console.log('Switched to skeuomorphic theme');
            }
            // Toggle the theme state
            isSkeuomorphic = !isSkeuomorphic;
            // Save the current theme to localStorage
            localStorage.setItem('theme', isSkeuomorphic ? 'skeuomorphic' : 'frosted');
        });

        // Load the saved theme from localStorage
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

    // Auto-scroll functionality for chat
    let isUserAtBottom = true;

    // Function to scroll to the bottom of the chat
    function scrollToBottom() {
        chatBox.scrollTop = 0; // Since flex-direction is column-reverse, scrollTop = 0 is the bottom
        console.log('Scrolled to bottom, scrollTop:', chatBox.scrollTop);
    }

    // Check if the user is at the bottom of the chat
    chatBox.addEventListener('scroll', () => {
        // With flex-direction: column-reverse, scrollTop = 0 means the user is at the bottom
        isUserAtBottom = chatBox.scrollTop === 0;
        console.log('Scroll event, isUserAtBottom:', isUserAtBottom, 'scrollTop:', chatBox.scrollTop);
    });

    function getTimestamp() {
        const now = new Date();
        return `[${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}]`;
    }

    function updateStatus(messageElement, status) {
        const statusSpan = messageElement.querySelector('.status');
        if (statusSpan) statusSpan.textContent = status;
    }

    // Handle file attachment
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                const timestamp = getTimestamp();
                const formData = new FormData();
                formData.append('file', file);

                // Upload the file to the server
                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                        console.log('Fetch response received:', response);
                        return response.json();
                    })
                    .then(data => {
                        console.log('Fetch data:', data);
                        if (!data.success) {
                            throw new Error(data.message || 'File upload failed');
                        }

                        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        const fileData = {
                            name: file.name,
                            path: data.filePath,
                            userName: userName,
                            timestamp: timestamp,
                            fileId: fileId
                        };

                        console.log('Emitting uploadFile event:', fileData);
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

    // Socket.io event listeners for chat
    socket.on('chatHistory', (history) => {
        console.log('Received chat history:', history);
        chatBox.innerHTML = '';
        history.forEach((msg, index) => {
            if (msg) { // Skip deleted messages
                const messageElement = createMessageElement(msg, index);
                chatBox.prepend(messageElement);
            }
        });
        scrollToBottom();
    });

    // Helper function to create a message element with edit/delete buttons
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

    socket.on('messageEdited', ({ messageId, newContent }) => {
        console.log('Message edited:', messageId, newContent);
        const messageElement = chatBox.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const contentSpan = messageElement.querySelector('.content');
            contentSpan.textContent = newContent;
        }
    });

    socket.on('messageDeleted', (messageId) => {
        console.log('Message deleted:', messageId);
        const messageElement = chatBox.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });

    // Handle typing indicator
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
        // Check if there's an existing typing indicator
        let typingIndicator = chatBox.querySelector('.typing-indicator');

        if (typingUsers.size > 0) {
            const typingText = Array.from(typingUsers).join(', ') + (typingUsers.size === 1 ? ' is typing...' : ' are typing...');
            
            if (typingIndicator) {
                // Update the existing indicator's text
                typingIndicator.querySelector('.content').textContent = typingText;
            } else {
                // Create a new typing indicator
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
            // Remove the typing indicator if no users are typing
            if (typingIndicator) {
                typingIndicator.remove();
                console.log('Removed typing indicator');
            }
        }

        if (isUserAtBottom) {
            scrollToBottom();
        }
    }

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

    function getBotResponse(userMessage) {
        if (!userMessage) return `Hello! How can I assist you today, ${userName}?`;
        userMessage = userMessage.toLowerCase();
        if (userMessage.includes('help')) return "I'm here to assist! What do you need help with?";
        if (userMessage.includes('time')) return `The current time is ${new Date().toLocaleTimeString()}.`;
        if (userMessage.includes('thanks')) return "You're welcome! 😊";
        return `Hello! How can I assist you today, ${userName}?`;
    }


    // Chat Support 2: Update Progress Bar
    const ticketsInQueue = 5;
    const ticketsResolved = 3;
    const totalTickets = ticketsInQueue + ticketsResolved;
    const progressPercent = (ticketsResolved / totalTickets) * 100;

    const ticketsInQueueElement = document.getElementById('tickets-in-queue');
    const ticketsResolvedElement = document.getElementById('tickets-resolved');
    const progressBar = document.getElementById('progress-bar');

    if (ticketsInQueueElement && ticketsResolvedElement && progressBar) {
        ticketsInQueueElement.textContent = ticketsInQueue;
        ticketsResolvedElement.textContent = ticketsResolved;
        progressBar.style.width = `${progressPercent}%`;
        progressBar.textContent = `${Math.round(progressPercent)}% Resolved`;
    }

    // Ticket Status Overview: Update Ticket Counts
    const openTicketsElement = document.getElementById('open-tickets');
    const resolvedTicketsElement = document.getElementById('resolved-tickets');

    if (openTicketsElement && resolvedTicketsElement) {
        openTicketsElement.textContent = ticketsInQueue;
        resolvedTicketsElement.textContent = ticketsResolved;
    }

    // Support Metrics: Circle Graph
    const circle1 = document.getElementById('circle-1');
    const circle2 = document.getElementById('circle-2');
    const circle3 = document.getElementById('circle-3');

    const metrics = {
        resolutionRate: 75, // Percentage
        responseTime: 62.5, // Percentage
        satisfactionRate: 50 // Percentage
    };

    if (circle1 && circle2 && circle3) {
        circle1.style.setProperty('--percent', `${metrics.resolutionRate}%`);
        circle1.querySelector('.circle-label').textContent = `${metrics.resolutionRate}%`;
        
        circle2.style.setProperty('--percent', `${metrics.responseTime}%`);
        circle2.querySelector('.circle-label').textContent = `${metrics.responseTime}%`;
        
        circle3.style.setProperty('--percent', `${metrics.satisfactionRate}%`);
        circle3.querySelector('.circle-label').textContent = `${metrics.satisfactionRate}%`;
    }

    // Knowledge Base: FAQ Toggle
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    // Chatbot Support: Personality Toggle
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const personality = option.getAttribute('data-personality');
            console.log(`Chatbot personality set to: ${personality}`);
            // Add logic to update chatbot responses based on personality (future task)
        });
    });

    // Support Analytics: Add Response Time Data
    const responseTimes = [40, 50, 30, 60, 45, 55, 35]; // Mock data in minutes
    const bars = document.querySelectorAll('.response-time-graph .bar');
    bars.forEach((bar, index) => {
        bar.style.setProperty('--bar-height', `${responseTimes[index]}%`);
        bar.textContent = `${responseTimes[index]} min`;
    });

    // Data Transfer Rate Graph for P2P Tab
    const transferRateBars = document.querySelectorAll('.transfer-rate-graph .bar');
    const transferRates = [60, 40, 80]; // Mock data for transfer rates
    transferRateBars.forEach((bar, index) => {
        bar.style.setProperty('--bar-height', `${transferRates[index]}px`);
    });

    // System Updates: Mock Feed (already static in HTML, can be made dynamic later)
    const updates = [
        { time: "12:00 PM", message: "System restart scheduled at 2PM." },
        { time: "11:30 AM", message: "Login issue resolved." },
        { time: "10:15 AM", message: "New feature deployed: Emoji Picker." }
    ];
    const updateFeed = document.querySelector('.update-feed');
    if (updateFeed) {
        updateFeed.innerHTML = '';
        updates.forEach(update => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${update.time}:</strong> ${update.message}`;
            updateFeed.appendChild(p);
        });
    }

    // Chat Support: Ticket Search
    const ticketSearch = document.getElementById('ticket-search');
    const ticketList = document.querySelector('.ticket-list');
    const tickets = [
        { id: "123", title: "Login Issue" },
        { id: "124", title: "Payment Error" }
    ];

    if (ticketSearch && ticketList) {
        ticketSearch.addEventListener('input', () => {
            const searchTerm = ticketSearch.value.toLowerCase();
            ticketList.innerHTML = '';
            tickets.forEach(ticket => {
                if (ticket.id.includes(searchTerm)) {
                    const p = document.createElement('p');
                    p.innerHTML = `Ticket #${ticket.id}: ${ticket.title} - <a href="#">View</a>`;
                    ticketList.appendChild(p);
                }
            });
        });
    }

    // Add fade-in effect after content is loaded
    window.addEventListener('load', () => {
        console.log('Window loaded, adding fade class');
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            setTimeout(() => {
                dashboardContainer.classList.add('fade');
                console.log('Fade class added to dashboard-container');
            }, 100); // Small delay to ensure content is rendered
        } else {
            console.error('Dashboard container not found for fade effect');
        }
    });

    // Q&A and P2P Q&A Card Flip Functionality
    const qnaCards = document.querySelectorAll('.qna-card, .p2p-qna-card');
    qnaCards.forEach(card => {
        card.addEventListener('click', () => {
            // Toggle the flipped class on the clicked card
            card.classList.toggle('flipped');
        });
    });

    // Updated Send Money Functionality for Active P2P Connections Widget in P2P Tab
    // Function to add a transaction to the list
    function addTransaction(type, amount, peer, note) {
        const transactionList = document.querySelector('.transaction-log ul#transaction-list');
        if (transactionList) {
            const li = document.createElement('li');
            li.classList.add(type);

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const user = 'User'; // Replace with actual user name if available
            const line1 = document.createElement('span');
            line1.classList.add('transaction-line-1');
            const line2 = document.createElement('span');
            line2.classList.add('transaction-line-2');

            if (type === 'sent') {
                line1.textContent = `${user} sent $${amount} to ${peer} at ${time}`;
                line2.textContent = `$${amount} sent to ${peer} – ${time}${note ? ` (Note: ${note})` : ''}`;
            } else if (type === 'requested') {
                line1.textContent
                line2.textContent = `$${amount} requested from ${peer} – ${time}${note ? ` (Note: ${note})` : ''}`;
            }

            li.appendChild(line1);
            li.appendChild(line2);
            console.log('LI element after appending lines:', li);

            // Prepend the new transaction to the top of the list
            transactionList.prepend(li);
            console.log('Transaction prepended to list:', li);
            console.log('First transaction in list after prepend:', transactionList.children[0]?.textContent);
            console.log('Last transaction in list after prepend:', transactionList.children[transactionList.children.length - 1]?.textContent);

            // Autoscroll to the top
            autoscrollTransactionList();
        } else {
            console.error('Transaction list not found');
        }
    }   // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
               
    // Function to autoscroll the transaction list to the top (latest transaction)
    function autoscrollTransactionList() {
        const transactionList = document.querySelector('.transaction-log ul#transaction-list');
        if (transactionList) {
            console.log('autoscrollTransactionList called');
            // Wait for the DOM to update by adding a slight delay
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
                                top: 0, // Scroll to the top (newest transaction)
                                behavior: 'smooth'
                            });
                            console.log('Autoscrolled to top, scrollTop after:', transactionList.scrollTop);
                        } else {
                            console.log('No scroll needed, content fits within clientHeight');
                        }

                        // Double-check the scroll position after another delay
                        setTimeout(() => {
                            console.log('Final scrollTop check:', transactionList.scrollTop);
                            console.log('Visible transaction at top:', transactionList.children[0]?.textContent);
                        }, 500);
                    });
                });
            }, 100); // Slight delay to ensure DOM updates
        } else {
            console.error('Transaction list not found for autoscroll');
        }
    }

    // Update the event listeners to pass the transaction data object
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

    // Check if all elements are found
    if (sendMoneyBtn && cancelBtn && requestBtn && amountInput && peerSelect && noteInput && confirmationPrompt && confirmationMessage && confirmButton && cancelPromptButton && transactionLog && p2pToast && toastMessage && closeToast && requestPrompt && requestMessage && requestAmountInput && requestNoteInput && requestConfirmButton && requestCancelButton) {
        // Send Money button functionality
        sendMoneyBtn.addEventListener('click', () => {
            console.log('Send Money button clicked');
            const amount = parseFloat(amountInput.value);
            const peer = peerSelect.value;

            if (isNaN(amount) || amount <= 0) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please enter a valid amount greater than 0.';
                p2pToast.classList.add('show');
                setTimeout(() => {
                    p2pToast.classList.remove('show');
                }, 3000);
                return;
            }

            if (!peer) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please select a peer to send money to.';
                p2pToast.classList.add('show');
                setTimeout(() => {
                    p2pToast.classList.remove('show');
                }, 3000);
                return;
            }

            confirmationMessage.textContent = `Are you sure you want to send $${amount}.00 to ${peer}?`;
            confirmationPrompt.classList.add('show');
            console.log('Confirmation prompt shown');
        });

        // Confirm the transaction
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

            // Emit the transaction to the server
            socket.emit('sendMoney', transactionData);

            // Show success toast
            p2pToast.className = 'p2p-toast success';
            toastMessage.textContent = `💸 $${amount}.00 sent to ${peer} successfully!`;
            p2pToast.classList.add('show');
            setTimeout(() => {
                p2pToast.classList.remove('show');
            }, 3000);

            // Add to transaction log locally for the sender
            addTransaction('sent', amount, peer, note);

            // Clear the inputs
            amountInput.value = '';
            noteInput.value = '';
            console.log('Confirmation prompt hidden after confirm');
        });

        // Cancel the transaction from the confirmation prompt
        cancelPromptButton.addEventListener('click', () => {
            console.log('Cancel prompt button clicked');
            confirmationPrompt.classList.remove('show');
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Transaction cancelled.';
            p2pToast.classList.add('show');
            setTimeout(() => {
                p2pToast.classList.remove('show');
            }, 3000);
            console.log('Confirmation prompt hidden after cancel');
        });

        // Cancel button functionality (resets the form)
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            amountInput.value = '';
            noteInput.value = '';
            peerSelect.value = '';
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Form reset.';
            p2pToast.classList.add('show');
            setTimeout(() => {
                p2pToast.classList.remove('show');
            }, 3000);
        });

        // Request Payment button functionality
        requestBtn.addEventListener('click', () => {
            console.log('Request Payment button clicked');
            const peer = peerSelect.value;

            if (!peer) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please select a peer to request payment from.';
                p2pToast.classList.add('show');
                setTimeout(() => {
                    p2pToast.classList.remove('show');
                }, 3000);
                return;
            }

            requestMessage.textContent = `Request payment from ${peer}`;
            requestPrompt.classList.add('show');
            console.log('Request prompt shown');
        });

        // Confirm the payment request
        requestConfirmButton.addEventListener('click', () => {
            console.log('Request Confirm button clicked');
            const amount = parseFloat(requestAmountInput.value);
            const note = requestNoteInput.value.trim();
            const peer = peerSelect.value;

            if (isNaN(amount) || amount <= 0) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please enter a valid amount greater than 0.';
                p2pToast.classList.add('show');
                setTimeout(() => {
                    p2pToast.classList.remove('show');
                }, 3000);
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

            // Emit the payment request to the server
            socket.emit('requestPayment', requestData);

            // Show success toast
            p2pToast.className = 'p2p-toast request';
            toastMessage.textContent = `📩 Payment request of $${amount}.00 sent to ${peer}!`;
            p2pToast.classList.add('show');
            setTimeout(() => {
                p2pToast.classList.remove('show');
            }, 3000);

            // Add to transaction log locally for the requester
            addTransaction('requested', amount, peer, note);

            // Clear the inputs
            requestAmountInput.value = '';
            requestNoteInput.value = '';
            console.log('Request promptA hidden after confirm');
        });

        // Cancel the payment request
        requestCancelButton.addEventListener('click', () => {
            console.log('Request Cancel button clicked');
            requestPrompt.classList.remove('show');
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Payment request cancelled.';
            p2pToast.classList.add('show');
            setTimeout(() => {
                p2pToast.classList.remove('show');
            }, 3000);

            // Clear the inputs
            requestAmountInput.value = '';
            requestNoteInput.value = '';
            console.log('Request prompt hidden after cancel');
        });

        // Close toast manually
        closeToast.addEventListener('click', () => {
            p2pToast.classList.remove('show');
        });

        // Handle incoming transactions
        socket.on('moneySent', (transactionData) => {
            console.log('Received moneySent event:', transactionData);
            // Only add the transaction if the current user is not the sender
            if (transactionData.userName !== userName) {
                addTransaction('sent', transactionData.amount, transactionData.peer, transactionData.note);
            }

            // Show toast notification to the sender
            if (transactionData.userName === userName) {
                p2pToast.className = 'p2p-toast success';
                toastMessage.textContent = `💸 Successfully sent $${transactionData.amount} to ${transactionData.peer}!`;
                p2pToast.classList.add('show');
                setTimeout(() => {
                    p2pToast.classList.remove('show');
                }, 3000);
            }
        });

        // Handle incoming payment requests
        socket.on('paymentRequested', (requestData) => {
            console.log('Received paymentRequested event:', requestData);
            // Only add the transaction if the current user is not the requester
            if (requestData.userName !== userName) {
                addTransaction('requested', requestData.amount, requestData.peer, requestData.note);
            }

            // Show toast notification to the recipient
            if (requestData.peer === userName) {
                p2pToast.className = 'p2p-toast request';
                toastMessage.textContent = `📩 ${requestData.userName} requested $${requestData.amount}.00 from you!${requestData.note ? ` (Note: ${requestData.note})` : ''}`;
                p2pToast.classList.add('show');
                setTimeout(() => {
                    p2pToast.classList.remove('show');
                }, 3000);
            }
        });
    } else {
        console.error('Send money elements not found in Active P2P Connections widget');
    }
}); // Close the DOMContentLoaded event listener

// Optional: Uncomment the following code to reintroduce the `isUserNearTop` functionality
/*
    // Track if the user is near the top of the transaction list
    let isUserNearTop = true;

    const transactionList = document.querySelector('.transaction-log ul#transaction-list');
    if (transactionList) {
        transactionList.addEventListener('scroll', () => {
            // Consider the user "near the top" if they're within 50 pixels of the top
            isUserNearTop = transactionList.scrollTop <= 50;
            console.log('Scroll event, isUserNearTop:', isUserNearTop, 'scrollTop:', transactionList.scrollTop, 'scrollHeight:', transactionList.scrollHeight, 'clientHeight:', transactionList.clientHeight);
        });
    }

    // Function to autoscroll the transaction list to the top (latest transaction)
    function autoscrollTransactionList() {
        const transactionList = document.querySelector('.transaction-log ul#transaction-list');
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
                            if (isUserNearTop) {
                                transactionList.scrollTo({
                                    top: 0, // Scroll to the top (newest transaction)
                                    behavior: 'smooth'
                                });
                                console.log('Autoscrolled to top, scrollTop after:', transactionList.scrollTop);
                            } else {
                                console.log('User is not near the top, skipping autoscroll. scrollTop:', transactionList.scrollTop);
                            }
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
*/