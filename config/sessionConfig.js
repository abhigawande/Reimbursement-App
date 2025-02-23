const session = require("express-session");

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }, // Set secure:true in production (HTTPS)
});

module.exports = sessionMiddleware;
