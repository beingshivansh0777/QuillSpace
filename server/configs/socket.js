import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./logger.js";

let io = null;

// Attaches Socket.io to the raw HTTP server (not the Express app directly —
// they share the same underlying server, see server.js). Called once at
// startup from server.js.
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" }, // matches the existing permissive app.use(cors()) — tighten both together if you ever lock down origins
  });

  // Authenticates the socket handshake using the same JWT scheme as the
  // REST API's auth.js middleware — token is passed via socket.handshake.auth
  // on the client (not an Authorization header, sockets don't have those).
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Every user gets a private room named after their own id. Any
    // "notify this user" call anywhere in the app is just
    // io.to(userId).emit(...) — works even across multiple open tabs,
    // since each tab's socket independently joins the same room.
    socket.join(socket.userId);

    // ---- Support ticket live threads ----
    // Clients explicitly join/leave a ticket's room as they open/close that
    // thread, rather than broadcasting every ticket message to everyone —
    // keeps traffic scoped to people actually looking at that ticket.
    socket.on("ticket:join", (ticketId) => {
      if (ticketId) socket.join(`ticket:${ticketId}`);
    });
    socket.on("ticket:leave", (ticketId) => {
      if (ticketId) socket.leave(`ticket:${ticketId}`);
    });

    // ---- Live blog vote counts ----
    // Same pattern — join while viewing a specific post, leave on navigating away.
    socket.on("blog:join", (blogId) => {
      if (blogId) socket.join(`blog:${blogId}`);
    });
    socket.on("blog:leave", (blogId) => {
      if (blogId) socket.leave(`blog:${blogId}`);
    });
  });

  logger.info("Socket.io initialized");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized yet — call initSocket() first.");
  return io;
};

// Safe emit wrappers — every call site uses these instead of getIO() directly,
// so a socket error never breaks the underlying HTTP request that triggered it.
export const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(userId.toString()).emit(event, payload);
  } catch (error) {
    // silent — real-time delivery is a bonus, not a hard dependency
  }
};

export const emitToTicket = (ticketId, event, payload) => {
  try {
    getIO().to(`ticket:${ticketId}`).emit(event, payload);
  } catch (error) {
    // silent
  }
};

export const emitToBlog = (blogId, event, payload) => {
  try {
    getIO().to(`blog:${blogId}`).emit(event, payload);
  } catch (error) {
    // silent
  }
};