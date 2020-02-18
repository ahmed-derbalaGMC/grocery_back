
const appRootPath = require('app-root-path');
var jwt = require('jsonwebtoken');
const privateKey = require(`${appRootPath}/config/secrets`).privateKey;
const log = require(`${appRootPath}/utils/log`).log
const decrypt = require('./tools').decrypt
const deleteFromJson = require('../utils/tools.js').deleteFromJson
const invalidTokenLoginAttempt = require(`${appRootPath}/utils/nremails`).invalidTokenLoginAttempt
const colors = require('colors/safe');
const fs = require('fs');
var path = require('path');


//fetching routes
let routes = []
fs.readdirSync(`${appRootPath}/routes`).forEach(function (file) {
    routes.push(file.substr(0, file.lastIndexOf('.')))
});
exports.routes = routes

exports.tokenAuth = (req, res, next) => {
    //make sure these attributes are not sent on the body
    req.body = deleteFromJson(req.body, ['id', 'isDeleted', 'isActive', 'createdAt', 'updatedAt'])
    //routes that bypass token authentification
    let urlBaseName = req.url.slice(req.url.indexOf('/') + 1, req.url.length)
    urlBaseName = urlBaseName.slice(0, urlBaseName.indexOf('/'))

    let routesToIgnore = [
        "/user/signin",
        "/user/all",

        "/index",
        "/logs",
        "/csv",
        "/validatingPasswordReset",
        "/resetPassword",
        "/export/myEmployees",
        "/user/emailVerification",
        "/qrcode/verifyToken",
        "/feedbacks/create/nonRegisteredUser",
        "/favicon.ico",
    ]

    let urlBaseNameToIgnore = ['product']

    if (!routes.includes(urlBaseName) || routesToIgnore.includes(req.url) || urlBaseNameToIgnore.includes(urlBaseName)) {
        next();
        return null
    } else {
        if (req.headers.token) {
            //decoding token
            return jwt.verify(req.headers.token, privateKey, function (err, decoded) {
                if (err) {
                    log().warn({ message: err, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"], token: req.headers.token });
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
                    //if token exist in session table so its valid, else its not
                    return models.Session.findOne({
                            token: req.headers.token
                        
                    })
                        .then(session => {
                            if (session != null) {
                                if ((req._remoteAddress == decoded.auth.ip)) { //&& (req.headers["user-agent"] == decoded.auth.userAgent)) {
                                    req.cu = decoded.user;
                                    //setting values for offset and limit for pagination
                                    if (req.headers.page && parseInt(req.headers.page) >= 1) {
                                        req.limit = 5;
                                        req.offset = (parseInt(req.headers.page) * req.limit) - req.limit;
                                    } else {
                                        req.offset = 0;
                                        req.limit = 1000;
                                    }
                                    next()
                                    return null
                                } else {
                                    //log().warn({ message: `[TOKEN_MISMATCH_SESSION] ${decoded.user.email} user.id=${decoded.user.id}`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"], token: req.headers.token })
                                    if (process.env.NODE_ENV == 'prod')
                                        return res.status(401).send('token error')
                                    return res.status(401).send('token mismatch session')
                                }
                            } else {
                                //token not found in session so its not valid                               
                                invalidTokenLoginAttempt(decoded.user, req, 'en');
                                log().verbose({ message: `[INVALID_TOKEN] ${decoded.user.email} user.id=${decoded.user._id}`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"], token: req.headers.token })
                                if (process.env.NODE_ENV == 'prod')
                                    return res.status(401).send('token error')
                                return res.status(401).send('[INVALID_TOKEN]');
                            }
                        })
                        .catch(err => {
                            console.log(colors.bgRed(err));
                            log().error({ message: err, route: req.originalUrl, headers: req.headers, body: req.body, ip: req._remoteAddress, userAgent: req.headers["user-agent"] });
                            if (process.env.NODE_ENV == 'prod')
                                return res.status(522).send('fail');
                            return res.status(522).send(err);
                        })
                }
            });
        } else {
            //no token on the header
            if (req.url.indexOf("/user/signup") != -1) { //first time to create a super, no token provided
                next()
                return null
            } else {
                log().warn({ message: `[NO_TOKEN_PROVIDED_ON_HEADER]`, route: req.originalUrl, ip: req._remoteAddress, userAgent: req.headers["user-agent"] })
                if (process.env.NODE_ENV == 'prod')
                    return res.status(401).send('token error')
                return res.status(401).send('no token provided')
            }
        }
    }
}
