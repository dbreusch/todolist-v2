//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

// set up Database
const pw = 'dft84CuJPE7YyrX';
const dbName = 'todolistDB';
// const url = 'mongodb://localhost:27017/' + dbName;
const url = 'mongodb+srv://admin-dave:'+pw+'@cluster0-ggsdv.mongodb.net/'+dbName+'?retryWrites=true&w=majority'
// mongoose.connect(url + "/" + dbName, {
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log( "Connected to " + dbName );
});

const itemsSchema = new mongoose.Schema( {
  name : String
} );

const Item = mongoose.model("Item", itemsSchema);

// create default list items (Documents)
const item1 = new Item( {
  name : "Starter item 1"
});
const item2 = new Item( {
  name : "Starter item 2"
});
const item3 = new Item( {
  name : "Starter item 3"
});
const defaultItems = [item1, item2, item3];

// custom list Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);
// set up Express
const localPort = 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  Item.find(function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      // mongoose.connection.close();

      if (foundItems.length === 0) {
        // add default items to database
        Item.insertMany( defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Added default items");
          }
          res.redirect("/");
        });
      } else {
        // res.render("list", {listTitle: day, newListItems: foundItems});
        res.render("list", {listTitle: "Today", newListItems: foundItems});
        }

      // foundItems.forEach(function(item) {
      //   console.log(item.name);
      }

    }
  );

// const day = date.getDate();

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item( {
    name : itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove( checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item deleted");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull:
        {items:
          { _id: checkedItemId }
        }
      },
      function(err,foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne( { name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        console.log(customListName + " Not found, adding");
        const list = new List( {
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        console.log(customListName + " found, showing");
        res.render( "list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    } else {
      console.log(err);
    }

    });
  });

app.get("/about", function(req, res){
  res.render("about");
});

// app.listen(localPort, function() {
//   console.log("Server started on port " + localPort);
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = localPort;
}
app.listen(port, function() {
  console.log("Server started on port " + port);
});
