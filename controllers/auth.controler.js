import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { errorHandaler } from "./../utils/error.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";
export const signup = async (req, res, next) => {
  try {
    const { userName, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ userName, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({
      message: "User Created Successfully",
      user: newUser,
    });
  } catch (error) {
    // console.error("Signup error:", error);
    // res.status(500).json({ message: "Server error", error: error.message });
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validuser = await User.findOne({ email });
    if (!validuser) return next(errorHandaler(404, "user not found"));
    const validPassword = bcrypt.compareSync(password, validuser.password);
    if (!validPassword) return next(errorHandaler(401, "Wrong Crendtail"));
    const token = jwt.sign({ id: validuser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validuser._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true on vercel
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      // ✅ Existing user — login
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password, ...rest } = user._doc;

      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(rest);
    } else {
      // ✅ New user — register
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hashSync(generatedPassword, 10);

      const newUser = new User({
        userName:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString().slice(-4),
        email: req.body.email,
        password: hashedPassword,
        image: req.body.image,
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password, ...rest } = newUser._doc;

      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { userName, email, password } = req.body;

    // ✅ Validate user ID
    if (!req.params.id || req.params.id.length !== 24) {
      return next(errorHandaler(400, "Invalid user ID"));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandaler(404, "User not found"));

    // ✅ Upload image if provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "uploads",
      });
      user.image = uploadResult.secure_url;
      fs.unlinkSync(req.file.path); // delete temp file
    }

    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const { password: pass, ...rest } = user._doc;
    res.status(200).json({ message: "Profile updated", user: rest });
  } catch (err) {
    console.error("Update user error:", err);
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Validate user ID
    if (!id || id.length !== 24) {
      return next(errorHandaler(400, "Invalid user ID"));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(errorHandaler(404, "User not found"));
    }
    // ✅ Optional: Delete user's image from Cloudinary if exists
    if (user.image) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const publicId = fileName.split(".")[0]; // Remove file extension
        const fullPublicId = `profile_images/${publicId}`;

        await cloudinary.uploader.destroy(fullPublicId);
        console.log(`Deleted image from Cloudinary: ${fullPublicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Continue with user deletion even if image deletion fails
      }
    }
    // ✅ Delete user from database
    await User.findByIdAndDelete(id);

    // ✅ Clear the cookie
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    next(error);
  }
};
