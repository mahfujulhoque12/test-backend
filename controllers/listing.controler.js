// controllers/listing.controller.js

import cloudinary from "./../utils/cloudinary.js";
import Listing from "./../models/listing.model.js";

export const createListing = async (req, res, next) => {
  try {
    const { imageUrls, ...listingData } = req.body;
    let uploadedImageUrls = [];

    // Upload new images from memory buffer
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "listings",
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
              transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          // Send the buffer to Cloudinary
          uploadStream.end(file.buffer);
        });

        uploadedImageUrls.push(uploadResult.secure_url);
      }
    }

    const listing = await Listing.create({
      ...listingData,
      imageUrls: uploadedImageUrls,
      userRef: req.user?.id || listingData.userRef,
    });

    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (req.user && listing.userRef.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    let newUploadedImages = [];

    // Upload from memory buffer
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "listings",
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
              transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          uploadStream.end(file.buffer);
        });

        newUploadedImages.push(uploadResult.secure_url);
      }
    }

    // Use frontend's current images list
    const frontendImages = Array.isArray(updateData.imageUrls)
      ? updateData.imageUrls
      : [];

    const updatedImageUrls = [...frontendImages, ...newUploadedImages];

    // Update listing
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        ...updateData,
        imageUrls: updatedImageUrls,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: error.message });
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
