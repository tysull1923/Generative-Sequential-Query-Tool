// server/index.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bodyParser = require('body-parser');
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';


// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Increase payload size limit
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Chat Schema
const chatSchema = new mongoose.Schema({
  title: String,
  type: String,
  settings: {
    temperature: Number,
    chatType: String,
    systemContext: String,
    savingParams: {
      saveToApplication: Boolean,
      saveToFile: Boolean,
      summary: String
    }
  },
  messages: [{
    id: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, default: '' },
    status: { type: String, required: true },
    response: {
      provider: { type: String },
      content: { type: String, default: '' }
    },
    number: { type: Number, required: true }
  }],
  executionStatus: String,
  lastModified: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Create the Chat model
const Chat = mongoose.model('Chat', chatSchema);

// MongoDB Connection with better settings
console.log('Attempting to connect to MongoDB...');

mongoose.connect('mongodb://127.0.0.1:27017/gsqt_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4, skip trying IPv6
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1); // Exit if can't connect to database
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.post('/api/chats', async (req, res) => {
  try {
    console.log('Creating new chat...');
    const chatData = req.body;
    console.log('Received data:', JSON.stringify(chatData, null, 2));
    
    const newChat = new Chat(chatData);
    const savedChat = await newChat.save();
    
    console.log('Chat saved successfully with ID:', savedChat._id);
    res.status(201).json(savedChat);
  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/chats/:id', async (req, res) => {
  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedChat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: err.message,
    details: err.toString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});

// const app = express();
// const PORT = 5000;

// // Chat Schema for MongoDB
// const chatSchema = new mongoose.Schema({
//   title: String,
//   type: String,
//   settings: {
//     temperature: Number,
//     chatType: String,
//     systemContext: String,
//     savingParams: {
//       saveToApplication: Boolean,
//       saveToFile: Boolean,
//       summary: String
//     }
//   },
//   messages: [{
//     id: { type: String, required: true },
//     role: { type: String, required: true },
//     type: { type: String, required: true },
//     content: { type: String, default: '' },
//     status: { type: String, required: true },
//     response: {
//       provider: { type: String },
//       content: { type: String, default: '' }
//     },
//     number: { type: Number, required: true }
//   }],
//   executionStatus: String,
//   lastModified: { type: Date, default: Date.now },
//   createdAt: { type: Date, default: Date.now }
// });
// // Create the Chat model
// const Chat = mongoose.model('Chat', chatSchema);

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Database connection with logging
// console.log('Attempting to connect to MongoDB...');
// mongoose.connect('mongodb://localhost:27017/gsqt_db', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => {
//   console.log('Successfully connected to MongoDB.');
// })
// .catch((error) => {
//   console.error('MongoDB connection error:', error);
// });

// // Debug middleware to log requests
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path}`, req.body);
//   next();
// });

// // Routes
// app.post('/api/chats', async (req, res) => {
//   try {
//     console.log('Creating new chat:', req.body);
//     const newChat = new Chat(req.body);
//     const savedChat = await newChat.save();
//     console.log('Chat saved successfully:', savedChat._id);
//     res.status(201).json(savedChat);
//   } catch (error) {
//     console.error('Error creating chat:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/chats', async (req, res) => {
//   try {
//     console.log('Fetching all chats');
//     const chats = await Chat.find().sort({ createdAt: -1 });
//     console.log(`Found ${chats.length} chats`);
//     res.json(chats);
//   } catch (error) {
//     console.error('Error fetching chats:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/chats/:id', async (req, res) => {
//   try {
//     console.log('Fetching chat:', req.params.id);
//     const chat = await Chat.findById(req.params.id);
//     if (!chat) {
//       console.log('Chat not found:', req.params.id);
//       return res.status(404).json({ error: 'Chat not found' });
//     }
//     console.log('Chat found:', chat._id);
//     res.json(chat);
//   } catch (error) {
//     console.error('Error fetching chat:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// app.put('/api/chats/:id', async (req, res) => {
//   try {
//     console.log('Updating chat:', req.params.id);
//     const updatedChat = await Chat.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );
//     if (!updatedChat) {
//       console.log('Chat not found for update:', req.params.id);
//       return res.status(404).json({ error: 'Chat not found' });
//     }
//     console.log('Chat updated successfully:', updatedChat._id);
//     res.json(updatedChat);
//   } catch (error) {
//     console.error('Error updating chat:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`API endpoint: http://localhost:${PORT}/api`);
// });

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Database connection
// mongoose.connect('mongodb://localhost:27017/gsqt_db')
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Chat routes
// app.get('/api/chats', async (req, res) => {
//   try {
//     const chats = await Chat.find().sort({ createdAt: -1 });
//     res.json(chats);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/chats', async (req, res) => {
//   try {
//     const newChat = new Chat(req.body);
//     await newChat.save();
//     res.status(201).json(newChat);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/chats/:id', async (req, res) => {
//   try {
//     const chat = await Chat.findById(req.params.id);
//     if (!chat) {
//       return res.status(404).json({ error: 'Chat not found' });
//     }
//     res.json(chat);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });