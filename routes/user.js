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

router.post('/logout', function (req, res, next) {
  return models.Session.destroy({
    where: {
      token: req.headers.token
    }
  })
    .then(session => {
      log(req.cu.id).verbose({ message: `${req.cu.email} id=${req.cu.id} loggedOut`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      return res.status(200).send('logged out')
    })
    .catch(err => {
      log().error({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      console.log(colors.bgRed(err));
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
})

//a user profile can be requested by the owner or higher rank user
router.get('/profile/:id', function (req, res, next) {
  //checking params.id
  if (isNaN(req.params.id)) {
    log().debug({ message: `params.id=${req.params.id} error`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
    if (process.env.NODE_ENV == 'prod')
      return res.status(422).send('params error')
    return res.status(422).send(`params.id=${req.params.id} error`)
  }
  let where = {}
  where.isActive = true
  where.GroupId = req.cu.GroupId

  if (!req.params.id || req.params.id == 0 || req.cu.id == req.params.id) {
    where.id = req.cu.id
  } else {
    where.id = req.params.id
    where.role = { [Op.gte]: req.cu.role }
  }

  return models.User.findOne({
    where,
    attributes: {
      exclude: ["password"]
    },
    include: [{
      model: models.Entreprise,
      as: "Entreprise"
    },
    {
      model: models.Group,
      as: "Group"
    },
    {
      model: models.Division,
      as: "Division"
    },
    {
      model: models.Department,
      as: "Department"
    }],
  })
    .then(user => {
      if (user)
        return res.status(200).send(user)
      return res.status(404).send('user not found or inactive')
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl, body: req.body, headers: req.headers, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

router.delete('/destroy', check("id").isNumeric().custom(id => { return id > 0 }), function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log().warn(JSON.stringify(errors.errors))
    return res.status(422).json({
      errors: errors.array()
    });
  }

  if (req.cu.id == req.headers.id || ![1, 2].includes(req.cu.role)) {
    log().verbose({ message: `${req.cu.email} role ${req.cu.role} wants to delete user.id=${req.headers.id}` })
    return res.status(403).send('you have no permission')
  }

  let where = {}
  if (req.cu.role == 1) {
    where.id = req.headers.id
    where.role = 2
  }
  if (req.cu.role == 2) {
    where.id = req.headers.id
    where.GroupId = req.cu.GroupId
  }

  return models.User.destroy({
    where
  })
    .then(() => {
      return res.status(200).send('deleted')
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

router.put('/active', function (req, res, next) {
  if (req.cu.id == req.headers.id && req.cu.role != 1 && req.cu.role != 2) {
    log().verbose({ message: `${req.cu.email} role ${req.cu.role} wants to change status of user.id=${req.headers.id}` })
    return res.status(403).send('you have no permission')
  }
  let where = {}
  if (req.cu.role == 1) {
    where.id = req.headers.id
    where.role = 2
  }
  if (req.cu.role == 2) {
    where.id = req.headers.id
    where.GroupId = req.cu.GroupId
  }
  return models.User.findOne({
    where,
    attributes: {
      exclude: ["password"]
    }
  })
    .then(user => {
      if (user) {
        user.isActive = !user.isActive
        user.save()
        log(user.email).verbose({ message: `user ${user.email} changed status to ${user.isActive} by ${req.cu.email} role ${req.cu.role}` })
        return res.status(200).send(`user active=${user.isActive}`)
      } else {
        log().verbose({ message: `user.id= ${req.headers.id} cannot be deleted`, where })
        return res.status(404).send('user not found')
      }
    })
    .catch(err => {
      log().error({ message: err, route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

//only user can update his profile
router.put('/update/profile', function (req, res, next) {
  return models[myModel].update(
    req.body
    , {
      where: {
        id: req.cu.id
      },
      returning: true,
    })
    .then(myObj => {
      if (myObj[0] == 0) {
        log().verbose({ message: `cannot update ${myModel}.id=${req.headers.id}` })
        return res.status(209).send('not updated');
      }
      //destroying current token
      return models.Session.destroy({
        where: {
          token: req.headers.token
        }
      })
        .then(session => {
          //generating token for logged in user
          const encryptedData = encrypt(JSON.stringify({
            user: myObj[1][0], auth: {
              ip: req._remoteAddress,
              userAgent: req.headers["user-agent"]
            }
          }))

          return jwt.sign(encryptedData, privateKey, signOptions, function (err, token) {
            if (err) {
              log().debug({ message: err });
              return res.status(523).send('operation error');
            }
            //token generated successfully
            //saving current session data
            return models.Session.create({
              UserId: myObj[1][0].id,
              email: myObj[1][0].email,
              token,
              attempt: 0,
              ip: req._remoteAddress,
              userAgent: req.headers["user-agent"]
            })
              .then(session => {
                //attaching generated token to user object
                myObj[1][0].dataValues.token = token;
                log(req.cu.id).verbose({ message: `${req.cu.email} role ${req.cu.role} updated and generated new token succesfully`, route: req.originalUrl })
                return res.status(200).send(myObj[1][0]);
              })
              .catch(err => {
                console.log(colors.bgRed(err));
                log().error({ message: err, route: req.originalUrl });
                if (process.env.NODE_ENV == 'prod')
                  return res.status(522).send('fail');
                return res.status(522).send(err);
              })
          });
        })
        .catch(err => {
          console.log(colors.bgRed(err));
          log().error({ message: err, route: req.originalUrl });
          if (process.env.NODE_ENV == 'prod')
            return res.status(522).send('fail');
          return res.status(522).send(err);
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
//updating contaracts informationss
router.put('/update/employee/', function (req, res, next) {
  //console.log(req.body);
  //console.log(req.body.atWork);
  //console.log(req.body.inBreak);

  //checking access level
  if (![1, 2, 3, 4, 5].includes(req.cu.role)) {
    log().warn({ message: `access denied ${req.cu.email} role ${req.cu.role}`, route: req.originalUrl });
    if (process.env.NODE_ENV == 'prod')
      return res.status(403).send('access denied')
    return res.status(403).send('only for access level 1,2,3,4,5')
  }

  //checking headers.id
  if (isNaN(req.headers.id) || req.headers.id == 0) {
    log().debug({ message: `headers.id=${req.headers.id} error`, route: req.originalUrl })
    if (process.env.NODE_ENV == 'prod')
      return res.status(422).send('params error')
    return res.status(422).send(`headers.id=${req.headers.id} error`)
  }    //check if conenctedUser has rightd to update the employee

  let where = {}
  where.id = req.headers.id
  if (req.cu.role != 1) {
    where.GroupId = req.cu.GroupId
  }

  //only admin and manager can modify atWork and inBreak
  //checking atWork
  /*if ((req.body.atWork) && ([2, 3].includes(req.cu.role))) {
    if (req.body.atWork == true || req.body.atWork == 'true') {
      //req.body.serviceTimeMPW = durationOfDatesInMinutes(attendance.startDate, attendance.endDate)

    }
    if (req.body.atWork == false || req.body.atWork == 'false') {
    }
    else {
      log().debug({ message: `body.atWork=${req.body.atWork} error`, route: req.originalUrl })
      if (process.env.NODE_ENV == 'prod')
        return res.status(422).send('params error')
      return res.status(422).send(`body.atWork=${req.body.atWork} error`)
    }
  }*/

  //checking inBreak
  //console.log(req.body.inBreak.length);

  if (req.body.inBreak) {
    if (req.body.inBreak.length < 1 && req.body.inBreak != 'false' && req.body.inBreak != 'true' && ![2, 3].includes(req.cu.role)) {
      log().debug({ message: `body.inBreak=${req.body.inBreak} error`, route: req.originalUrl })
      if (process.env.NODE_ENV == 'prod')
        return res.status(422).send('params error')
      return res.status(422).send(`body.inBreak=${req.body.inBreak} error`)
    }
  }
  //req.body = deleteFromJson(req.body, ['GroupId', 'EntrepriseId', 'DivisionId', 'DepartmentId'])
  return models.User.update(
    req.body
    , {
      where,
      returning: true,
    })
    .then(async myObj => {
      if (myObj[0] == 0) {
        log().verbose({ message: `cannot update ${myModel}.id=${req.params.id}`, where })
        return res.status(209).send('not updated');
      }
      log().verbose({ message: `${req.cu.email} role ${req.cu.role} updated ${myModel}.id=${myObj[1][0].id}` })
      await updateUserAttendance(req.headers.id, req.body.atWork, req.body.inBreak)
        .then(a => {
        })
        .catch(err => {
          console.log(err);
        })
      return res.status(200).send(myObj[1][0]);
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});


router.put('/changePassword', [check('oldPassword').exists(), check("newPassword").exists(),], function (req, res, next) {
  return models.User.findOne({
    where: {
      id: req.cu.id,
      isDeleted: false
    },
  })
    .then(user => {
      if (user == null) {
        return res.status(404).send('user not found')
      }
      //decrypt password
      return bcryptjs.compare(req.body.oldPassword, user.password, function (err, result) {
        if (err) {
          log().debug({ message: err, route: req.originalUrl });
          return res.status(523).send('operation error')
        }
        //if passwords match
        if (!result) {
          //if password mismatch oldpassword
          log().verbose({ message: 'user ' + user.email + ' password mismatch oldPassword', route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
          return res.status(422).send('wrong password');
        }
        //hashing password
        return bcryptjs.hash(req.body.newPassword, saltRounds, function (err, hash) {
          if (err) {
            log().warn({ message: err, route: req.originalUrl })
            return res.status(523).send('operation error');
          }
          user.password = hash;
          user.save();
          nremails.passwordChanged(user, req, 'en');
          log().verbose({ message: 'user ' + user.email + ' changed password', route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
          return res.status(200).send('password changed');
        });
      });
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl, headers: req.headers, body: req.body, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

//change user email
router.put('/changeEmail', [check('password').exists(), check("newEmail").isEmail(),],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log().warn(JSON.stringify(errors.errors))
      return res.status(422).json({
        errors: errors.array()
      });
    }
    global.models.User.findOne({
      where: {
        id: req.cu.id,
        isActive: true
      },
    }).then(user => {
      if (user) {
        //decrypt password
        bcryptjs.compare(req.body.password, user.password, function (err,
          result) {
          if (err) {
            log().error({
              route: '[/changeEmail]',
              message: err
            });
            return res.status(523).send('operation error')
          } else {
            //if passwords match
            if (result) {
              user.email = req.body.newEmail;
              user.save().then(newEmailUser => {
                nremails.emailChanged(user, req, 'en');
                log().verbose({
                  route: '[/changeEmail]',
                  message: 'user ' + user.email +
                    ' changed email',
                  date: Date(Date.now())
                })
                return res.status(200).send('email changed');
              }).catch(err => {
                log().error({
                  route: '[/changeEmail]',
                  message: '[database fail]',
                  err,
                  date: Date(Date.now())
                });
                return res.status(522).send('database fail');
              })
            } else {
              //if password mismatch oldpassword
              log().verbose({ route: '[/changeEmail]', message: 'user ' + user.email + ' wrong password' })
              return res.status(422).send('wrong password');
            }
          }
        });
      } else {
        return res.status(404).send('user not found')
      }
    })
      .catch(err => {
        console.log(colors.bgRed(err));
        log().error({ message: err, route: req.originalUrl });
        if (process.env.NODE_ENV == 'prod')
          return res.status(522).send('fail');
        return res.status(522).send(err);
      })
  });
//verifying email after successfull register
router.get('/emailVerification/:token', function (req, res, next) {
  if (!req.params.token) {
    log().warn({ route: req.originalUrl, message: 'no token' });
    return res.status(422).send('no token');
  }
  //decoding token
  return jwt.verify(req.params.token, privateKey, function (err, decoded) {
    if (err) {
      log().warn({ message: err, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
      return res.status(401).send('token error')
    } else {
      decoded = {
        iv: decoded.iv,
        encryptedData: decoded.encryptedData
      }
      decoded = JSON.parse(decrypt(decoded))
      if (!decoded.user) {
        log().error({ route: req.originalUrl, message: 'token doesnt have user object', token: req.headers.token })
        return res.status(401).send('token error');
      }
      //token is valid and has user object
      return models.User.findOne({
        where: {
          id: decoded.user.id,
          email: decoded.user.email
        }
      })
        .then(userToVerify => {
          userToVerify.isActive = true
          userToVerify.save();
          return res.status(200).send(userToVerify.email + ' account verified');
        })
        .catch(err => {
          console.log(colors.bgRed(err));
          log().error({ message: err, route: req.originalUrl });
          if (process.env.NODE_ENV == 'prod')
            return res.status(522).send('fail');
          return res.status(522).send(err);
        })
    }
  });
})
//attach an employee to a Workday by a manager or an admin of the same entreprise
router.put('/update/Workday', [check('UserId').isEmail(), check("WorkdayId").exists()], function (req, res, next) {
  //checking if conenctedUser is an admin or a manager
  if (req.cu.role == 2 || req.cu.role == 3) {
    global.models.User.findOne({
      where: {
        id: req.body.UserId,
        isActive: true,
        include: [{
          model: Entreprise,
          as: "Entreprises",
          through: {
            model: UserEntreprise,
            as: "UserEntreprises",
            where: {
              EntrepriseId: req.cu.EntrepriseId
            }
          }
        }]
      },
      attributes: {
        exclude: ["password"]
      }

    })
      .then(user => {
        if (user != null) { //checking user exist
          //checking Workday exist
          global.models.Workday.findOne({
            where: {
              id: req.body.WorkdayId,
              isDeleted: false
            }
          })
            .then(Workday => {
              user.WorkdayId = req.body.WorkdayId
              nremails.WorkdayUpdated(user, req, Workday, 'en') //notifying user
              user.save()
              log().verbose({
                message: 'WorkdayId ' + req.body.WorkdayId +
                  ' attached to ' + user.email,
                route: '[users/update/Workday]',
                date: Date(Date.now())
              });
              return res.status(200).send(user.email +
                ' attached to the Workday successfully')
            })
            .catch(err => {
              console.log(colors.bgRed(err));

              log().error({
                message: err,
                route: '[/Workdays/attachUser]',
                date: Date(Date.now())
              });
              return res.status(522).send('database fail');
            })
        } else {
          return res.status(404).send('user not found')
        }
      })
      .catch(err => {
        console.log(colors.bgRed(err));

        log().error({
          message: err,
          route: '[/Workdays/attachUser]',
          date: Date(Date.now())
        });
        return res.status(522).send('database fail');
      })
  } else {
    log().warn({
      message: req.cu.email + ' role ' + req.cu.role +
        ' wants to update Workday of user ' + req.body.UserId,
      route: '[/Workdays/attachUser]',
      date: Date(Date.now())
    });
    return res.status(403).send('you dont have permission')
  }
});
//admin or manager request the list of his employees and managers
router.get('/all', function (req, res, next) {
  //checking access level
  if (![1, 2, 3, 4, 5].includes(req.cu.role)) {
    log().warn({ message: `access denied ${req.cu.email} role ${req.cu.role}`, route: req.originalUrl });
    if (process.env.NODE_ENV == 'prod')
      return res.status(403).send('access denied')
    return res.status(403).send('only for access level 1,2,3,4,5')
  }
  let where = {}
  where.isDeleted = false
  where.role = { [Op.gt]: req.cu.role }//return lower rank users only

  if (req.headers.atwork) {
    if (req.headers.atwork != 'true' && req.headers.atwork != true && req.headers.atwork != 'false' && req.headers.atwork != false) {
      log(req.cu.id).verbose({ message: `headers.atwork=${req.headers.atwork} format error`, route: req.originalUrl })
      return res.status(422).send('params error')
    }
    where.atWork = req.headers.atwork
  }

  let includeGroup = {
    model: models.Group,
    as: "Group",
  }
  let includeEntreprise = {
    model: models.Entreprise,
    as: "Entreprise",
    required: false
  }
  let includeDivision = {
    model: models.Division,
    as: "Division",
    required: false
  }
  let includeDepartment = {
    model: models.Department,
    as: "Department",
    required: false
  }
  let includeJob = {
    model: models.Job,
    as: "Job",
    required: false
  }

  if (req.headers.active && (req.headers.active == false || req.headers.active == 'false')) {
    where.isActive = false
  } else {
    where.isActive = true
  }

  if (req.headers.search && req.headers.search.length > 0) {
    where[Op.or] = [{
      firstName: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      lastName: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      email: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    },
    {
      matricule: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      telephone: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      gender: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      contractType: {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      '$Entreprise.name$': {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }, {
      '$Entreprise.country$': {
        [Op.iLike]: `%${req.headers.search}%`
      }
    }]
  }

  if (req.cu.role == 1) {
    where.role = 2
  }
  else if (req.cu.role == 2) {
    where.GroupId = req.cu.GroupId
    //if the admin want list of users of certain entreprise
    if (req.headers.entrepriseid && !isNaN(req.headers.entrepriseid) && req.headers.entrepriseid != 0) {
      where.EntrepriseId = req.headers.entrepriseid
    }
  } else if (req.cu.role == 3) {
    where.GroupId = req.cu.GroupId
    where.EntrepriseId = req.cu.EntrepriseId
  }
  else if (req.cu.role == 4) {
    where.GroupId = req.cu.GroupId
    where.EntrepriseId = req.cu.EntrepriseId
    where.DivisionId = req.cu.DivisionId
  }
  else if (req.cu.role == 5) {
    where.GroupId = req.cu.GroupId
    where.EntrepriseId = req.cu.EntrepriseId
    where.DivisionId = req.cu.DivisionId
    where.DepartmentId = req.cu.DepartmentId
  }
  //fetching users
  return models.User.findAndCountAll({
    where,
    attributes: {
      exclude: ["password"]
    },
    include: [includeGroup, includeEntreprise, includeDivision, includeDepartment, includeJob],
    offset: req.offset,
    limit: req.limit,
    distinct: true
  })
    .then(users => {
      //log(req.cu.id).debug({ message: `${req.cu.email} role ${req.cu.role} listed users`, page: req.headers.page, search: req.headers.search, count: users.rows.length, where, route: req.originalUrl })
      return res.status(200).send({ "pageCount": Math.ceil(users.count / req.limit), users })
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //create folder if not exist
    if (!fs.existsSync(`${appRootPath}${photoUploadDir}`)) {
      fs.mkdir(`${appRootPath}${photoUploadDir}`, function (err) {
        if (err) {
          log().error({ message: err, route: req.originalUrl });
        } else {
          log().verbose({ message: `${photoUploadDir} folder created`, route: req.originalUrl });
        }
      });
    }
    cb(null, `${appRootPath}/${photoUploadDir}`);
  },
  filename: function (req, file, cb) {
    req.photoName = `${Date.now()}-${file.originalname}`
    req.body.photo = `${photoUploadDir}/${req.photoName}`
    cb(null, req.photoName);
  }
});
const upload = multer({ storage: storage }).single("photo");

router.put("/upload/photo", upload, function (req, res, next) {
  if (!req.file) {
    log().debug({ message: 'no photo provided', route: req.originalUrl });
    return res.status(422).send("you must provide a photo");
  }

  return models.User.update({
    photo: `${photoUploadDir}/${req.photoName}`
  }, {
    where: {
      id: req.cu.id,
      isActive: true
    },
    returning: true,
    plain: true
  })
    .then(updatedPhoto => {
      log().verbose({ message: `${req.cu.email} id=${req.cu.id} uploaded photo=${updatedPhoto[1].photo}`, route: req.originalUrl });
      return res.status(200).send('photo updated')
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

router.get("/getPhoto", function (req, res, next) {
  let where = {}

  if (!req.headers.id || req.headers.id == 0) {
    where.id = req.cu.id
  } else {
    if (isNaN(req.headers.id)) {
      log().verbose({ message: `headers.id=${req.headers.id} error`, route: req.originalUrl })
      if (process.env.NODE_ENV == 'prod')
        return res.status(422).send('params error')
      return res.status(422).send(`headers.id=${req.headers.id} error`)
    }
    where.id = req.headers.id
  }

  return models.User.findOne({
    where
  })
    .then(user => {
      if (user == null) {
        log().verbose({ message: `[USER_NOT_EXIST] id=${where.id}`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
        return res.status(200).send(base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`)))
      }
      if (fs.existsSync(`${appRootPath}${user.photo}`)) {
        user.photo = base64Img.base64Sync(path.join(`${appRootPath}${user.photo}`));
      } else {
        log().verbose({ message: `[FILE_NOT_EXIST] user.id=${user.id} path=${appRootPath}${user.photo}`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
        user.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
      }
      return res.status(200).send(user.photo)
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, ip: req._remoteAddress, userAgent: req.headers["user-agent"], route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
})

router.delete('/destroy', function (req, res, next) {
  if (isNaN(req.headers.id) || req.headers.id.length < 1 || req.headers.id == 0) {
    log().verbose({ message: `headers.id=${req.headers.id} error`, route: req.originalUrl })
    if (process.env.NODE_ENV == 'prod') return res.status(422).send('params error')
    return res.status(422).send(`headers.id=${req.headers.id} error`)
  }

  //checking access level
  if (![2].includes(req.cu.role)) {
    log().warn({ message: `access denied ${req.cu.email} role ${req.cu.role}`, route: req.originalUrl });
    if (process.env.NODE_ENV == 'prod') return res.status(403).send('access denied')
    return res.status(403).send('only for access level 2')
  }
  let where = {}
  where.id = req.headers.id
  where.GroupId = req.cu.GroupId
  return models[myModel].destroy({
    where
  })
    .then(() => {
      log(req.cu.id).verbose({ message: `${req.cu.email} role ${req.cu.role} destroyed ${myModel}`, where, route: req.originalUrl })
      return res.status(200).send('destroyed')
    })
    .catch(err => {
      console.log(colors.bgRed(err));
      log().error({ message: err, route: req.originalUrl });
      if (process.env.NODE_ENV == 'prod')
        return res.status(522).send('fail');
      return res.status(522).send(err);
    })
});

module.exports = router;
