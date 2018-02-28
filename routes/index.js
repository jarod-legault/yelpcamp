var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
    async       = require("async"),
    crypto      = require("crypto"), // No install required. Included in Express/Node.
    middleware  = require("../middleware");
    
// Mailgun setup
var api_key = 'key-1b2e2d75668891f8f4e08e70dfdabafc';
var domain = 'sandboxcf2abc5f7d344a4fbc55afd6a753be0a.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

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
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email
    });
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

// Forgot password GET route
router.get("/forgot", function(req, res){
    res.render("forgot");
});

// Forgot password POST route
router.post("/forgot/", function(req, res, next){
    async.waterfall([
        // Generate token
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        
        // Save password token and token expiry
        function(token, done){
            User.findOne({ email: req.body.email }, function(err, user){
                if(!user){
                    req.flash("error", "No account with the email address exists.");
                    res.redirect("/forgot");
                } else if(err){
                    req.flash("error", err.message);
                    res.redirect("/forgot");
                }
                else {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 3600000 ms = 1 hour
                    user.save(function(err){
                        done(err, token, user);
                    });
                }
            });
        },
        
        // Send recovery email with link for reset using mailgun
        function(token, user, done){
            var data = {
                from: 'YelpCamp Admin <jarod.legault@gmail.com>',
                to: user.email,
                subject: 'YelpCamp Password Reset Request',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            mailgun.messages().send(data, function (err, body) {
                if(err) {
                    console.log(err.message);
                } else {
                    req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
                }
                done(err, "done");
            });
        },
    ], function(err){
        if(err) return next(err);
        res.redirect("/forgot");
    });
});

// Password reset page
router.get("/reset/:token", function(req, res){
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, foundUser){
        if(err) {
            console.log(err.message);
        } else if(!foundUser) {
            console.log("invalid token");
            req.flash("error", "Password reset token is invalid or has expired 136.");
            res.redirect("/forgot");
        } else {
            console.log("render reset page")
            res.render("reset", {token: req.params.token});
        }
    });
});

// Password reset route
router.put("/reset/:token", function(req, res){
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() } }, function(err, foundUser){
                if(err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                } else if(!foundUser){
                    req.flash("error", "Password reset token is invalid or has expired 153.");
                    res.redirect("back");
                } else if(req.body.password === req.body.confirm) {
                    foundUser.setPassword(req.body.password, function(err) {
                        if(err) {
                            req.flash("error", err.message);
                            res.redirect("back");
                        } else {
                            foundUser.resetPasswordToken = undefined;
                            foundUser.resetPasswordExpires = undefined;
                            foundUser.save(function(err) {
                                if(err) {
                                    req.flash("error", err.message);
                                    res.redirect("back");
                                } else {
                                    req.logIn(foundUser, function(err) {
                                        if(err) {
                                            req.flash("error", err.message);
                                            res.redirect("back");
                                        } else {
                                            done(err, foundUser);
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect("back");
                }
            });
        },
        function(foundUser, done){
            var data = {
                from: 'YelpCamp Admin <jarod.legault@gmail.com>',
                to: foundUser.email,
                subject: 'Your YelpCamp Password Has Been Reset',
                text: 'Hello, \n\n' +
                    'This is a confirmation that the password for your account ' + foundUser.email + 'has just been reset.'
            };
            mailgun.messages().send(data, function (err, body) {
                if(err) {
                    console.log(err.message);
                } else {
                    req.flash("success", "Success! Your password has been changed.");
                }
                done(err);
            });
        }
    ], function(err) {
        if(err) {
            req.flash("error", err.message);
        }
        res.redirect("/campgrounds");
    });
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

// USER PROFILE
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    res.render("users/show", {user: foundUser, campgrounds:campgrounds});
                }
            });
            
        }
    });
});

// Edit single user
router.get("/users/:id/edit", middleware.isAdminOrSameUser, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            res.render("users/edit", {user: foundUser});
        }
    });
});

// Update single user
router.put("/users/:id", middleware.isAdminOrSameUser, function(req, res){
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Username not found");
            res.redirect("back");
        } else {
            foundUser.firstName = req.body.firstName;
            foundUser.lastName = req.body.lastName;
            foundUser.avatar = req.body.avatar;
            foundUser.email = req.body.email;
            if(req.body.isAdmin) foundUser.isAdmin = true;
            else foundUser.isAdmin = false;
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

module.exports = router;