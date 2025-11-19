// routes/user.route.js
import express from "express";
import multer from "multer";
import { deleteUser, updateUser } from "../controllers/auth.controler.js";
import { getUserListing } from "../controllers/user.controler.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// PUT /api/user/:id
router.put("/:id", upload.single("image"), updateUser);

// DELETE /api/user/:id - Delete user
router.delete("/:id", deleteUser);

router.get("/listings/:id", verifyUser, getUserListing);

export default router;
