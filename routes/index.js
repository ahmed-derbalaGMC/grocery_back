const appRootPath = require('app-root-path');
var express = require('express');
var router = express.Router();
const path = require('path');
const packagejson = require('../package.json');
const www = require('../bin/www')
const prefs = require(`${appRootPath}/config/prefs`)
const ip = require("ip");
var winston = require('winston');//logging
const rimraf = require('rimraf');
const nremails = require('../utils/nremails')
const { check, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
const privateKey = require(`${appRootPath}/config/secrets`).privateKey;
const log = require(`${appRootPath}/utils/log`).log
const encrypt = require('../utils/tools').encrypt
const signOptions = require(`${appRootPath}/config/prefs`).signOptions
const decrypt = require('../utils/tools').decrypt
const getRandomNumber = require('../utils/tools').getRandomNumber
const bcryptjs = require('bcryptjs');
const saltRounds = 10;
const fs = require('fs');
const colors = require('colors/safe');
const msg_UserNotFound = require(`${appRootPath}/utils/messages`).msg_UserNotFound
const msg_PasswordGenerated = require(`${appRootPath}/utils/messages`).msg_PasswordGenerated

router.get('/doc', function (req, res) {
  //res.sendFile(path.join(global.appRootPath + '/doc.html'));
  if (process.env.NODE_ENV != 'prod') {
    res.sendFile(path.join(appRootPath + '/docs/doc.html'));
  } else {
    //return res.status(200).send('available only on development mode')
    res.redirect(`http://${ip.address()}:${prefs.frontendPort}`)
  }
});

router.get('/man', function (req, res) {
  //res.sendFile(path.join(global.appRootPath + '/doc.html'));
  if (process.env.NODE_ENV != 'prod') {
    res.sendFile(path.join(appRootPath + '/docs/man.txt'));
  } else {
    //return res.status(200).send('available only on development mode')
    res.redirect(`http://${ip.address()}:${prefs.frontendPort}`)
  }
});

router.get('/socket', function (req, res) {
  if (process.env.NODE_ENV != 'prod') {
    res.sendFile(path.join(appRootPath + '/public/socketTester.html'));
  } else {
    //return res.status(200).send('available only on development mode')
    res.redirect(`http://${ip.address()}:${prefs.frontendPort}`)
  }
});

router.get('/', function (req, res) {
  if (process.env.NODE_ENV == 'prod') {
    return res.status(200).send(`Not available on prod mode | ${packagejson.name} ${packagejson.version}`)
  }
  let filename = packagejson.name
  let errormessage = ''

  if (fs.existsSync(`${appRootPath}/logs/${req.query.id}.log`)) {
    filename = req.query.id
  } else if (req.query.id != null) {
    errormessage = `${req.query.id}.log was not found, you can reset logs via ${ip.address()}:${www.port}/resetLogs`
  }

  let options2 = {
    file: {
      level: 'verbose',
      filename: `${appRootPath}/logs/${filename}.log`,
      timestamp: true,
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      json: true,
      format: winston.format.combine(
        winston.format.simple(),
        winston.format.json(),
      )
    }
  }

  let logQuery = winston.createLogger({
    transports:
      new winston.transports.File(options2.file),
    exitOnError: false, // do not exit on handled exceptions
  });

  if (!req.query.limit) {
    req.query.limit = 1000
  }
  if (!req.query.order) {
    req.query.order = 'desc'
  }
  let queryOptions = {
    from: req.query.from,
    until: req.query.until,
    limit: req.query.limit,
    start: 0,
    order: req.query.order,
    //fields: ['message']
  }
  return logQuery.query(queryOptions, function (err, results) {
    if (err) {
      return err
    }
    let finalResulat = '';
    let logsCounter = 0
    for (let i = 0; i < results.file.length; i++) {
      if (req.query.level) {
        if (req.query.level == results.file[i].level) {
          logsCounter++
          finalResulat = finalResulat + '\n\n\n' + JSON.stringify(results.file[i])
        }
      } else {
        logsCounter++
        finalResulat = finalResulat + '\n\n\n' + JSON.stringify(results.file[i])
      }
    }

    let minutes=0, hours=0, days=0
    let serverRun = Math.floor((((Math.abs(new Date() - new Date(www.appStartedAt))) / 1000) / 60))

    if (serverRun >= 1440) {
      days = Math.floor((serverRun / 60) / 24)
      serverRun = serverRun - days*24*60
    }
    if (serverRun > 60 && serverRun < 1440) {
      hours = Math.floor(serverRun / 60)
      serverRun = serverRun - hours*60
    }

    minutes = serverRun

    if (finalResulat.length == 0) {
      errormessage = `you can reset logs via ${ip.address()}:${www.port}/resetLogs`
    }
    return res.end(
      `${packagejson.name} ${packagejson.version}
      applied filters: ${JSON.stringify(req.query)}
      loaded ${logsCounter} Logs from ${filename}.log | you can check the manual at http://${www.ip}:${www.port}/man
      ${errormessage}

    filter options
    level:error, verbose, warn, info, default=none
    order:asc, desc, default=desc
    limit:default=1000
    id:default=${packagejson.name}, you can set a user id like ?id=1

    NODE_ENV=${process.env.NODE_ENV}
    appRootPath: ${appRootPath}

    server startedAt    : ${www.appStartedAt}
    current server time : ${new Date()}
    runtime duration    : ${days} days ${hours} hours ${minutes} minutes ${finalResulat}`)
  });
})

router.get('/resetLogs', function (req, res) {
  if (process.env.NODE_ENV == 'prod') {
    return res.status(200).send('available only on development mode')
  }
  rimraf(`${appRootPath}/logs/*`, function () { res.send('done'); });
})

//requesting to reset user password
router.post("/resetPassword", check("email").isEmail(), function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }

  return models.User.findOne({
    where: {
      email: req.body.email,
      isActive: true
    },
    attributes: {
      exclude: ["password"]
    }
  })
    .then(user => {
      if (!user) {
        log().debug({ message: `${req.body.email} not found or not active`, route: req.originalUrl });
        return res.status(404).send(msg_UserNotFound(req.body.email,prefs.defaultLang))
      }
      //signing token
      const encryptedData = encrypt(JSON.stringify({
        user, auth: {
          ip: req._remoteAddress,
          userAgent: req.headers["user-agent"]
        }
      }))
      return jwt.sign(encryptedData, privateKey, signOptions, function (err, token) {
        if (err) {
          log().verbose({ message: err });
          return res.status(523).send('operation error');
        }
        nremails.passwordReset(user, req, token, user.lang)
        log(user.id).verbose({ message: `password reset for email ${req.body.email} user.id=${user.id}`, route: req.originalUrl });
        return res.status(200).send(`password reset request sent to ${user.email}`)
      })
    })
    .catch(err => {
          console.log(colors.bgRed(err));
          log().error({ message: err, route: req.originalUrl });
          if (process.env.NODE_ENV == 'prod')
            return res.status(522).send('fail');
          return res.status(522).send(err);
        })
});

//this route for the link sent to the email
router.get("/validatingPasswordReset", function (req, res, next) {
  //decoding token
  return jwt.verify(req.query.token, privateKey, function (err, decoded) {
    if (err) {
      log().warn({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      if (process.env.NODE_ENV == 'prod')
        return res.status(401).send('token error')
      return res.status(401).send(err)
    } else {
      //token decryption
      decoded = { iv: decoded.iv, encryptedData: decoded.encryptedData }
      decoded = JSON.parse(decrypt(decoded))
      if (!decoded.user) {
        log().error({ message: `[TOKEN_DOESNT_HAVE_USER_OBJECT]`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"], token: req.headers.token })
        if (process.env.NODE_ENV == 'prod')
          return res.status(401).send('token error')
        return res.status(401).send('[TOKEN_DOESNT_HAVE_USER_OBJECT]');
      }
      //token containg valid user object
      return models.User.findOne({
        where: {
          email: decoded.user.email,
          isActive: true
        }
      })
        .then(user => {
          if (!user) {
            log().verbose({ message: `reset password request for non existing or non active user ${req.body.email}`, route: req.originalUrl });
            return res.status(404).send('no user with email=' + req.body.email)
          }
          //encrypting new password
          let generatedPassword = getRandomNumber(1000, 10000).toString()

          return bcryptjs.hash(generatedPassword, saltRounds, function (
            err, hash) {
            if (err) {
              log().warn({ route: req.originalUrl, message: err })
              return res.status(523).send('operation error');
            } else {
              user.password = hash
              user.save()
              nremails.passwordResetValidation(user, generatedPassword, req, user.lang)
              log(user.email).verbose({ message: `new password generated for user ${user.email}`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
              return res.status(200).send(msg_PasswordGenerated(user,user.lang))
            }
          })
        })
        .catch(err => {
          log().error({ message: err, route: req.originalUrl });
          if (process.env.NODE_ENV == 'prod')
            return res.status(522).send('fail');
          return res.status(522).send(err);
        })
    }
  })
})


module.exports = router;
