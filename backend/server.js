require("dotenv").config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const PORT = 4000 || process.env.PORT;
const connectDB = require('./config/connectDB');
const authRoutes = require('./routes/auth.route');
const projectRoutes = require('./routes/project.route');
const jobRoutes = require('./routes/job.route');
const applicationRoutes = require('./routes/application.route');
const aiRoutes = require('./routes/ai.route');
const profileRoutes = require('./routes/profile.route');
const usersRoutes = require('./routes/users.route');
const notificationRoutes = require('./routes/notification.route');

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Handle user joining with their ID
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${userId} joined with socket ${socket.id}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`👋 User ${socket.userId} disconnected`);
    }
  });
});

// Make io available globally
global.io = io;
global.connectedUsers = connectedUsers;

// middleware
app.use(cors());
app.use(express.json());

// Serve static files (uploaded files)
app.use('/uploads', express.static('uploads'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Hello World');
})

connectDB().then(() => {
  server.listen(PORT, () => { 
    console.log(`🚀 Server is running on port http://localhost:${PORT}`)
    console.log(`📡 Socket.io server ready for real-time notifications`)
  })
}).catch((error) => { console.log(error)});