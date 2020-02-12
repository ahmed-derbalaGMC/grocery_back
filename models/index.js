'use strict';
const appRootPath = require('app-root-path');
const fs = require('fs');
const path = require('path');
var model = {}

fs.readdirSync(__dirname)
  .forEach(file => {
    if (file != 'index.js') {
      model[require(`${appRootPath}/utils/tools`).myModel(file)] = require(`./${file}`)
    }
  });

module.exports = model;
