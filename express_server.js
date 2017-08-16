const express = require("express");
const PORT = process.env.PORT || 8080; // default port 8080

const methodOverride = require('method-override')
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const moment = require('moment');
const flash = require('express-flash');
const randomizer = require("./lib/randomizer");
const protocolChecker = require("./lib/protocolChecker");

const app = express();
app.set("view engine", "ejs");


app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
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
    req.flash('warning', "You are already logged in!");
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
  if (user_id) {
    req.flash('warning', "You are already logged in!");
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

// Rendering of urls_index
app.get("/urls", (req, res) => {
  var user_id = req.session.user_id;
  let templateVars = {
    users,
    user_id,
    urls: urlDatabase[user_id]
  };
  if (user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
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
  } else {
    res.redirect("/login");
  }
});

// Rendering of urls_show (/urls:id)
app.get("/urls/:id", (req, res) => {
  let urlFound = false;

  if (req.session.user_id) {
    urlFound = true
    let { id } = req.params;
    let user_id = req.session.user_id;
    let urlEntry = urlDatabase[user_id][id];
    let templateVars = {
      users,
      user_id,
      shortURL: id,
      longURL: urlEntry["url"],
      date: urlEntry["date"],
      clickthroughs:  urlEntry["clickthroughs"],
      uniqueClickthroughs:  urlEntry["uniqueClickthroughs"]
    }

    for (url in urlDatabase[user_id]) {
      if (url === id) {
        res.render("urls_show", templateVars);
        return;
      }
    }
    req.flash('danger', "That action is forbidden.");
    res.redirect("/")
  }

  if (!urlFound) {
    req.flash('danger', "That action is forbidden.");
    res.redirect("/")
  }
});

// Short-link redirection
app.get("/u/:shortURL", (req, res) => {
  let urlFound = false;
  let user_id = req.session.user_id;
  for (key in urlDatabase) {
    for (url in urlDatabase[key]) {
      if (url === req.params.shortURL) {
        urlFound = true;
        urlDatabase[key][url]["clickthroughs"]++;
        if (!user_id) {
          req.session.user_id = user_id;
          urlDatabase[key][url]["uniqueClickthroughs"]++;
        }
        res.redirect(urlDatabase[key][url]["url"]);
        return;
      }
    }
  }
  if (!urlFound) {
    req.flash('danger', "That short URL couldn't be found.");
    res.redirect("/")
  }
});

// Registration form data
app.post("/register", (req, res) => {
  let { email, password } = req.body;
  // Conditional checks for email
  if (email.length <= 5) {
    req.flash('danger', "Please provide a valid email.");
    res.redirect("/register")
  };
  for (key in users) {
    if (users[key].email === email) {
      req.flash('warning', "This email is already associated with an account in our system. Please register with a different one.");
      res.redirect("/register")
    };
  };
  // Conditional checks for password
  if (!password) {
    req.flash('danger', "Please provide a password.");
    res.redirect("/register")
  };
  // Creating new user
  let user_id = randomizer();
  req.session.user_id = user_id;
  users[user_id] = {id: user_id, email: email, password: bcrypt.hashSync(password, 10) };
  urlDatabase[user_id] = { };
  req.flash('success', "Your account has been successfully created. Add a new URL above to get started!");
  res.redirect("/urls");
});

// Login form data
app.post("/login", (req, res) => {
  let userFound = false;
  let { email, password } = req.body;
  for (key in users) {
    if (users[key].email === email) {
      if (bcrypt.compareSync(password, users[key].password)) {
        userFound = true;
        req.session.user_id = users[key].id;
        res.redirect("/urls");
      }
    }
  }
  if (!userFound) {
    req.flash('danger', "Please check your username and/or password.");
    return res.redirect("/login");
  }
});

// New URL submission
app.post("/urls", (req, res) => {
  if (req.body.longURL.length <= 4) {
    req.flash('warning', "Please enter a valid URL.");
    res.redirect("/urls/new")
  } else {
    let user_id = req.session.user_id;
    let shortURL = randomizer();
    let dateCreated = moment().format("DD MMM YYYY");
    urlDatabase[user_id][shortURL] = {
      url: protocolChecker(req.body.longURL),
      date: dateCreated,
      // clickthroughs: 0,
      // uniqueClickthroughs: 0
      analytics: {
        clickthroughts: 0,
        uniqueClickthroughs: 0,
        visits: []
      }
    };
    return res.redirect("/urls/" + shortURL);
  }
});

// Update existing shortURL
app.put("/urls/:id", (req, res) => {
  let { id } = req.params;
  let user_id = req.session.user_id;
  urlDatabase[user_id][id]["url"] = protocolChecker(req.body.newURL);
  req.flash('warning', "The details for this URL have been updated.");
  res.redirect("/urls/" + id);
});

// Deletion of existing short URL
app.delete("/urls/:id", (req, res) => {
  let user_id = req.session.user_id;
  delete urlDatabase[user_id][req.params.id];
  req.flash('warning', "This URL has been deleted");
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.... is there anybody out there?`);
});
