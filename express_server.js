const express = require("express");
const app = express();
const randomizer = require("./randomizer");
const protocolChecker = require("./protocolChecker");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  let templateVars = {
    users, user_id: req.cookies["user_id"]
  };
  res.render("index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    users, user_id: req.cookies["user_id"]
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    users, user_id: req.cookies["user_id"]
  };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users, user_id: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    users, user_id: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    users, user_id: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  // Conditional checks for email
  if (email.length <= 5) {
      res.status(400).send("Error 400: Please provide a valid email.");
  };
  for (key in users) {
    if (users[key].email === email) {
      res.status(400).send("Error 400: This email is already associated with an account in our system. Please register with a different one.");
    };
  };
  // Conditional checks for password
  if (!password) {
    res.status(400).send("Error 400: Please provide a password.");
  };
  let user_id = randomizer();
  res.cookie('user_id', user_id);
  users[user_id] = {id: user_id, email: email, password: password};
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  for (key in users) {
    if (users[key].email === req.body.email) {
      if (users[key].password === req.body.password) {
        res.cookie('user_id', users[key].id);
        res.redirect("/urls");
      }
    }
  }
  return res.status(403).send("Please check your username and/or password.");
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
  res.clearCookie('user_id', req.body.user_id);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.... is there anybody out there?`);
});
