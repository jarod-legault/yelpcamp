var bodyParser      = require("body-parser"),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    express         = require("express"),
    seedDB          = require("./seeds"),
    app             = express();
    
// Configure dotenv
require('dotenv').config();
    
// Requiring routes
var commentRoutes       = require("./routes/comments"),
    campgroundRoutes    = require("./routes/campgrounds"),
    indexRoutes         = require("./routes/index"),
    contactRoutes       = require("./routes/contact");

var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
mongoose.connect(url);
//mongoose.connect("mongodb://localhost/yelp_camp"); // Dev
//mongoose.connect("mongodb://jarodl:yelpcamp@ds025419.mlab.com:25419/yelpcamp"); // Prod

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
//seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Annabelle and Oreo are amazing kitties :)",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/contact", contactRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Yelp Camp server is running!"); 
});