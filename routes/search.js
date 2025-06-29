const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");

// GET /search?q=keyword&category=CategoryName&location=&minPrice=&maxPrice=
router.get("/", async (req, res, next) => {
  try {
    const { q = "", category = "", location = "", minPrice, maxPrice } = req.query;
    const filter = {};

    const keyword = q.trim();
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      filter.$or = [
        { title: regex },
        { location: regex },
        { description: regex },
        { country: regex }
      ];
    }

    if (category.trim()) {
      filter.category = { $in: [category.trim()] };
    }

    if (location.trim()) {
      filter.location = new RegExp(location.trim(), "i");
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });

    res.render("listings/index", {
      allListings: listings,
      searchQuery: keyword || null,
      selectedCategory: category || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      selectedLocation: location || null
    });

  } catch (err) {
    next(err); // handle errors gracefully
  }
});

module.exports = router;
