import { errorHandaler } from "../utils/error.js";
import Listing from "./../models/listing.model.js";

export const test = (req, res) => {
  res.json({ message: "hello world dfasd bbb" });
};

export const getUserListing = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandaler(401, "you can view your on listing"));
  }
};
