const express = require("express");
const PORT = process.env.PORT || 8080; // default port 8080

const methodOverride = require('method-override')
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const moment = require('moment');
const flash = require('express-flash');
const randomizer = require("./lib/randomizer");


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

const userRoutes = require("./routes/users")(users, urlDatabase);
const urlRoutes = require("./routes/urls")(users, urlDatabase);
app.use("/users", userRoutes)
app.use("/urls", urlRoutes);

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
      uniqueClickthroughs:  urlEntry["uniqueClickthroughs"],
      visitors:  urlEntry["visitors"]
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
        let visitorLog = urlDatabase[key][url]["visitors"];

        if (user_id) {
          if (visitorLog[user_id] == undefined) {
            visitorLog[user_id] = [];
            visitorLog[user_id].push(moment().format("DD MMM YYYY HH:mm A"));
          } else {
            visitorLog[user_id].push(moment().format("DD MMM YYYY HH:mm A"));
          }
        }
        if (!user_id) {
          let user_id = randomizer();
          req.session.user_id = user_id;
          visitorLog[user_id] = [];
          visitorLog[user_id].push(moment().format("DD MMM YYYY HH:mm A"));
        }

        let k = 0;
        for (visitor in visitorLog) {
          k++
        }
        urlDatabase[key][url]["uniqueClickthroughs"] = k;
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.... is there anybody out there?`);
});
