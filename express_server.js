const express = require("express");
const app = express();
app.set("view engine", "ejs");
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const randomizer = require("./randomizer");
const protocolChecker = require("./protocolChecker");
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const urlDatabase = {
};

const users = {
};

app.get("/", (req, res) => {
  let templateVars = {
    users,
    user_id: req.cookies["user_id"]
  };
  res.render("index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    users,
    user_id: req.cookies["user_id"]
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    users,
    user_id: req.cookies["user_id"]
  };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  var user_id = req.cookies["user_id"];
  let templateVars = {
    users,
    user_id,
    urls: urlDatabase[user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  var user_id = req.cookies["user_id"];
  let templateVars = {
    users,
    user_id,
    urls: urlDatabase[user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let { id } = req.params;
  let user_id = req.cookies["user_id"];
  let templateVars = {
    users,
    user_id,
    shortURL: id,
    longURL: urlDatabase[user_id][id]
  };

  for (url in urlDatabase[user_id]) {
    if (url === id) {
      res.render("urls_show", templateVars);
      }
  };
  res.status(403).send("Error 403: Unauthorized access.");
});

app.get("/u/:shortURL", (req, res) => {
  for (key in urlDatabase) {
    for (url in urlDatabase[key]) {
      if (url === req.params.shortURL) {
      res.redirect(urlDatabase[key][url]);
      break;
      }
    }
  }
});

app.post("/register", (req, res) => {
  // let email = req.body.email;
  // let password = req.body.password;
  let { email, password } = req.body;
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
  users[user_id] = {id: user_id, email: email, password: bcrypt.hashSync(password, 10) };
  urlDatabase[user_id] = { };
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let { email, password } = req.body;
  for (key in users) {
    if (users[key].email === email) {
      if (bcrypt.compareSync(password, users[key].password)) {
        res.cookie('user_id', users[key].id);
        res.redirect("/urls");
      }
    }
  }
  return res.status(403).send("Please check your username and/or password.");
});

app.post("/urls", (req, res) => {
  let user_id = req.cookies["user_id"];
  let shortURL = randomizer();
  urlDatabase[user_id][shortURL] = protocolChecker(req.body.longURL);
  res.redirect("/urls/" + shortURL);
});

app.post("/urls/:id", (req, res) => {
  let user_id = req.cookies["user_id"];
  urlDatabase[user_id][req.params.id] = protocolChecker(req.body.newURL);
  res.redirect("/urls/" + req.params.id);
});

app.post("/urls/:id/delete", (req, res) => {
  let user_id = req.cookies["user_id"];
  delete urlDatabase[user_id][req.params.id];
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.body.user_id);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.... is there anybody out there?`);
});
