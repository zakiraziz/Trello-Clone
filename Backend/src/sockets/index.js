const socketIo = require('socket.io');

module.exports = (io) => {
  // Connection handling
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Example: join a room based on boardId
    socket.on('joinBoard', ({ boardId }) => {
      socket.join(boardId);
      console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    // Example: leave a room
    socket.on('leaveBoard', ({ boardId }) => {
      socket.leave(boardId);
      console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, reason);
    });
  });
};