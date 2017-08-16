"use strict";

const express       = require('express');
const urlRoutes    = express.Router();

const methodOverride = require('method-override')
const moment = require('moment');
const randomizer    = require("../lib/randomizer");
const protocolChecker = require("../lib/protocolChecker");

module.exports = function(users, urlDatabase) {

  // New URL submission
  urlRoutes.post("/urls/new", (req, res) => {
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
        clickthroughs: 0,
        uniqueClickthroughs: 0,
        visitors: {}
      };
      return res.redirect("/urls/" + shortURL);
    }
  });

  // Update existing shortURL
  urlRoutes.put("/urls/:id", (req, res) => {
    let { id } = req.params;
    let user_id = req.session.user_id;
    urlDatabase[user_id][id]["url"] = protocolChecker(req.body.newURL);
    req.flash('warning', "The details for this URL have been updated.");
    res.redirect("/urls/" + id);
  });

  // Deletion of existing short URL
  urlRoutes.delete("/urls/:id", (req, res) => {
    let user_id = req.session.user_id;
    delete urlDatabase[user_id][req.params.id];
    req.flash('warning', "This URL has been deleted");
    res.redirect('/urls');
  });

  return urlRoutes;

};
