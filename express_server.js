var express = require("express");
var app = express();
var randomizer = require("./randomizer");
var protocolChecker = require("./protocolChecker");
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("index", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  // DO SOMETHING WITH COOKIE HERE
  // REDIRECT USER TO /URLS INDEX PAGE
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let shortURL = randomizer();
  urlDatabase[shortURL] = protocolChecker(req.body.longURL);
  res.redirect("/urls/" + shortURL);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = protocolChecker(req.body.newURL);
  res.redirect("/urls/" + req.params.id);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.... is there anybody out there?`);
});
