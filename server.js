const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000', 'file://'],
    credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Message Schema
const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        console.log(`📨 Found ${messages.length} messages in database`);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Create new message
app.post('/api/messages', async (req, res) => {
    console.log("📩 Received message request:", req.body);
    
    try {
        const { name, email, message } = req.body;
        
        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: 'All fields are required',
                received: { name, email, message }
            });
        }

        const newMessage = new Message({ 
            name: name.trim(), 
            email: email.trim(), 
            message: message.trim() 
        });
        
        const savedMessage = await newMessage.save();
        console.log('💾 Message saved to MongoDB:', savedMessage._id);
        
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('❌ Error saving message to MongoDB:', error);
        res.status(500).json({ 
            error: 'Failed to save message to database',
            details: error.message 
        });
    }
});

// Delete all messages
app.delete('/api/messages', async (req, res) => {
    try {
        const result = await Message.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} messages from database`);
        res.json({ 
            message: 'All messages deleted successfully', 
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error('Error deleting messages:', error);
        res.status(500).json({ error: 'Failed to delete messages' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Message API: http://localhost:${PORT}/api/messages`);
    console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 CORS enabled for local development`);
});
