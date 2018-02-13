var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
    {
        name: "Cloud's Rest",
        image: "https://farm9.staticflickr.com/8041/7930230882_0bb80ca452.jpg",
        description: "The blowfish puffs himself up four, five times larger than normal and why? Why does he do that? So that it makes him intimidating, that's why. Intimidating! So that the other, scarier fish are scared off. And that's you! You are a blowfish. You see it's just all an illusion. You see it's... it's nothing but air. Now... who messes with the blowfish, Jesse? You're damn right. You are a blowfish. Say it again. Say it like you mean it. You're a BLOWFISH!"
    },
    {
        name: "Desert Mesa",
        image: "https://farm3.staticflickr.com/2116/2164766085_0229ac3f08.jpg",
        description: "My partner was about to get himself shot. I intervened. He was angry because those two dealers of yours had just murdered an eleven year-old boy. Then again, maybe he thought it was you who gave the order. "
    },
    {
        name: "Canyon Floor",
        image: "https://farm7.staticflickr.com/6188/6208181463_40c4fd7049.jpg",
        description: "He has enough money to last forever. He knows he needs to keep moving. You'll never find him. He's out of the picture. I saved his life, I owed him that, but now he and I are done. Which is exactly what you wanted, isn't it. You've always struck me as a very pragmatic man so if I may, I would like to review options with you. Of which, it seems to me you have two. "
    }
];

function seedDB(){
    // Remove all campgrounds
    Campground.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed campgrounds!");
        // Add a few campgrounds
        data.forEach(function(seed){
            Campground.create(seed, function(err, campground){
                if(err){
                    console.log(err)
                } else {
                    console.log("Added a campground");
                    // Create a comment
                    Comment.create(
                        {
                            text: "This place is great, but I wish there was internet",
                            author: "Homer"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                campground.comments.push(comment._id);
                                campground.save();
                                console.log("Created new comment");
                            }
                        });
                }
            });
        });
    });
}

module.exports = seedDB;