/**
 * this file has the logging system
 * logging system written in seperate file to make it easy to integrates in other projects and to be extensible as possible 
 */

const appRootPath = require('app-root-path');
const winston = require('winston');//logging module
const Transport = require('winston-transport');//winston custom transport
const packagejson = require(`${appRootPath}/package`);
const prefs = require(`${appRootPath}/config/prefs`);
const colors = require('colors/safe');
const nodemailer = require("nodemailer");
const secrets = require(`${appRootPath}/config/secrets`)

const emailSignature = `<br><br>------------------------
${prefs.company.name} ${prefs.company.description} ------------------------<br>
telephone: ${prefs.company.telephone}  email: ${prefs.company.email}<br><br>
address: ${prefs.company.address}<br><br>
${prefs.company.logo}`

//log(name_of_file).level() to save the log in /logs/name_of_file.log
//log().level() to save the log in /logs/project_name.log
let log = exports.log = (logFilename) => {
    //console.log('\n');//to make console more readable
    /*const myFormat2 = winston.format.printf(({ ip, userAgent, level, message, label, route, where, page, search, count, decoded, info, timestamp, token,request }) => {
        return JSON.stringify({ timestamp, level, message, decoded, info, where, page, search, count, route, ip, userAgent, token,request })
    });*/
    const myFormat = winston.format.printf(
        (msg) => JSON.stringify(msg)
    );

    if (!logFilename) logFilename = `${packagejson.name}`

    let options = {
        file: {
            level: 'verbose',
            filename: `${appRootPath}/logs/${logFilename}.log`,
            //timestamp: true,
            handleExceptions: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            json: true,
            format:
                winston.format.combine(
                    winston.format.timestamp({
                        format: 'YYYY-MM-DD--HH:mm:ss.SSS'
                    }),
                    myFormat
                )
        },
        console: {
            level: 'debug',
            json: true,
            handleExceptions: true,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD--HH:mm:ss.SSS'
                }),
                //myFormat,
                winston.format.colorize(),
                winston.format.json(),
                winston.format.simple()
            )
        },
    };
    console.log();//to make terminal more readable
    // instantiate a new Winston Logger with the settings defined above
    if (prefs.emails.send == true || process.env.NODE_ENV == 'prod' || process.env.NODE_ENV == 'test') {
        return winston.createLogger({
            transports: [
                new winston.transports.File(options.file)/*({ 'timestamp': true })*/,
                new winston.transports.Console(options.console),
                new EmailTransport()
            ],
            exitOnError: false, // do not exit on handled exceptions
        });
    } else {
        return winston.createLogger({
            transports: [
                new winston.transports.File(options.file),
                new winston.transports.Console(options.console),
            ],
            exitOnError: false,
        });
    }
}

//streams are the output to console
//attached to morgan, express logger (app.js)
log.streamProd = {
    write: function (request, encoding) {
        let statusCode = request.slice(0, 1)
        if (statusCode == 2) {
            log().verbose(colors.bgGreen(request));//morgan logging
        }
        else if (statusCode == 3) {
            log().verbose(colors.bgCyan(request));
        }
        else if (statusCode == 4) {
            log().verbose(colors.bgYellow(request));//morgan logging
        } else {
            log().verbose(colors.bgRed(request));//morgan logging
        }
        //checkin responsetimealert
        let rt = request.slice(request.indexOf('[*') + 2, request.indexOf('*]')) //rt like response time
        if (parseInt(rt) > prefs.responseTimeAlert && prefs.systemWarnings == true) {
            log().warn({ message: `request taking more than ${prefs.responseTimeAlert} ms`, request })
        }
        console.log();//to make console more readable
    },
};

//non-prod envirement
log.stream = {
    write: function (request, encoding) {
        let statusCode = request.slice(0, 1)
        if (statusCode == 2) {
            log().debug(colors.bgGreen(request));
        }
        else if (statusCode == 3) {
            log().debug(colors.bgCyan(request));
        }
        else if (statusCode == 4) {
            log().debug(colors.bgYellow(request));
        } else {
            log().debug(colors.bgRed(request));
        }
        //checkin responsetimealert
         let rt = request.slice(request.indexOf('[*') + 2, request.indexOf('*]')) //rt like response time
         if (parseInt(rt) > prefs.responseTimeAlert) {
             log().warn({ message: `request taking more than ${prefs.responseTimeAlert} ms`, request })
         }
        console.log();//to make console more readable
    },
};

//sending emails with winston on prod
class EmailTransport extends Transport {
    constructor(opts) {
        super(opts);
    }
    async log(info, callback) {
        /*setImmediate(() => {
            this.emit('logged', info);
        });*/        
        
        let transporter = nodemailer.createTransport({
            host: "smtp.ionos.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: prefs.emails.noreply,
                pass: secrets.noreplyPassword
            }
        });
        let to;
        switch (info.level) {
            case 'error':
                if (process.env.NODE_ENV == 'prod' || process.env.NODE_ENV == 'test') {
                //    if (process.env.NODE_ENV != 'development') {
                    to = prefs.emails.error;
                } else {
                    to = prefs.emails.developer;
                }
                break;
            case 'warn':
                if (process.env.NODE_ENV == 'prod' || process.env.NODE_ENV == 'test') {
                //    if (process.env.NODE_ENV != 'development') {
                    to = prefs.emails.warn;
                } else {
                    to = prefs.emails.developer;
                }
                break;
            case 'info':
                if (process.env.NODE_ENV == 'prod' || process.env.NODE_ENV == 'test') {
                //    if (process.env.NODE_ENV != 'development') {
                    to = prefs.emails.info;
                } else {
                    to = prefs.emails.developer;
                }
                break;
            case 'verbose':
                return
        }
        return transporter.sendMail({
            from: `${packagejson.name}  <${prefs.emails.noreply}>`, // sender address
            to,
            subject: `${info.level} | ${process.env.NODE_ENV} | ${packagejson.version}`,
            html: `
            ${packagejson.name} ${packagejson.version} <br>
            ${info.level.toString()} <br><br>
            error     : ${info.message} <br>
            route     : ${info.route} <br><br><br>
            NODE_ENV  : ${process.env.NODE_ENV} <br>
            path      : ${appRootPath} <br>
            front     : ${prefs.frontBaseUrl} <br>
            back      : ${prefs.backBaseUrl} <br>
            ip        : ${info.ip} <br>
            userAgent : ${info.userAgent} <br>
            ${emailSignature}
            `
        }, (error, emailInfo) => {
            if (error)
                return log().error({ route: '[tools.log.EmailTransport]', message: error });
            if (process.env.NODE_ENV == 'prod') {
                log().verbose({ message: colors.bgGrey(`[${info.level.toUpperCase()}_EMAIL] sent to ${to}`), emailInfo });
            } else {
                log().verbose({ message: colors.bgGrey(`[${info.level.toUpperCase()}_EMAIL] sent to ${to}`) });
            }
            // only needed when using pooled connections
            return transporter.close();
        });
        // Perform the writing to the remote service
        //callback();
    }
};