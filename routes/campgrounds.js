var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    User  = require("../models/user"),
    middleware  = require("../middleware"),
    /*geocoder    = require("geocoder"),*/
    NodeGeocoder    = require("node-geocoder");
    
// NODE GEOCODER SETUP
var options = {
    provider: 'google',
 
    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: "AIzaSyDXJ76W6_WRPIvcGhC89P6782-dmJalOPk", // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

// INDEX - Show all campgrounds
router.get("/", function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({name: regex}, function(err, foundCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: foundCampgrounds, page: 'campgrounds'});
            }
        });
    } else {
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
            }
        });
    }
});

// CREATE - Add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var price = convertToString(req.body.price);
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
       id: req.user._id,
       username: req.user.username
    };
    geocoder.geocode(req.body.location, function(err, data){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else{
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            var newCampground = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                    console.log(err);
                } else {
                    res.redirect("/campgrounds");
                }
            });
        }
    });
    
});

// NEW - Show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found.");
            res.redirect("back");
        } else {
            User.findById(foundCampground.author.id, function(err, foundUser){
                var isCurrentUser;
                if(foundUser) {
                    isCurrentUser = true;
                } else {
                    isCurrentUser = false;
                }
                res.render("campgrounds/show", {campground: foundCampground, isCurrentUser: isCurrentUser});
            });
        }
    });
});

// EDIT - show edit form
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            req.flash("error", err.message);
            res.redirect("/campgrounds");
        } else {
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

// UPDATE - updates campground
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.location, function(err, data){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else{
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            var price = convertToString(req.body.campground.price);
            var newData = {name: req.body.campground.name, image: req.body.campground.image, description: req.body.campground.description, price: price, location: location, lat: lat, lng: lng};
            Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground){
                if(err){
                    req.flash("error", err.mesage);
                    res.redirect("/campgrounds");
                } else {
                    req.flash("success", "Successfully Updated!");
                    res.redirect("/campgrounds/" + req.params.id);
                }
            });
        }
    });
    
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash("error", err.mesage);
            res.redirect("/campgrounds");
        } else {
            req.flash("success", "Campground deleted");
            res.redirect("/campgrounds");
        }
    });
});

// Convert numerical currency to string currency
function convertToString(priceAsNumber) {
    var centsAsString = Math.round((priceAsNumber * 100)).toString(); // Convert to cents string
    var priceAsString = centsAsString.substr(0, centsAsString.length-2) + "." + centsAsString.substr(centsAsString.length-2); // Add "."
    var commaPosition = 6;
    for(var i = priceAsNumber; i >= 1000; i = i/1000) {
        priceAsString = priceAsString.substr(0, priceAsString.length - commaPosition) + "," + priceAsString.substr(priceAsString.length - commaPosition);
        commaPosition += 4; // Move 3 digits plus comma
    }
    return priceAsString;
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;