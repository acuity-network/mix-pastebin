"use strict";

var express = require('express');
var app = express();

app.use(express.static('public'));

app.listen(3002, function () {
  console.log('Pastebin dapp listening on port 3002!');
})
