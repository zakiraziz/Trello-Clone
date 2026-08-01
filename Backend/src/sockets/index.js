/**
 * Socket.io setup for real-time features.
 * Handles online user tracking, real-time board updates, 
 * and notification broadcasting.
 */
const jwt = require('jsonwebtoken');

// In-memory rate limiter for Socket.io events
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_EVENTS = 10;

// Track online users per board
const boardRooms = new Map(); // boardId -> Set of socket IDs
const userSockets = new Map(); // userId -> Set of socket IDs
const socketUsers = new Map(); // socketId -> userId

const socketRateLimiter = (socket, next) => {
  const ip = socket.handshake.address || socket.handshake.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return next();
  }
  
  const entry = rateLimitMap.get(ip);
  if (now - entry.startTime < RATE_LIMIT_WINDOW_MS) {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_EVENTS) {
      console.warn(`Rate limit exceeded for socket ${socket.id} (IP: ${ip})`);
      return next(new Error('Rate limit exceeded. Please slow down.'));
    }
  } else {
    rateLimitMap.set(ip, { count: 1, startTime: now });
  }
  
  next();
};

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS * 60) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = (io) => {
  // Apply rate limiter middleware
  io.use(socketRateLimiter);

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userName = decoded.name;
        socket.userEmail = decoded.email;
      } catch (err) {
        // Allow unauthenticated connections but with limited functionality
        console.warn(`Socket ${socket.id} connected without valid auth`);
      }
    }
    next();
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id, socket.userId ? `(user: ${socket.userId})` : '(anonymous)');

    // Track user connections
    if (socket.userId) {
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, new Set());
      }
      userSockets.get(socket.userId).add(socket.id);
      socketUsers.set(socket.id, socket.userId);
      
      // Broadcast online status
      io.emit('userOnline', { userId: socket.userId, online: true });
    }

    // Join a room based on boardId
    socket.on('joinBoard', ({ boardId }) => {
      if (!boardId) return;
      socket.join(`board:${boardId}`);
      
      // Track online users for this board
      if (!boardRooms.has(boardId)) {
        boardRooms.set(boardId, new Set());
      }
      boardRooms.get(boardId).add(socket.id);
      
      // Broadcast updated count to all in room
      const count = boardRooms.get(boardId).size;
      io.to(`board:${boardId}`).emit('online-users', { boardId, count });
    });

    // Leave a room
    socket.on('leaveBoard', ({ boardId }) => {
      if (!boardId) return;
      socket.leave(`board:${boardId}`);
      
      if (boardRooms.has(boardId)) {
        boardRooms.get(boardId).delete(socket.id);
        const count = boardRooms.get(boardId).size;
        io.to(`board:${boardId}`).emit('online-users', { boardId, count });
      }
    });

    // Handle board updates (forwarded from API routes)
    socket.on('boardUpdate', (data) => {
      if (!data.boardId) return;
      socket.to(`board:${data.boardId}`).emit('boardUpdated', {
        ...data,
        userId: socket.userId
      });
    });

    // Handle list updates
    socket.on('listUpdate', (data) => {
      if (!data.boardId) return;
      socket.to(`board:${data.boardId}`).emit('listUpdated', {
        ...data,
        userId: socket.userId
      });
    });

    // Handle card updates
    socket.on('cardUpdate', (data) => {
      if (!data.boardId) return;
      socket.to(`board:${data.boardId}`).emit('cardUpdated', {
        ...data,
        userId: socket.userId
      });
    });

    // Handle comment updates
    socket.on('commentUpdate', (data) => {
      if (!data.boardId) return;
      socket.to(`board:${data.boardId}`).emit('commentUpdated', {
        ...data,
        userId: socket.userId
      });
    });

    // Handle typing indicator
    socket.on('typing', ({ boardId, isTyping }) => {
      if (!boardId) return;
      socket.to(`board:${boardId}`).emit('userTyping', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, reason);
      
      // Clean up user tracking
      if (socket.userId) {
        const userSockSet = userSockets.get(socket.userId);
        if (userSockSet) {
          userSockSet.delete(socket.id);
          if (userSockSet.size === 0) {
            userSockets.delete(socket.userId);
            io.emit('userOnline', { userId: socket.userId, online: false });
          }
        }
        socketUsers.delete(socket.id);
      }
      
      // Clean up from all board rooms
      boardRooms.forEach((sockets, boardId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          const count = sockets.size;
          io.to(`board:${boardId}`).emit('online-users', { boardId, count });
        }
      });
    });
  });

  // Helper functions for server-side broadcasting
  io.broadcastToBoard = (boardId, event, data) => {
    io.to(`board:${boardId}`).emit(event, data);
  };

  io.broadcastToUser = (userId, event, data) => {
    const userSocketsSet = userSockets.get(userId);
    if (userSocketsSet) {
      userSocketsSet.forEach(socketId => {
        io.to(socketId).emit(event, data);
      });
    }
  };

  io.getOnlineUsers = () => {
    return Array.from(userSockets.keys());
  };

  io.getBoardOnlineCount = (boardId) => {
    const room = boardRooms.get(boardId);
    return room ? room.size : 0;
  };
};