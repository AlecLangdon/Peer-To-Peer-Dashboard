// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (HTML, CSS, JS, and uploaded files)
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up file upload with multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ success: true, filePath });
});

// Load messages from messages.json or initialize an empty array
let messages = [];
const messagesFilePath = path.join(__dirname, 'messages.json');
if (fs.existsSync(messagesFilePath)) {
    try {
        const data = fs.readFileSync(messagesFilePath, 'utf8');
        messages = JSON.parse(data);
        console.log('Loaded messages from messages.json:', messages);
    } catch (err) {
        console.error('Error loading messages from messages.json:', err);
        messages = [];
    }
}

// Function to save messages to messages.json
function saveMessages() {
    try {
        fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');
        console.log('Messages saved to messages.json');
    } catch (err) {
        console.error('Error saving messages to messages.json:', err);
    }
}

// Load transfers from transfers.json or initialize an empty array
let transfers = [];
const transfersFilePath = path.join(__dirname, 'transfers.json');
if (fs.existsSync(transfersFilePath)) {
    try {
        const data = fs.readFileSync(transfersFilePath, 'utf8');
        transfers = JSON.parse(data);
        console.log('Loaded transfers from transfers.json:', transfers);
    } catch (err) {
        console.error('Error loading transfers from transfers.json:', err);
        transfers = [];
    }
} else {
    // Create transfers.json if it doesn't exist
    fs.writeFileSync(transfersFilePath, JSON.stringify([]));
    console.log('Created transfers.json');
}

// Function to save transfers to transfers.json
function saveTransfers() {
    try {
        fs.writeFileSync(transfersFilePath, JSON.stringify(transfers, null, 2), 'utf8');
        console.log('Transfers saved to transfers.json:', transfers);
    } catch (err) {
        console.error('Error saving transfers to transfers.json:', err);
    }
}

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send existing messages to the new user
    socket.emit('chatHistory', messages);

    // Send existing transfers to the new user
    socket.emit('p2pTransactionHistory', transfers);
    console.log('Sent p2pTransactionHistory to client:', transfers);

    // Handle new messages
    socket.on('sendMessage', (messageData) => {
        const messageId = messages.length;
        messages.push(messageData);
        saveMessages(); // Save messages to file
        io.emit('message', messageData, messageId);
        console.log('Message received and broadcasted:', messageData, 'Message ID:', messageId);
    });

    // Handle file uploads
    socket.on('uploadFile', (fileData) => {
        console.log('Received uploadFile event:', fileData);
        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileMessage = {
            type: 'file',
            userName: fileData.userName,
            content: {
                fileId: fileId,
                fileName: fileData.name,
                filePath: fileData.path,
                isImage: fileData.name.match(/\.(jpg|jpeg|png|gif)$/i) !== null
            },
            timestamp: fileData.timestamp,
            status: 'Sent'
        };
        const messageId = messages.length;
        messages.push(fileMessage);
        saveMessages(); // Save messages to file
        io.emit('message', fileMessage, messageId);
        console.log('File message stored and broadcasted:', fileMessage, 'Message ID:', messageId);
    });

    // Handle message editing
    socket.on('editMessage', ({ messageId, newContent }) => {
        if (messages[messageId] && messages[messageId].type !== 'file') {
            messages[messageId].content = newContent;
            saveMessages(); // Save messages to file
            io.emit('messageEdited', { messageId, newContent });
            console.log('Message edited:', messageId, newContent);
        }
    });

    // Handle message deletion
    socket.on('deleteMessage', ({ messageId }) => {
        if (messages[messageId]) {
            messages[messageId] = null;
            saveMessages(); // Save messages to file
            io.emit('messageDeleted', messageId);
            console.log('Message deleted:', messageId);
        }
    });

    // Handle typing events
    socket.on('typing', (data) => {
        socket.broadcast.emit('userTyping', data);
        console.log(`${data.userName} is typing...`);
    });

    socket.on('stopTyping', (data) => {
        socket.broadcast.emit('userStoppedTyping', data);
        console.log(`${data.userName} stopped typing.`);
    });

    // Handle mock send money transactions
    socket.on('sendMoney', (transactionData) => {
        console.log('Received sendMoney event:', transactionData);
        const transaction = {
            type: 'sent',
            userName: transactionData.userName,
            peer: transactionData.peer,
            amount: transactionData.amount,
            timestamp: transactionData.timestamp,
            note: transactionData.note
        };
        transfers.push(transaction);
        saveTransfers(); // Save transfers to file
        io.emit('moneySent', transactionData);
        console.log('Emitted moneySent:', transactionData);
        io.emit('newP2PTransaction', transaction);
        console.log('Emitted newP2PTransaction:', transaction);
    });

    // Handle payment requests
    socket.on('requestPayment', (requestData) => {
        console.log('Received requestPayment event:', requestData);
        const transaction = {
            type: 'requested',
            userName: requestData.userName,
            peer: requestData.peer,
            amount: requestData.amount,
            timestamp: requestData.timestamp,
            note: requestData.note
        };
        transfers.push(transaction);
        saveTransfers(); // Save transfers to file
        io.emit('paymentRequested', requestData);
        console.log('Emitted paymentRequested:', requestData);
        io.emit('newP2PTransaction', transaction);
        console.log('Emitted newP2PTransaction:', transaction);
    });

    // Handle request for P2P transaction history
    socket.on('requestP2PTransactionHistory', () => {
        console.log('Received requestP2PTransactionHistory from:', socket.id);
        socket.emit('p2pTransactionHistory', transfers);
        console.log('Emitted p2pTransactionHistory:', transfers);
    });

    // Handle adding P2P transactions (used by addTransaction in script.js)
    socket.on('addP2PTransaction', (transaction) => {
        console.log('Received addP2PTransaction:', transaction);
        transfers.push(transaction);
        saveTransfers();
        io.emit('newP2PTransaction', transaction);
        console.log('Emitted newP2PTransaction:', transaction);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});