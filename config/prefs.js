const packagejson = require('../package.json');
const www = require('../bin/www')
let frontDomain = null
let backDomain = null
let noreplyEmail = 'ahmed.derbala@esprit.tn'
let dbUrl = '127.0.0.1'
let dbName = packagejson.name


if (process.env.NODE_ENV == 'test') {
}

if (process.env.NODE_ENV == 'prod') {
    frontDomain = `${www.httpMode}://${packagejson.name}.com`
    backDomain = `${www.httpMode}://api.${packagejson.name}.com`
    noreplyEmail = `noreply@${packagejson.name}.com`
}

const frontPort = www.port - 1000
exports.frontPort = frontPort

module.exports = {
    "company": {
        "name": "ahmed-derbala",
        "description": "one dev enterprise",
        "telephone": "+21626437513",
        "email": "ahmed.derbala@esprit.tn",
        "address": "Tunisia",
        //"logo": "<img src='https://email.ionos.fr/appsuite/api/image/mail/picture?folder=default0%2FINBOX&id=1576688111481899442&uid=0d445881-0f34-4072-b265-9e13689a1fe3' alt='SBP-TECH'>"
    },
    "db": {
        "url": dbUrl,
        "name": dbName
    },
    "signOptions": {
        "issuer": "ahmed-derbala",
        "subject": packagejson.name,
        "audience": "all",
        "expiresIn": "30 days",
        "algorithm": "HS256"
    },
    "emails": {
        "send": false,//send log emails on development mode, by default log emails are sent only in test and prod mode
        "verificationOnRegister": false,//true means when a user register an account it will not be activated unless the user click the link sent to his email
        "noreply": noreplyEmail,
        "error": "ahmed.derbala@esprit.tn",
        "warn": "ahmed.derbala@esprit.tn",
        "info": "ahmed.derbala@esprit.tn",
        "developer": "ahmed.derbala@esprit.tn"
    },
    "frontBaseUrl": frontDomain || `${www.httpMode}://${www.ip}:${frontPort}`,
    "backBaseUrl": backDomain || `${www.httpMode}://${www.ip}:${www.port}`,
    "responseTimeAlert": 20000,//number in milliseconds, if a request takes longer time than this value, a warn email will be sent
    "defaultLang": "fr",
    "dataBaseSync": false, //sync db on development, this slow down server launch time by few seconds
    "forceDataBaseSync": false, //sync db on non-development and development envirement, this slow down server launch time by few seconds
    "overwriteDatabase": false, //only for development envirement, rewrite existing data base tables, ALL DATA IN EXISTING TABLES WILL BE LOST
    "systemWarnings": true //prefer to send or not some warnings on prod like  and responseTimeAlert
}
