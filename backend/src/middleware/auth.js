const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies JWT, loads user, attaches to req.user
 * Role is read from the token payload (no extra DB query for role checks)
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    if (!user) {
      return res.status(401).json({ message: "The user belonging to this token no longer exists." });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ message: "Password was recently changed. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token. Please log in again." });
  }
};

/**
 * restrictTo — role-based access guard
 * Usage: router.post("/", protect, restrictTo("driver"), handler)
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. This action requires one of the following roles: ${roles.join(", ")}.`,
    });
  }
  next();
};

/**
 * adminOnly — checks if user is admin (isAdmin field)
 * Usage: router.get("/admin", protect, adminOnly, handler)
 */
const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

module.exports = { protect, restrictTo, adminOnly };
