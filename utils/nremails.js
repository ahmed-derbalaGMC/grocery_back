/**
 * this file contains standard emails sent by server, lang is language choosen by the user
 */
const appRootPath = require('app-root-path');
const sendNoReplyEmail = require('./tools').sendNoReplyEmail
var ip = require("ip");
var www = require('../bin/www')
const packagejson = require('../package.json');
const prefs = require(`${appRootPath}/config/prefs`)


exports.failedLoginAttempt = (user, req, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {

            sendNoReplyEmail(user.email, '3 failed login attempts',
                'Hi ' + user.firstName + ' ' + user.lastName + '<br>' +
                'your ' + packagejson.name + ' account had 3 failed login attempts <br>' +
                'ip: ' + req._remoteAddress + '<br>' +
                'browser: ' + req.headers["user-agent"] + '<br>' +
                'date: ' + Date(Date.now()))
        }

}

exports.invalidTokenLoginAttempt = (user, req, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {

            let to =user.email;
            let subject = 'Usage of old token detected';
            let html =
                `Hi ${user.firstName} ${user.lastName} <br>
                invalid token is a token of loggedout or password changed sessions <br>
                we detected that an invalid token of your ${packagejson.name} account has been used <br>
                you should take steps to secure your device <br><br>
                ip: ${req._remoteAddress} <br>
                browser: ${req.headers["user-agent"]} <br>
                date: ${Date(Date.now())}`
                sendNoReplyEmail(to, subject, html)
        }
}

exports.invalidSocketTokenLoginAttempt = (user, userAgent, ip, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {

            let to =user.email;
            let subject = 'Login attempt with old token detected';
            let html =
                `Hi ${user.firstName} ${user.lastName} <br>
                invalid token is a token of loggedout or password changed session <br>
                we detected a login attempt with invalid token to your ${packagejson.name} account <br>
                you should take steps to secure your device <br><br>
                ip: ${ip} <br>
                browser: ${userAgent} <br>
                date: ${Date(Date.now())}`
                sendNoReplyEmail(to, subject, html)
        }
}

exports.changePasswordWarning = (user, req, lang) => {
    //if (env != 'development') {

        if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {

            sendNoReplyEmail(user.email, 'Please change password',
                'Hi ' + user.firstName + ' ' + user.lastName + '<br>' +
                'your ' + packagejson.name + ' account had 5 failed login attempts <br>' +
                'we advise you to change your password' +
                'ip: ' + req._remoteAddress + '<br>' +
                'browser: ' + req.headers["user-agent"] + '<br>' +
                'date: ' + Date(Date.now()))
        }

}

exports.passwordChanged = (user, req, lang) => {
    //if (env != 'development') {

        if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {

            sendNoReplyEmail(user.email, 'Your password is changed',
                'Hi ' + user.firstName + ' ' + user.lastName + '<br>' +
                'your ' + packagejson.name + ' password has been changed <br>' +
                'ip: ' + req._remoteAddress + '<br>' +
                'browser: ' + req.headers["user-agent"] + '<br>' +
                'date: ' + Date(Date.now()))
        }

}

exports.passwordReset = (user, req,token, lang) => {
        if (!lang || lang == 'en') {
            let to = user.email

            let subject = `Password reset request`

            let html = `Hi ${user.firstName} ${user.lastName} <br>
            a password reset has been requested for your account.<br>
            If you did not please ignore this email, nothing harmful to your account is done.<br>
            if you already requested a password reset please click the link below and
             be waiting another email having a new generated password<br><br>
            ${prefs.backBaseUrl}/validatingPasswordReset/?token=${token}<br><br>

            date: ${Date(Date.now())}<br>
            ip: ${req._remoteAddress}<br>
            browser: ${req.headers['user-agent']}`
            return sendNoReplyEmail(to, subject, html)
        }

        if (lang == 'fr') {
            let to = user.email
            let subject = `Demande de reinitialisation du mot de passe `
            let html = `Bonjour ${user.firstName} ${user.lastName} <br>
            On a recu une demande de reinitialisation de mot de passe pour votre compte.<br>
            Si vous n'avez pas fait cette demande, veillez ignorer cet email. votre compte est en securite<br>
            Si vous avez deja fait une demande, veillez cliquer sur le lien en dessous et veillez attendre un autre email contient un nouveau mot de passe genere automatiquement <br><br>
            ${prefs.backBaseUrl}/validatingPasswordReset/?token=${token}<br><br>

            date: ${Date(Date.now())}<br>
            ip: ${req._remoteAddress}<br>
            browser: ${req.headers['user-agent']}`
            return sendNoReplyEmail(to, subject, html)
        }
}

exports.passwordResetValidation = (user,generatedpassword, req, lang) => {
        if (!lang || lang == 'en') {
            let to = user.email
            let subject = `Password reset approved`
            let html =`Hi ${user.firstName} ${user.lastName} <br>
            a password reset request has been approved for your account.<br>
            your new password is: ${generatedpassword}<br>
            now try to login with the new password<br><br>
            ${prefs.frontBaseUrl}/#!/login <br><br>

            date: ${Date(Date.now())}<br>
            ip: ${req._remoteAddress}<br>
            browser: ${req.headers['user-agent']}`
            return sendNoReplyEmail(to, subject, html)
        }

        if (lang == 'fr') {
            let to = user.email
            let subject = `Reinitialization de mot de passe approuve`
            let html =`Bonjour ${user.firstName} ${user.lastName} <br>
            La reinitialisation du mot de passe pour votre compte est approuve.<br>
            nouveau mot de passe : ${generatedpassword}<br>
            essayez de se connecter maintenent <br><br>
            ${prefs.frontBaseUrl}/#!/login <br><br>

            date: ${Date(Date.now())}<br>
            ip: ${req._remoteAddress}<br>
            browser: ${req.headers['user-agent']}`
            return sendNoReplyEmail(to, subject, html)
        }
}

exports.emailChanged = (user, req, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
            if (!lang || lang == 'en') {

            sendNoReplyEmail(user.email, 'Your email is changed',
                'Hi ' + user.firstName + ' ' + user.lastName + '<br>' +
                'your ' + packagejson.name + ' email has been changed <br>' +
                'ip: ' + req._remoteAddress + '<br>' +
                'browser: ' + req.headers["user-agent"] + '<br>' +
                'date: ' + Date(Date.now()))
        }

}

exports.verificationOnRegiser = (token, req, lang) => {

        if (!lang || lang == 'en') {
            sendNoReplyEmail(req.body.email, 'Email verification',
                'Hi ' + req.body.firstName + ' ' + req.body.lastName + '<br>' +
                'a ' + packagejson.name + ' user account has been created with this email <br>' +
                'please click the following link to verify the email <br><br>' +
                ip.address() + ':' + www.port + '/user/emailVerification/' + token + '<br><br>' +
                'ip: ' + req._remoteAddress + '<br>' +
                'browser: ' + req.headers["user-agent"] + '<br>' +
                'date: ' + Date(Date.now()))
        }

}

exports.feedback = (to, user, req, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {
            sendNoReplyEmail(to, `Type ${req.body.type} feedback`, `Hi comrade! <br>
            ${user.firstName} ${user.lastName}, email: ${user.email} has a feedback for you:<br><br>
            Subject: ${req.body.subject}<br><br>
            ${req.body.text}<br>
            ip: ${req._remoteAddress}<br>
            browser: ${req.headers["user-agent"]}<br>
            date: ${Date(Date.now())}`)
        }

}

exports.WorkdayUpdated = (user, req,Workday, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {
            let to = user.email

            let subject = `Your Workday was updated`

            let html = `Hi ${user.firstName} ${user.lastName} <br>
            you are affected a new Workday as described below:<br><br>
            ${JSON.stringify(Workday)}<br>

            date: ${Date(Date.now())}`

            sendNoReplyEmail(to, subject, html)
        }

}

exports.email_ReplacementRequest = (cu,user, replacement, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {
            let to = user.email
            let subject = `A replacement is available`
            let html = `Hi ${user.firstName} ${user.lastName} <br>
            your colleague ${cu.firstName} ${cu.lastName} requested that someone replaces him <br>
            date: ${replacement.date} <br>
            from: ${replacement.startTime} <br>
            to: ${replacement.endTime} <br>`

            sendNoReplyEmail(to, subject, html)
        }
        if (!lang || lang == 'fr') {
            let to = user.email
            let subject = `Un remplacement est ouvert`
            let html = `Bonjour ${user.firstName} ${user.lastName} <br>
            votre collegue ${cu.firstName} ${cu.lastName} a cree une demande de conge <br>
            date: ${replacement.date} <br>
            de: ${replacement.startTime} <br>
            jusqu'a: ${replacement.endTime} <br>`

            sendNoReplyEmail(to, subject, html)
        }
}

exports.email_replacementOpinion = (cu,user, replacement,opinion, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {
            let to = user.email
            let subject = `Replacement opinion`
            let html = `Hi ${user.firstName} ${user.lastName} <br>
            ${cu.firstName} ${cu.lastName} expressed his opinion of a replacement <br>
            date: ${replacement.date} <br>
            from: ${replacement.startTime} <br>
            to: ${replacement.endTime} <br>`

            sendNoReplyEmail(to, subject, html)
        }
        if (!lang || lang == 'fr') {
            let to = user.email
            let subject = `Un remplacement est ouvert`
            let html = `Bonjour ${user.firstName} ${user.lastName} <br>
            votre collegue ${cu.firstName} ${cu.lastName} a cree une demande de conge <br>
            date: ${replacement.date} <br>
            de: ${replacement.startTime} <br>
            jusqu'a: ${replacement.endTime} <br>`

            sendNoReplyEmail(to, subject, html)
        }
}

exports.email_replacementAnswer = (cu,user, replacement,answer, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return false
        if (!lang || lang == 'en') {
            let to = user.email
            let subject = `Replacement Answer`
            let html = `Hi ${user.firstName} ${user.lastName} <br>
            ${cu.firstName} ${cu.lastName} answered ${answer} for a replacement. <br>
            reason: ${replacement.reason} <br>
            date: ${replacement.date} <br>
            from: ${replacement.startTime} <br>
            to: ${replacement.endTime} <br>`

            sendNoReplyEmail(to, subject, html)
        }
        if (!lang || lang == 'fr') {
            let to = user.email
            let subject = `Reponse à un remplacement`
            let html = `Bonjour ${user.firstName} ${user.lastName} <br>
            votre collegue ${cu.firstName} ${cu.lastName} a repondu ${answer} pour un remplacement<br>
            date: ${replacement.date} <br>
            de: ${replacement.startTime} <br>
            jusqu'a: ${replacement.endTime} <br>`

            sendNoReplyEmail(to, subject, html)
        }
}
exports.email_VacationRequest = (cu,user, vacation, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return     false
        if (!lang || lang == 'en') {
            let to = user.email
            let subject = `Vacation request`
            let html = `Hi ${user.firstName} ${user.lastName} <br>
            your employee ${cu.firstName} ${cu.lastName} requested a vacation <br>
            from: ${vacation.startDate} <br>
            to: ${vacation.enddate} <br>`
            sendNoReplyEmail(to, subject, html)
        }

        if (lang == 'fr') {
            let to = user.email
            let subject = `Demande de conge`
            let html = `Bonjour ${user.firstName} ${user.lastName} <br>
            votre employe ${cu.firstName} ${cu.lastName} a demande un conge <br>
            de: ${vacation.startDate} <br>
            jusqua: ${vacation.endDate} <br>`
            sendNoReplyEmail(to, subject, html)
        }
}

exports.email_VacationResponse = (cu,user, vacation, lang) => {
    if (prefs.emails.send == false && process.env.NODE_ENV != 'prod') return     false
        if (!lang || lang == 'en') {
            let to = user.email
            let subject = `Vacation response`
            let html = `Hi ${user.firstName} ${user.lastName} <br>
            your vacation ${vacation.reason} <br>
            from: ${vacation.startDate} <br>
            to: ${vacation.enddate} <br>
            was ${vacation.status} by ${cu.firstName} ${cu.lastName}`
            sendNoReplyEmail(to, subject, html)
        }

        if (lang == 'fr') {
            if (vacation.status == 'accepted') vacation.status = 'accepte'
            if (vacation.status == 'refused') vacation.status = 'refuse'

            let to = user.email
            let subject = `Reponse au conge`
            let html = `Bonjour ${user.firstName} ${user.lastName} <br>
            votre conge ${vacation.reason} <br>
            de: ${vacation.startDate} <br>
            jusqua: ${vacation.endDate} <br>
            a ete ${vacation.status} par ${cu.firstName} ${cu.lastName}`
            sendNoReplyEmail(to, subject, html)
        }
}
