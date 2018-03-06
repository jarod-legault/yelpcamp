var express = require("express");
var router = express.Router();
var request = require("request");

// Mailgun setup
var api_key = process.env.MAILGUN_API_KEY;
var domain = 'sandboxcf2abc5f7d344a4fbc55afd6a753be0a.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

// contact form
router.get("/", function(req, res) {
    res.render("contact/contactMe", {page: 'contact'});
});

router.post("/send", function(req, res) {
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
        console.log(req.body);
        req.flash("error", "Please select captcha");
        return res.redirect("back");
    }
    // secret key
    var secretKey = process.env.CAPTCHA_SECRET_KEY;
    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;
    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {
        // if not successful
        if (body.success !== undefined && !body.success) {
            req.flash("error", "Captcha Failed");
            return res.redirect("/contact");
        }
        
        var data = {
            from: 'YelpCamp Admin <jarod.legault@gmail.com>',
            to: "jarod.legault@gmail.com",
            subject: "YelpCamp contact request from: " + req.body.name,
            text: 'You have received an email from... Name: '+ req.body.name + ' Phone: ' + req.body.phone + ' Email: ' + req.body.email + ' Message: ' + req.body.message,
            html: '<h3>You have received an email from...</h3><ul><li>Name: ' + req.body.name + ' </li><li>Phone: ' + req.body.phone + ' </li><li>Email: ' + req.body.email + ' </li></ul><p>Message: <br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + req.body.message + ' </p>'
        };
        mailgun.messages().send(data, function (err, body) {
            if(err) {
                console.log(err.message);
                req.flash("error", "Something went wrong... Please try again later!");
                res.redirect("/contact");
            } else {
                req.flash("success", "Your email has been sent, we will respond within 24 hours.");
                res.redirect("/campgrounds");
            }
        });
        
    });
});

module.exports = router;