const appRootPath = require('app-root-path');
var express = require('express');
var router = express.Router();
const env = process.env.NODE_ENV || 'development';
const { check, validationResult } = require('express-validator');
var log = require(`${appRootPath}/utils/log`).log
const bcryptjs = require('bcryptjs');
const saltRounds = 10;
const fs = require("fs");
var jwt = require('jsonwebtoken');
var privateKey = require(`${appRootPath}/config/secrets`).privateKey;
const signOptions = require(`${appRootPath}/config/prefs`).signOptions
let encrypt = require('../utils/tools').encrypt
var decrypt = require('../utils/tools').decrypt
const deleteFromJson = require('../utils/tools').deleteFromJson
const nremails = require('../utils/nremails');
const prefs = require(`${appRootPath}/config/prefs`)
const multer = require("multer");
const base64Img = require("base64-img");
const photoUploadDir = '/uploads/users'
const path = require("path");
const myModel = require('../utils/tools.js').myModel(__filename)
const colors = require('colors/safe');
const updateUserAttendance = require('../utils/tools').updateUserAttendance
const msg_NewUserRegistered = require(`${appRootPath}/utils/messages`).msg_NewUserRegistered
const changePasswordWarning = require(`${appRootPath}/utils/nremails`).changePasswordWarning
//const NumClientsInRoom = require(`${appRootPath}/utils/tools`).NumClientsInRoom
const errorHandler = require(`${appRootPath}/utils/tools`).errorHandler

router.post('/add', function (req, res, next) {
  return models.Product(req.body)
    .save((err, myObj) => {
      if (err) {
        return res.status(errorHandler(err).status).send(errorHandler(err).error)
      }
      log().verbose({ message: 'saved' })
      return res.status(200).send(`product added`)
    });
})

//a user can login with his email or telephone
router.get('/sort/', function (req, res, next) {
  return models.Product.find({ $or: [{ name: req.query.name}, {quantity: req.query.quantity }] })
    .then(Product => {
      if (Product == null) {
        log().verbose({ message: `no products were found`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
        return res.status(404).send('no products were found')
      }
      return res.status(200).send(Product)
    })
    .catch(err => {
      log().error({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      console.log(colors.bgRed(err));
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
})

//a user can login with his email or telephone
router.get('/all/', function (req, res, next) {
  return models.Product.find()
    .then(Product => {
      if (Product == null) {
        log().verbose({ message: `no products were found`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
        return res.status(404).send('no products were found')
      }
      return res.status(200).send(Product)
    })
    .catch(err => {
      log().error({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      console.log(colors.bgRed(err));
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
})



module.exports = router;
