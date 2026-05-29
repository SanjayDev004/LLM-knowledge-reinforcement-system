const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/responseHandler");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, 401, "Not authorised — no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return sendError(res, 401, "User belonging to this token no longer exists");
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token has expired — please log in again");
    }
    return sendError(res, 401, "Not authorised — invalid token");
  }
};

module.exports = { protect };
