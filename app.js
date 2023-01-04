//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Database connection
mongoose.connect("mongodb+srv://shreyy:test123@cluster0.brgsc.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
    name : String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name : "Welcome to our todoList!"
});

const item2 = new Item({
    name : "Hit the + button to add a new button"
});

const item3 = new Item({
    name : "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const customListSchema = {        //schema for custom list
    name: String,
    items : [itemsSchema]
}

const customList = mongoose.model("customList", customListSchema);   //mongoose model for custom list

const day = date.getDate();   //getting the current day and date from getDate method of date module

//Get Post requests
app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems){  //if list is empty add default items, it ensures items are being added only 1 time

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }else{                        //if list not empty then just render the list
                    console.log("Successfully saved default items to database");
                }
            });
            res.redirect("/");   //to render the added items cos next time it will tackle else block
        }else{
            res.render("list", {
                listTitle: day,
                newListItems: foundItems
            });
        }

    })
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    customList.findOne({name : customListName}, function(err, foundList){
        if(!err){
            if(!foundList){              //if list doesn't exist, make a new document
                const list = new customList({
                    name : customListName,
                    items : defaultItems
                });
                list.save();
                res.redirect("/" + customListName);

            }else{                     //if list already exists, render it
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    })
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    //making new document to be added in list
    const newitem = new Item({
        name : itemName
    });

    //checking in which list it is added by it's list title
    if(listName === day){   //if item belongs to main list
        newitem.save();     //new item saved into the collection
        res.redirect("/");
    }else{                  //if item belongs to customlist embed it in into the array after finding the particular list
        customList.findOne({name : listName}, function(err, foundList){
            foundList.items.push(newitem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;


    //we'll check from which list the delete request came from
    if(listName === day){           //if item to be deleted is from default list
        //delete the checked item from database collection
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect("/");
            }
        });
    }else{                   //if item to be deleted is from customList
        customList.findOneAndUpdate({name : listName},       //fi ndOneAndUpdate method to find a document and update it
                    {$pull : {items : {_id : checkedItemId}}}, //$pull function to delet a document from array
                    function(err, foundList){
                        if(!err){
                            res.redirect("/" + listName);
                        }
                    })
    }
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
