const { response } = require("express");
const Listing = require("../models/listing.js");
//const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
//const mapToken = process.env.MAP_TOKEN;
//const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    let { search, category, minPrice, maxPrice, location } = req.query;
    let filter = {};

    // Text search (title, location, country)
    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        filter.$or = [
            { title: regex },
            { location: regex },
            { country: regex }
        ];
    }

    // Filter by category
    if (category && category !== "") {
        const categoriesArray = category.split(","); // Assuming CSV from query
        filter.category = { $in: categoriesArray };
    }



    // Filter by location (optional separate location input)
    if (location && location.trim() !== "") {
        const locationRegex = new RegExp(escapeRegex(location), 'i');
        filter.location = locationRegex;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let allListings = await Listing.find(filter);


    res.render("listings/index.ejs", {
        allListings,
        searchQuery: search || null,
        selectedCategory: category || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        selectedLocation: location || null
    });

};


// Helper function to escape regex special characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}


module.exports.searchByKeyword = async (req, res) => {
    const { keyword } = req.query;
    if (!keyword || keyword.trim() === "") {
        req.flash("error", "Please enter a search term.");
        return res.redirect("/listings");
    }

    const regex = new RegExp(escapeRegex(keyword), 'i');

    const allListings = await Listing.find({
        $or: [
            { title: regex },
            { description: regex },
            { location: regex },
            { category: regex }
        ]
    });

    res.render("listings/index.ejs", {
        allListings,
        searchQuery: keyword,
        selectedCategory: null,
        minPrice: null,
        maxPrice: null,
        selectedLocation: null
    });
};



module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews", populate: {
            path: "author",
        },
    }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested doesn't exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing })
};

module.exports.createListing = async (req, res, next) => {
    //let response  = await geocodingClient.forwardGeocode({
    //  query: req.body.listing.location,
    //limit: 1
    //})
    //  .send()
    let url = req.file.path;
    let filename = req.file.filename;
    const newlisting = new Listing(req.body.listing);
    newlisting.owner = req.user._id;
    newlisting.image = { url, filename };
    //newlisting.geometry = response.body.features[0].geometry;
    let saveListing = await newlisting.save();
    //console.log(saveListing);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested doesn't exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250")
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data for listing");
    }
    let { id } = req.params;
    // Update the listing
    let listing = await Listing.findByIdAndUpdate(id, req.body.listing);
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    const deletedlisting = await Listing.findByIdAndDelete(id);
    console.log(deletedlisting);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};