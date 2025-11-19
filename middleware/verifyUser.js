// middleware/verifyUser.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { errorHandaler } from "../utils/error.js";

export const verifyUser = async (req, res, next) => {
  try {
    // ✅ 1️⃣ Get token from cookie OR Authorization header
    const token =
      req.cookies.access_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(errorHandaler(401, "Unauthorized - No token provided"));
    }

    // ✅ 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ 3️⃣ Find user in DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(errorHandaler(404, "User not found"));
    }

    // ✅ 4️⃣ Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(errorHandaler(401, "Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(errorHandaler(401, "Token expired"));
    }
    next(error);
  }
};
