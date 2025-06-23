const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");

// GET /search?q=keyword&category=CategoryName
router.get("/", async (req, res, next) => {
  try {
    const { q = "", category = "" } = req.query;
    const filter = {};

    // Add keyword filter
    const keyword = q.trim();
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { location: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    // Add category filter
    const cat = category.trim();
    if (cat) {
      filter.category = cat;
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });

    res.render("listings/index", {
      allListings: listings,
      searchQuery: keyword || null,
      selectedCategory: cat || null,
    });
  } catch (err) {
    next(err); // use error-handling middleware
  }
});

module.exports = router;
