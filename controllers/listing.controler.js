// controllers/listing.controller.js

import cloudinary from "./../utils/cloudinary.js";
import fs from "fs";
import Listing from "./../models/listing.model.js";

// =======================
// 👉 CREATE LISTING
// =======================
export const createListing = async (req, res, next) => {
  try {
    const { imageUrls, ...listingData } = req.body;

    let uploadedImageUrls = [];

    // Upload new images
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "listings",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });

        uploadedImageUrls.push(uploadResult.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    const listing = await Listing.create({
      ...listingData,
      imageUrls: uploadedImageUrls,
      userRef: req.user?.id || listingData.userRef,
    });

    return res.status(201).json(listing);
  } catch (error) {
    // cleanup temp files on error
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// get all listing
export const getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 👉 UPDATE LISTING
// =======================
export const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (req.user && listing.userRef.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    let newUploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "listings",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });
        newUploadedImages.push(uploadResult.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // Use frontend's current images list
    const frontendImages = Array.isArray(updateData.imageUrls)
      ? updateData.imageUrls
      : [];

    const updatedImageUrls = [...frontendImages, ...newUploadedImages];

    listing.set({
      ...updateData,
      imageUrls: updatedImageUrls,
    });

    await listing.save();

    return res.status(200).json({
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// find one listing
export const findOneLisitng = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing Not Found" });
    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 👉 DELETE LISTING
// =======================
export const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Only owner can delete (optional)
    if (req.user && listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ⚠️ Cloudinary delete (optional)
    // If your URLs include public_id, you can delete from Cloudinary
    // Example:
    // await cloudinary.uploader.destroy(public_id)

    await listing.deleteOne();

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    next(error);
  }
};
