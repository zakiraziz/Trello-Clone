const socketIo = require('socket.io');

// In-memory rate limiter for Socket.io events
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const RATE_LIMIT_MAX_EVENTS = 10; // max 10 events per window

// Track online users per board
const boardRooms = new Map(); // boardId -> Set of socket IDs

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
    // Reset window
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

  // Connection handling
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a room based on boardId
    socket.on('joinBoard', ({ boardId }) => {
      if (!boardId) return;
      socket.join(boardId);
      
      // Track online users
      if (!boardRooms.has(boardId)) {
        boardRooms.set(boardId, new Set());
      }
      boardRooms.get(boardId).add(socket.id);
      
      // Broadcast updated count to all in room
      const count = boardRooms.get(boardId).size;
      io.to(boardId).emit('online-users', count);
      
      console.log(`Socket ${socket.id} joined board ${boardId}. Online: ${count}`);
    });

    // Leave a room
    socket.on('leaveBoard', ({ boardId }) => {
      if (!boardId) return;
      socket.leave(boardId);
      
      // Update online users count
      if (boardRooms.has(boardId)) {
        boardRooms.get(boardId).delete(socket.id);
        const count = boardRooms.get(boardId).size;
        io.to(boardId).emit('online-users', count);
      }
      
      console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, reason);
      
      // Clean up from all rooms
      boardRooms.forEach((sockets, boardId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          const count = sockets.size;
          io.to(boardId).emit('online-users', count);
        }
      });
    });
  });
};
