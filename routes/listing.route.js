// routes/listing.route.js
import express from "express";

import { verifyUser } from "../middleware/verifyUser.js";
import upload from "../middleware/upload.js";

import {
  createListing,
  updateListing,
  deleteListing,
  findOneLisitng,
  getAllListings,
} from "../controllers/listing.controler.js";

const router = express.Router();

router.get("/", getAllListings);
// ===========================
// 👉 CREATE LISTING
// ===========================
router.post(
  "/create",
  verifyUser,
  upload.array("imageUrls[]", 10),
  createListing
);

// routes/listing.route.js
router.get("/:id", findOneLisitng);
// ===========================
// 👉 UPDATE LISTING
// ===========================
// Example: PUT /api/listing/update/12345
router.put(
  "/update/:id",
  verifyUser,
  upload.array("imageUrls[]", 10),
  updateListing
);
// ===========================
// 👉 DELETE LISTING
// ===========================
// Example: DELETE /api/listing/delete/12345
router.delete("/delete/:id", verifyUser, deleteListing);

export default router;
