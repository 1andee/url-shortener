const express = require("express");
var methodOverride = require('method-override')
const app = express();
app.set("view engine", "ejs");
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const randomizer = require("./randomizer");
const protocolChecker = require("./protocolChecker");
const moment = require('moment');

app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["key 1"]
}));

// Object to store all user-submitted URLs
const urlDatabase = {
};

// Object to store the registered users (in lieu of database)
const users = {
};

// Main page rendering
app.get("/", (req, res) => {
  var user_id = req.session.user_id;
  let templateVars = {
    users,
    user_id
  };
  if (user_id) {
    res.redirect("/urls");
  } else {
    res.render("index", templateVars);
  }
});

// Rendering of registration page (re-directs those already logged in)
app.get("/register", (req, res) => {
  var user_id = req.session.user_id;
  let templateVars = {
    users,
    user_id
  };
  if (user_id) {
    res.redirect("/urls");
  } else {
  res.render("register", templateVars);
}
});

// Rendering of login page
app.get("/login", (req, res) => {
  var user_id = req.session.user_id;
  let templateVars = {
    users,
    user_id
  };
  res.render("login", templateVars);
});

// Rendering of urls_index
app.get("/urls", (req, res) => {
  var user_id = req.session.user_id;
  let templateVars = {
    users,
    user_id,
    urls: urlDatabase[user_id],
  };
  res.render("urls_index", templateVars);
});

// Rendering of /urls/new
app.get("/urls/new", (req, res) => {
  var user_id = req.session.user_id;
  let templateVars = {
    users,
    user_id
  };
  if (user_id) {
    res.render("urls_new", templateVars);
  }
  if (!user_id) {
    res.redirect("/login");
  }
});

// Rendering of urls_show (/urls:id)
app.get("/urls/:id", (req, res) => {
  let flag = false;

  if (req.session.user_id) {
    flag = true
    let { id } = req.params;
    let user_id = req.session.user_id;
    let templateVars = {
      users,
      user_id,
      shortURL: id,
      longURL: urlDatabase[user_id][id]["url"],
      date: urlDatabase[user_id][id]["date"]
    }

    for (url in urlDatabase[user_id]) {
      if (url === id) {
        res.render("urls_show", templateVars);
        return;
        }
    }
    res.status(403).send("Error 403: Forbidden.");
  }

  if (!flag) {
  res.status(403).send("Error 403: Forbidden.");
  }
});

// Short-link redirection
app.get("/u/:shortURL", (req, res) => {
  let flag = false;
  for (key in urlDatabase) {
    for (url in urlDatabase[key]) {
      if (url === req.params.shortURL) {
      flag = true;
      res.redirect(urlDatabase[key][url]["url"]);
      return;
      }
    }
  }
  if (!flag) {
  res.status(404).send("Error 404: Something blew up. File not found.");
  }
});

// Registration form data
app.post("/register", (req, res) => {
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
  // Creating new user
  let user_id = randomizer();
  req.session.user_id = user_id;
  users[user_id] = {id: user_id, email: email, password: bcrypt.hashSync(password, 10) };
  urlDatabase[user_id] = { };
  res.redirect("/urls");
});

// Login form data
app.post("/login", (req, res) => {
  let flag = false;
  let { email, password } = req.body;
  for (key in users) {
    if (users[key].email === email) {
      if (bcrypt.compareSync(password, users[key].password)) {
        flag = true;
        req.session.user_id = users[key].id;
        res.redirect("/urls");
      }
    }
  }
  if (!flag) {
  return res.status(403).send("Please check your username and/or password.");
  }
});

// New URL submission
app.post("/urls", (req, res) => {
  let user_id = req.session.user_id;
  let shortURL = randomizer();
  let dateCreated = moment().format("DD MMM YYYY");
  urlDatabase[user_id][shortURL] = {
    url: protocolChecker(req.body.longURL),
    date: dateCreated,
    clickthroughs: 0,
    uniqueClickthroughs: 0
  };
  res.redirect("/urls/" + shortURL);
});

// Update existing shortURL
app.put("/urls/:id", (req, res) => {
  let { id } = req.params;
  let user_id = req.session.user_id;
  urlDatabase[user_id][id]["url"] = protocolChecker(req.body.newURL);
  res.redirect("/urls/" + id);
});

// Deletion of existing short URL
app.delete("/urls/:id", (req, res) => {
  let user_id = req.session.user_id;
  delete urlDatabase[user_id][req.params.id];
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.... is there anybody out there?`);
});
