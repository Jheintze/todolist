const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
mongoose.connect(process.env.MONGO_URL);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const buyDog = new Item({
  name: "buy a Dog!",
});

const buyHippo = new Item({
  name: "buy a Hippo!",
});

const buyHoneyBadger = new Item({
  name: "buy a HoneyBadger!",
});

const defaultItems = [buyDog, buyHippo, buyHoneyBadger];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})

    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("items added!");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({ name: listName }).then(function (foundList) {
    if (!foundList) {
      const list = new List({
        name: listName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + listName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  
  if(listName === "Today"){
  item.save();
  res.redirect("/");
  }else{
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if ( listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(function () {
      console.log("deleted item successfully!");
      res.redirect("/");
    })
    .catch(function (err) {
      console.log(err);
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id: checkedItemId}}})
    .then(function(foundList){
      res.redirect("/" + listName)
    })
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
