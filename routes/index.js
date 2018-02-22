var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    middleware  = require("../middleware");

// Root route
router.get("/", function(req, res){
   res.render("landing"); 
});

// Show register form
router.get("/register", function(req, res){
    res.render("register", {page: 'register'});
});

// Handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    if(req.body.adminCode === "secretcode123") {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp, " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

// Show login form
router.get("/login", function(req, res){
    res.render("login", {page: 'login'});
});

// Handle login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "login",
        failureFlash: "Invalid username or password.",
        successFlash: "Successfully logged in!"
    }), function(req, res){
    
});

// Logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

// Show users page
router.get("/users", middleware.isAdmin, function(req, res){
    User.find({}, function(err, allUsers){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            res.render("users", {users: allUsers, page: 'users'});
        }
    });
});

// User - Make Normal
router.put("/users/:id/makeNormal", middleware.isAdmin, function(req, res){
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Username not found");
            res.redirect("back");
        } else {
            foundUser.isAdmin = false;
            foundUser.save(function(err, updatedUser){
                if(err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                }
            });
            req.flash("success", "User updated successfully");
            res.redirect("back");
        }
    });
});

// User - Make Admin
router.put("/users/:id/makeAdmin", middleware.isAdmin, function(req, res){
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Username not found");
            res.redirect("back");
        } else {
            foundUser.isAdmin = true;
            foundUser.save(function(err, updatedUser){
                if(err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                }
            });
            req.flash("success", "User updated successfully");
            res.redirect("back");
        }
    });
});

// DESTROY USER ROUTE
router.delete("/users/:id", middleware.isAdmin, function(req, res){
    User.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash("error", err.message);
            res.redirect("/users");
        } else {
            req.flash("success", "User deleted");
            res.redirect("/users");
        }
    });
});

module.exports = router;