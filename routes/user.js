const appRootPath = require('app-root-path');
var express = require('express');
var router = express.Router();
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

router.post('/signup', [check('email').isEmail()], function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log().verbose(JSON.stringify(errors.errors))
    return res.status(422).json({ errors: errors.array() });
  }

  return bcryptjs.hash(req.body.password, saltRounds, function (err, hash) {
    if (err) {
      log().warn({ message: err, route: req.originalUrl })
      return res.status(523).send('operation error');
    }

    req.body.password = hash;
    return models.User(req.body)
      .save((err, myObj) => {
        if (err) {
          return res.status(errorHandler(err).status).send(errorHandler(err).error)
        }

        if (prefs.emails.verificationOnRegister == true) {
          //generating email token
          const encryptedData = encrypt(JSON.stringify({
            user: {
              id: myObj.id,
              email: req.body.email
            },
            auth: {
              ip: req._remoteAddress,
              userAgent: req.headers["user-agent"]
            }
          }))
          jwt.sign(encryptedData, privateKey, signOptions, function (err, token) {
            if (err) {
              log().debug({ message: err });
              return res.status(523).send('operation error');
            } else {
              //token generated successfully
              nremails.verificationOnRegiser(token, req, 'en')
            }
          });
          //end generating email token
        }
        delete myObj.password;
        log().verbose({ message: `new user created`, myObj });
        return res.status(201).send(myObj)
      })
  });
})

//a user can login with his email or telephone
router.post('/signin', [check("email").exists(), check("password").exists(),], function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log().warn(JSON.stringify(errors.errors))
    return res.status(422).json({ errors: errors.array() });
  }

  return models.User.findOne({ email: req.body.email })
    .then(user => {
      if (user == null) {
        log().debug({ message: `login=${req.body.login} not found`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
        return res.status(404).send('no user found with ' + req.body.login)
      }
      //decrypt password
      return bcryptjs.compare(req.body.password, user.password, function (err, result) {
        if (err) {
          log().debug({ message: `[BCRYPTJS_ERROR] ${err}` });
          return res.status(523).send('operation error')
        }
        //if passwords match
        if (result) {
          //delete user.dataValues.password;
          //generating token for logged in user
          const encryptedData = encrypt(JSON.stringify({
            user, auth: {
              ip: req._remoteAddress,
              userAgent: req.headers["user-agent"]
            }
          }))
          //signing token
          return jwt.sign(encryptedData, privateKey, signOptions, function (err, token) {
            if (err) {
              log().verbose({ message: err });
              return res.status(523).send('operation error');
            }
            //token generated successfully
            //attaching generated token to user object, we need to parse mongooe document            
            let newUser = JSON.parse(JSON.stringify(user));
            delete newUser.password;
            newUser.token = token;

            //saving current session data
            return models.Session({
              UserId: user._id,
              email: user.email,
              attempt: 0,
              ip: req._remoteAddress,
              userAgent: req.headers["user-agent"],
              token,

            })
              .save((err,session) => {
                //everything is ok, send back user object
                log(user.id).verbose({ message: `${user.email} loggedIn`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
                return res.status(200).send(newUser);
              })
              .catch(err => {
                log().error({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
                console.log(colors.bgRed(err));
                if (process.env.NODE_ENV == 'production')
                  return res.status(522).send('fail');
                return res.status(522).send(err);
              })
          });
          //end generating token for logged in userr  
        } else {
          //incorrect password
          return res.status(401).send('wrong password')
        }

      })
    })
    .catch(err => {
      log().error({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      console.log(colors.bgRed(err));
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
})

router.get('/all', function (req, res, next) {
  return models.User.find()
  .then(users => {
    if (users == null) {
      return res.status(404).send('no user found with ')
    }
    return res.status(200).send(users)
  })

})

module.exports = router;
