/**
 * this file contains various functions that can serve in many projects.
 * import only necessary functions like : var myFunction = require('../utils/tools').myFunction
 * use it like : myFunction(param1, param2)
 */
const appRootPath = require('app-root-path');
var log = require(`${appRootPath}/utils/log`).log
const fs = require('fs');
const nodemailer = require("nodemailer");
const prefs = require('../config/prefs')
const secrets = require(`${appRootPath}/config/secrets`)
// Nodejs encryption with CTR
const crypto = require('crypto');
const iv = crypto.randomBytes(16);
const packagejson = require('../package.json');
let moment = require('moment');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const colors = require('colors/safe');
const base64Img = require("base64-img");
const msg_WelcomeWorkFirstTime = require('./messages').msg_WelcomeWorkFirstTime
const msg_WelcomeWorkFirstTimeError = require('./messages').msg_WelcomeWorkFirstTimeError
const msg_WelcomeWork = require('./messages').msg_WelcomeWork
const msg_WelcomeWorkError = require('./messages').msg_WelcomeWorkError

const msg_GoodByeWork = require('./messages').msg_GoodByeWork
const msg_GoodByeWorkError = require('./messages').msg_GoodByeWorkError

//token payload encryption and decryption before sign
exports.encrypt = text => {
    let cipher = crypto.createCipheriv(secrets.tokenEncryptionAlgorithm, Buffer.from(secrets.tokenEncryptionKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

exports.decrypt = text => {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(secrets.tokenEncryptionAlgorithm, Buffer.from(secrets.tokenEncryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

var emailSignature = exports.emailSignature = `<br><br>------------------------
${prefs.company.name} ${prefs.company.description} ------------------------<br>
telephone: ${prefs.company.telephone}  email: ${prefs.company.email}<br><br>
address: ${prefs.company.address}<br><br>
${prefs.company.logo}`

exports.sendNoReplyEmail = (to, subject, html) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.ionos.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: prefs.emails.noreply,
            pass: secrets.noreplyPassword
        }
    });
    return transporter.sendMail({
        from: packagejson.name + '  <' + prefs.emails.noreply + '>',
        to, subject, html: `${html} ${emailSignature}`
    }, (error, info) => {
        if (error) {
            log().error({ route: colors.bgRed('[tools.sendNoReplyEmail]'), message: error.message });
        } else {
            if (process.env.NODE_ENV == 'prod') {
                log().verbose({ message: colors.bgGray(`[NOREPLY_EMAIL] ${to}, ${subject}`), info });
            } else {
                log().verbose({ message: colors.bgGray(`[NOREPLY_EMAIL] ${to}, ${subject}`) });
            }
        }
    });
}

/**
 * DATE AND TIME
 */
exports.convertDateToTime = date => {
    return date.slice(16, 21);
}

exports.convertTimestampToHours = time => {
    return parseInt(time.slice(0, 2));
}

exports.convertTimestampToMinutes = time => {
    return parseInt(time.slice(3, 5));
}

//converting minutes to hours
let convertMinutesToHours = exports.convertMinutesToHours = (minutes, display) => {
    if (!display || display == 'hours') {
        if (minutes > 59) {
            if (minutes % 60 == 0) {
                return minutes / 60
            } else {
                return Math.floor(minutes / 60)
            }
        } else {
            return minutes
        }
    }
    if (display == 'json') {
        if (minutes > 59) {
            var hours = Math.floor(minutes / 60);
            minutes = minutes - hours * 60;
            return { hours, minutes }
        } else {
            return { hours: 0, minutes }
        }
    }
}

//check if a given day is the current day or not
exports.isToDay = date => {
    const toDay = new Date();
    const dateConvertedToDate = new Date(date);
    if (
        dateConvertedToDate.getFullYear() == toDay.getFullYear() &&
        dateConvertedToDate.getMonth() == toDay.getMonth() &&
        dateConvertedToDate.getDate() == toDay.getDate()
    ) {
        return true;
    } else {
        return false;
    }
}

exports.durationInDays = (date1, date2) => {
    if (!date1 || !date2) return 0
    return Math.ceil((Math.abs((new Date(date2)).getTime() - (new Date(date1)).getTime())) / (1000 * 60 * 60 * 24)) + 1;
}

//calculates duration in minutes between two times in 24h format
exports.durationOfTimesInMinutes = (time1, time2) => {
    let h1 = parseInt(time1.slice(0, 2))
    let m1 = parseInt(time1.slice(3, 5))
    let h2 = parseInt(time2.slice(0, 2))
    let m2 = parseInt(time2.slice(3, 5))

    let hourDuration = (h2 - h1) * 60
    if (m1 < m2) {
        hourDuration = hourDuration + (m2 - m1)
    }
    if (m1 > m2) {
        hourDuration = hourDuration - (m1 - m2)
    }
    return Math.abs(hourDuration)
}

//calculates duration in minutes between two times in 24h format
let durationOfDatesInMinutes = exports.durationOfDatesInMinutes = (time1, time2) => {
    let h1 = time1.getHours()
    let m1 = time1.getMinutes()
    let h2 = time2.getHours()
    let m2 = time2.getMinutes()

    if (h1 > h2) return false
    let hourDuration = (h2 - h1) * 60
    if (m1 < m2) {
        hourDuration = hourDuration + (m2 - m1)
    }
    if (m1 > m2) {
        hourDuration = hourDuration - (m1 - m2)
    }

    return hourDuration
}

var getNextMondayOfTheWeek = exports.getNextMondayOfTheWeek = (dayName, excludeToday = true, refDate = new Date()) => {
    const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        .indexOf('mon'.slice(0, 3).toLowerCase());
    if (dayOfWeek < 0) {
        return;
    }
    refDate.setHours(1, 0, 0, 0);
    refDate.setDate(refDate.getDate() + !!excludeToday + (dayOfWeek + 7 - refDate.getDay() - !!excludeToday) % 7);
    return refDate;
}

var getNextSunday = exports.getNextSunday = (dayName, excludeToday = true, refDate = new Date()) => {
    const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        .indexOf('sun'.slice(0, 3).toLowerCase());
    if (dayOfWeek < 0) {
        return;
    }
    refDate.setHours(1, 0, 0, 0);
    refDate.setDate(refDate.getDate() + !!excludeToday + (dayOfWeek + 7 - refDate.getDay() - !!excludeToday) % 7);
    // console.log('next sunday');

    //console.log(refDate);

    return refDate;
}

exports.getNextDayOfTheWeek = (dayName, excludeToday = true, refDate = new Date()) => {
    const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        .indexOf(dayName.slice(0, 3).toLowerCase());
    if (dayOfWeek < 0) {
        return;
    }
    refDate.setHours(1, 0, 0, 0);
    //refDate.setDate(refDate.getDate() + !!excludeToday +(dayOfWeek + 7 - refDate.getDay() - !!excludeToday) % 7);
    refDate.setDate(getNextSunday().getDate() + !!excludeToday + (dayOfWeek + 7 - getNextSunday().getDay() - !!excludeToday) % 7);
    //console.log(refDate);

    //refDate.setDate(getNextMondayOfTheWeek().getDate() + !!excludeToday + (dayOfWeek + 7 - getNextMondayOfTheWeek().getDay() - !!excludeToday) % 7);
    //console.log(refDate);

    return refDate;
}

//get date based on dayName, weekNumber and year
let dateOf = exports.dateOf = function (dayName, weekNumber, year) {
    if (!dayName) throw ('dayName should not be null')
    if (!weekNumber) weekNumber = (new Date()).getWeek()
    if (!year) year = (new Date()).getFullYear()

    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(dayName.slice(0, 3).toLowerCase());

    let simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    let dow = simple.getDay();
    let ISOweekStart = simple;

    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + day);
    else
        ISOweekStart.setDate(simple.getDate() + 7 + day - simple.getDay());

    ISOweekStart.setHours(1, 0, 0, 0);
    return ISOweekStart;
}
//for week, get monday date and sunday date
exports.getDateRangeOfWeek = (weekNo) => {
    let d1 = new Date();
    let numOfdaysPastSinceLastMonday = (d1.getDay() - 1);
    //numOfdaysPastSinceLastMonday = eval(d1.getDay() - 1);
    d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);
    let weekNoToday = d1.getWeek();
    //i detected a weeknumber calc error so i added -1
    let weeksInTheFuture = ((weekNo - weekNoToday) - 1);
    //var weeksInTheFuture = eval(weekNo - weekNoToday);
    d1.setDate(d1.getDate() + (7 * weeksInTheFuture));
    //d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
    let rangeIsFrom = d1.getFullYear() + "-" + (d1.getMonth() + 1) + "-" + d1.getDate();
    // let rangeIsFrom = d1.getFullYear() + "-" + eval(d1.getMonth() + 1) + "-" + d1.getDate();
    d1.setDate(d1.getDate() + 6);
    let rangeIsTo = d1.getFullYear() + "-" + (d1.getMonth() + 1) + "-" + d1.getDate();
    //let rangeIsTo = d1.getFullYear() + "-" + eval(d1.getMonth() + 1) + "-" + d1.getDate();
    console.log(rangeIsFrom + " to " + rangeIsTo);

    return rangeIsFrom + " to " + rangeIsTo;
};

//get range of dates between two given dates
exports.dateRange = (start, end) => {
    start = (new Date(start))
    end = (new Date(end))

    let dates = []
    while (start <= end) {
        dates.push(start.getTheDate());
        start.setDate(start.getDate() + 1)
    }
    return dates;
}

exports.getNextDay = (dayName, excludeToday = true, refDate = new Date()) => {
    let tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));
    return new Date((tomorrow).getTime() - ((tomorrow).getTimezoneOffset() * 60000)).toISOString().split("T")[0];
}

// Returns the ISO week of the date.
Date.prototype.getWeek = function () {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86401000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}

//return hours and minutes of a date
Date.prototype.getHoursMinutes = function () {
    let hours = this.getHours()
    let minutes = this.getMinutes()

    if (parseInt(this.getHours()) < 10) {
        hours = `0${this.getHours().toString()}`
    }

    if (parseInt(this.getMinutes()) < 10) {
        minutes = `0${this.getMinutes().toString()}`
    }
    return `${hours}:${minutes}`
}

//returns yyyy-mm-dd of 2019-10-21T08:00:00.000Z like format
Date.prototype.getTheDate = function () {
    let month = this.getMonth()
    let day = parseInt(this.getDate())

    if (parseInt(this.getMonth()) == 9) {
        month = (`10`)
    }
    if (parseInt(this.getMonth()) < 9) {
        month = parseInt(this.getMonth()) + 1
        month = (`0${month}`)
    }
    if (parseInt(this.getMonth()) > 9) {
        month = parseInt(this.getMonth()) + 1
    }
    if (day <= 9) {
        day = `0${day}`
    }
    return `${this.getFullYear()}-${month}-${day}`
}

//returns the name of day of a date
Date.prototype.getTheDay = function () {
    let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.getDay()];
}
// Returns the four-digit year corresponding to the ISO week of the date.
Date.prototype.getWeekYear = function () {
    var date = new Date(this.getTime());
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
}

Date.prototype.toDateOnly = function () {
    return new Date(this.getTime() - (this.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
}

Date.prototype.betweenDates = function (date1, date2) {

    if (this.toDateOnly >= date1 && this.toDateOnly <= date2) return true;
    return false
}

let getHourFromTime = exports.getHourFromTime = function (time) {
    if (!time || time.indexOf(':') == -1) return '00:00'
    time = time.slice(0, time.indexOf(':'))
    if (time.length == 0) time = `00`
    if (time.length == 1) time = `0${time}`
    if (time.length > 2) time = `00`
    return time
}

let getMinuteFromTime = exports.getMinuteFromTime = function (time) {
    if (!time || time.indexOf(':') == -1) return '00:00'
    time = time.slice(time.lastIndexOf(':') + 1, time.length)
    if (time.length == 0) time = `00`
    if (time.length == 1) time = `0${time}`
    if (time.length > 2) time = `00`
    return time
}

//insure the time format (lack of 0), for example front sends 8:2 instead of 08:02
exports.insureTime = function (time) {
    if (!time) return `00:00`
    return `${getHourFromTime(time)}:${getMinuteFromTime(time)}`
}

//use it like req.body = deleteFromJson(req.body,['status','isdeleted'])
exports.deleteFromJson = (json, toDelete) => {
    for (let t = 0; t < toDelete.length; t++) {
        delete json[toDelete[t]]
    }
    return json
}

exports.keepFromJson = (json, toKeep) => {
    let keys = Object.keys(json);
    for (let t = 0; t < keys.length; t++) {
        if (!toKeep.includes(keys[t])) {
            delete json[keys[t]]
        }
    }
    return json
}
//it can create a directory and sub directory automatically
exports.createDirectory = (targetDir, { isRelativeToScript = false } = {}) => {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = appRootPath + '/'

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code == 'EEXIST') { // curDir already exists!
                return curDir;
            }
            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code == 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }
            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir == path.resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }
        return curDir;
    }, initDir);
}

exports.csvExport = (data, fileName, res) => {
    let keys = Object.keys(data[0]);
    let header = []
    for (let k = 0; k < keys.length; k++) {
        header.push({ id: keys[k], title: keys[k] })
    }
    fileName = fileName + '-' + Date.now()
    let path = `${appRootPath}/uploads/csv/${fileName}.csv`
    const csvWriter = createCsvWriter({ path, header });
    return csvWriter
        .writeRecords(data)
        .then(c => {
            log().verbose({ message: `${path} created successfully` })
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition',
                'attachment; filename=\"' + fileName +
                '.csv\"');
            return res.status(200).sendFile(path);
        });
}


exports.csvImport = (filePath) => {
    let csvData = []
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            csvData.push(row)
        })
        .on('end', () => {
            log().verbose({ message: `${filePath} successfully processed` })
            return csvData
        });
}

//update the serviceTime of workday of a date of a user
let updateServiceTimeOfWorkday = exports.updateServiceTimeOfWorkday = /*async*/ (UserId, email, serviceTimeToAdd) => {
    //(new Date()).getTheDate()
    return models.Workday.findAll({
        where: {
            UserId,
            weekNumber: (new Date()).getWeek(),
            isDeleted: false,
            isHoliday: false,
            isVacation: false
        },
        include: {
            model: models.User,
            as: 'User'
        }
    })
        .then(workdays => {
            if (workdays.length == 0) {
                log().debug({ message: `workdays of weekNumber=${(new Date()).getWeek()} was not found for user ${email} or its all holiday or vacation`, route: `tools/updateServiceTimeOfWorkday` })
                return false
            }
            for (let w = 0; w < workdays.length; w++) {
                if (workdays[w].date == (new Date()).getTheDate()) {
                    workdays[w].serviceTimeMPD += serviceTimeToAdd
                    console.log('current day was added serviceTimeMPD');
                }
                workdays[w].serviceTimeMPW += serviceTimeToAdd
                workdays[w].serviceTimeHPW = convertMinutesToHours(workdays[w].serviceTimeMPW, 'hours')
                workdays[w].serviceTimeHPM += workdays[w].serviceTimeHPW
                /*await*/ workdays[w].save()
                    .then(savedWorkday => {
                        return log(UserId).debug({ message: `serviceTimes of ${workdays[w].date} was added ${serviceTimeToAdd} minutes for user ${email}` })
                    })
                    .catch(err => {
                        console.log(colors.bgRed(err));
                        log().error({ message: err });
                    })
            }
            return true
        })
        .catch(err => {
            console.log(colors.bgRed(err));
            log().error({ message: err });
        })
}

//updating user attendance (in and out)
exports.updateUserAttendance = async (id, atWork, inBreak) => {
    //make sure boolean format is okay
    if (atWork == 'true') atWork = true
    if (atWork == 'false') atWork = false
    if (inBreak == 'true') inBreak = true
    if (inBreak == 'false') inBreak = false

    return models.User.findOne({
        where: {
            id,
            isActive: true
        },
        attributes: {
            exclude: ["password"]
        }
    })
        .then(async user => {
            let userToReturn = {}
            if (user == null) {
                log().debug({ message: `user.id=${id} not found or non active` })
                userToReturn.resStatusCode = 404
                userToReturn.resMessage = `user.id=${id} not found or non active`
                return userToReturn
            }
            //console.log(`***** current user.atWork=${user.atWork}`);
            if (atWork != null)
                user.atWork = atWork
            if (inBreak != null)
                user.inBreak = inBreak

            userToReturn = user.dataValues
            //update attendance
            await models.Attendance.findOne({
                where: {
                    UserId: id,
                    isDeleted: false
                },
                order: [['id', 'DESC']],
            })
                .then(async attendance => {
                    //no attendance before, first time user is at work
                    if (attendance == null) {
                        console.log('****** attendance == null');
                        let dataToSave = {}
                        if (atWork == 'true' || atWork == true) {
                            console.log('****** atWork == true');
                            dataToSave.UserId = id
                            dataToSave.day = (new Date()).getTheDay()
                            dataToSave.date = (new Date()).getTheDate()
                            dataToSave.startDate = new Date()
                            dataToSave.endDate = null
                            dataToSave.duration = 0
                            dataToSave.weekNumber = (new Date()).getWeek()
                            dataToSave.isDeleted = false
                            userToReturn.resStatusCode = 200
                            userToReturn.resMessage = msg_WelcomeWorkFirstTime(user, user.lang)
                        }
                        else if (atWork == false || atWork == 'false') {
                            console.log('***** atWork == false)');
                            dataToSave.UserId = id
                            dataToSave.day = (new Date()).getTheDay()
                            dataToSave.date = (new Date()).getTheDate()
                            dataToSave.startDate = new Date()
                            dataToSave.endDate = new Date()
                            dataToSave.duration = 0
                            dataToSave.weekNumber = (new Date()).getWeek()
                            dataToSave.isDeleted = false

                            log(user.email).verbose({ message: `${user.email} never been present and wants to check off!`, dataToSave });
                            userToReturn.resStatusCode = 210
                            userToReturn.resMessage = msg_WelcomeWorkFirstTimeError(user, user.lang)
                        }
                        else {
                            userToReturn.resStatusCode = 210
                            userToReturn.resMessage = `getting user info`
                            userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                            log().verbose({ message: `getting info of ${userToReturn.email} id=${userToReturn.id} body.atWork=${atWork} body.inBreak=${inBreak}` })
                        }
                        //doing saving
                        //saving new attendance
                        models.Attendance.create(dataToSave)
                            .then(newAttendance => {
                                return log(user.email).verbose({ message: `${user.email} created attendance.id=${newAttendance.id}` });
                            })
                            .catch(err => {
                                console.log(colors.bgRed(err));
                                return log().error({ message: err, route: 'tools/updateUserAttendance' });
                            })
                        //start finishing up
                        return user.save()
                            .then(savedUser => {
                                log(user.email).verbose({ message: `${user.email} saved!`, atWork, inBreak });
                                //base64 user photo
                                if (fs.existsSync(`${appRootPath}${userToReturn.photo}`)) {
                                    userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}${user.photo}`));
                                } else {
                                    log().error({ message: `[FILE_NOT_EXIST] user.id=${user.id} path=${appRootPath}${user.photo}` })
                                    userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                                }
                            })
                            .catch(err => {
                                console.log(colors.bgRed(err));
                                return log().error({ message: err, route: 'tools/updateUserAttendance' });
                            })
                        //end finsihing up
                    }
                    else {
                        //attendance != null
                        console.log(`***** attendance.id=${attendance.id} != null`);
                        if (attendance.endDate == null && (atWork == false || atWork == 'false')) {
                            //user is leaving work
                            console.log('***** attendance.endDate == null && user.atWork == false');
                            attendance.endDate = new Date()
                            //updating user service time
                            console.log(`user.serviceTimeMPW_BEFORE=${user.serviceTimeMPW}`);
                            user.serviceTimeMPW += durationOfDatesInMinutes(attendance.startDate, attendance.endDate)
                            user.serviceTimeHPW = convertMinutesToHours(user.serviceTimeMPW, 'hours')
                            user.serviceTimeHPM += user.serviceTimeHPW
                            console.log(`user.serviceTimeMPW_AFTER=${user.serviceTimeMPW}`);
                            attendance.duration += durationOfDatesInMinutes(attendance.startDate, attendance.endDate)
                            updateServiceTimeOfWorkday(id, user.email, durationOfDatesInMinutes(attendance.startDate, attendance.endDate))
                            attendance.save()
                                .then(savedAttendance => {
                                    return log(user.email).verbose({ message: `${user.email} leaves work at ${attendance.endDate}` });
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })

                            //start finishing up
                            return user.save()
                                .then(savedUser => {
                                    log(user.email).verbose({ message: `${user.email} saved!`, atWork, inBreak });
                                    userToReturn.resStatusCode = 200
                                    userToReturn.resMessage = msg_GoodByeWork(user, user.lang)
                                    //base64 user photo
                                    if (fs.existsSync(`${appRootPath}${user.photo}`)) {
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}${user.photo}`));
                                    } else {
                                        log().error({ message: `[FILE_NOT_EXIST] user.id=${user.id} path=${appRootPath}${user.photo}` })
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                                    }
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })
                            //end finsihing up
                        }

                        else if ((attendance.endDate == null) && ((atWork == true) || (atWork == 'true'))) {
                            console.log('*****attendance.endDate == null && user.atWork == true');
                            //user was atWork, but he wants to be atWork again without leaving!
                            //updating old attendance
                            attendance.endDate = new Date()
                            //updating user service time
                            user.serviceTimeMPW += durationOfDatesInMinutes(attendance.startDate, attendance.endDate)
                            attendance.duration += durationOfDatesInMinutes(attendance.startDate, attendance.endDate)
                            updateServiceTimeOfWorkday(id, user.email, durationOfDatesInMinutes(attendance.startDate, attendance.endDate))
                            /*await*/ attendance.save()
                                .then(savedAttendance => {
                                    return log(user.email).verbose({ message: `${user.email} updated attendnance.id=${attendance.id}` });
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })
                            //creating new attendance
                            /*await*/ models.Attendance.create({
                                    UserId: id,
                                    day: (new Date()).getTheDay(),
                                    date: (new Date()).getTheDate(),
                                    startDate: new Date(),
                                    endDate: null,
                                    duration: 0,
                                    weekNumber: (new Date()).getWeek(),
                                    isDeleted: false
                                })
                                .then(newAttendance => {
                                    return log(user.email).verbose({ message: `${user.email} created attendance.id=${newAttendance.id}, was already at work and requested to be at work!` });
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })

                            //start finishing up
                            return user.save()
                                .then(savedUser => {
                                    log(user.email).verbose({ message: `${user.email} saved!`, atWork, inBreak });
                                    userToReturn.resStatusCode = 210
                                    userToReturn.resMessage = msg_WelcomeWorkError(user, user.lang)
                                    //base64 user photo
                                    if (fs.existsSync(`${appRootPath}${user.photo}`)) {
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}${user.photo}`));
                                    } else {
                                        log().error({ message: `[FILE_NOT_EXIST] user.id=${user.id} path=${appRootPath}${user.photo}` })
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                                    }
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })
                            //end finsihing up
                        }
                        //user was out and now he wants to be atwork
                        else if (attendance.endDate != null && (atWork == true || atWork == 'true')) {
                            console.log('***** attendance.endDate != null && user.atWork == true');
                            //creating new attendance
                            models.Attendance.create({
                                UserId: id,
                                day: (new Date()).getTheDay(),
                                date: (new Date()).getTheDate(),
                                startDate: new Date(),
                                endDate: null,
                                duration: 0,
                                weekNumber: (new Date()).getWeek(),
                                isDeleted: false
                            })
                                .then(newAttendance => {
                                    return log(user.email).verbose({ message: `${user.email} created attendance.id=${newAttendance.id}` });
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })

                            //start finishing up
                            return user.save()
                                .then(savedUser => {
                                    log(user.email).verbose({ message: `${user.email} saved!`, atWork, inBreak });
                                    userToReturn.resStatusCode = 200
                                    userToReturn.resMessage = msg_WelcomeWork(user, user.lang)
                                    //base64 user photo
                                    if (fs.existsSync(`${appRootPath}${user.photo}`)) {
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}${user.photo}`));
                                    } else {
                                        log().error({ message: `[FILE_NOT_EXIST] user.id=${user.id} path=${appRootPath}${user.photo}` })
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                                    }
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })
                            //end finsihing up
                        }
                        //user was out he wants to get out!
                        else if (attendance.endDate != null && (atWork == false || atWork == 'false')) {
                            console.log('***** attendance.endDate != null && atWork == false');
                            log(user.email).verbose({ message: `${user.email} was not at work and he wants to leave work!` });
                            //start finishing up
                            return user.save()
                                .then(savedUser => {
                                    log(user.email).verbose({ message: `${user.email} saved!`, atWork, inBreak });
                                    userToReturn.resStatusCode = 210
                                    userToReturn.resMessage = msg_GoodByeWorkError(user, user.lang)
                                    //base64 user photo
                                    if (fs.existsSync(`${appRootPath}${user.photo}`)) {
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}${user.photo}`));
                                    } else {
                                        log().error({ message: `[FILE_NOT_EXIST] user.id=${user.id} path=${appRootPath}${user.photo}` })
                                        userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                                    }
                                })
                                .catch(err => {
                                    console.log(colors.bgRed(err));
                                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                                })
                            //end finsihing up
                        } else {
                            userToReturn.resStatusCode = 210
                            userToReturn.resMessage = `getting user object`
                            userToReturn.photo = base64Img.base64Sync(path.join(`${appRootPath}/public/images/no_photo.png`))
                            log().verbose({ message: `getting info of ${userToReturn.email} id=${userToReturn.id} body.atWork=${atWork} body.inBreak=${inBreak}` })
                        }
                    }//else 
                })
                .catch(err => {
                    //attendance catch
                    console.log(colors.bgRed(err));
                    return log().error({ message: err, route: 'tools/updateUserAttendance' });
                })
            return userToReturn
        })
        .catch(err => {
            //user catch
            console.log(colors.bgRed(err));
            return log().error({ message: err, route: 'tools/updateUserAttendance' });
        })
}


let notSeenNotifications = exports.notSeenNotifications = (UserId) => {
    let where = {}
    where.isSeen = false
    where.isDeleted = false
    where.UserId = UserId
    return models.Notification.findAll({
        where,
        order: [
            ['id', 'DESC'],
        ]
    })
        .then(notifications => {
            io.sockets.in(`user_${UserId}`).emit('receiveNotSeenNotifications', { messages: `you have ${notifications.length} notifications`, data: notifications })
            return log().debug({ message: colors.bgMagenta(`[receiveNotSeenNotifications] user.id=${UserId} received ${notifications.length} Not Seen Notifications`) })
        })
        .catch(err => {
            console.log(colors.bgRed(err));
            return log().error({ message: err });
        })
}


exports.sendNotification = (UserId, SenderId, type, TypeId, subject, text, data, user) => {
    return models.Notification.create({
        UserId,
        //ReceiverId,
        SenderId,
        type,
        TypeId,
        subject,
        text,
        isSeen: false,
        isDeleted: false,
    })
        .then(notification => {
            //sending notification
            io.sockets.in(`user_${UserId}`).emit('newNotification', {
                subject,
                message: text,
                data
            });
            notSeenNotifications(UserId)
            if (user != null) {
                return log(UserId).debug({ message: `[notification_received] id=${notification.id} user.id=${user.id} ${user.email} role=${user.role} GroupId=${user.GroupId} subject=${subject}` });
            } else {
                return log(UserId).debug({ message: `[notification_received] id=${notification.id} user.id=${UserId} subject=${subject}` });
            }
        })
        .catch(err => {
            console.log(colors.bgRed(err));
            return log().error({ message: err, route: 'tools/sendNotification' });
        })
}
//remove from array
exports.arrayRemove = (arr, value) => {
    return arr.filter(function (ele) {
        return ele != value;
    });
}

//number of connected clietns in given room to check if a user still connected to the app
exports.NumClientsInRoom = (namespace, room) => {
    let clients = io.nsps[namespace].adapter.rooms[room];
    if (clients) {
        console.log(`NumClientsInRoom ${room}   ${clients.length}`);
        return Object.keys(clients).length;
    } else {
        console.log(`NumClientsInRoom ${room}   0`);
        return 0
    }
}

//check if 2 matrixs are equals or not
exports.compare2Matrixs = (m1, m2, matrixHeight, matrixWidth) => {
    for (var h = 0; h < matrixHeight; h++) {
        for (var w = 0; w < matrixWidth; w++) {
            if (m1[h][w] != m2[h][w]) {
                return false
            }
        }
    }
    return true
}


exports.getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

//get the name of the model based on route file
exports.myModel = (filename) => {
    let myModel = ''
    myModel = filename.slice(filename.lastIndexOf('/') + 1, -3)
    myModel = myModel.charAt(0).toUpperCase() + myModel.substring(1)
    return myModel
}

//extract ids from an object and pusht them into an array
exports.getIdsOnArray = (idsString) => {
    if (!idsString) throw new Error('The array input cant be null')
    idsString = idsString.toString()
    let id, ids = []
    if (idsString[0] == '[') {
        idsString = idsString.slice(1, idsString.length - 1)
    }
    if (idsString[idsString.length - 1] == ']') {
        idsString = idsString.slice(0, idsString.length - 1)
    }

    while (idsString.length != 0) {
        if (idsString.includes(',')) {
            id = idsString.slice(0, idsString.indexOf(','))
        } else {
            id = idsString.slice(0, idsString.length)
        }
        if (parseInt(id) || id == 0) {
            ids.push(parseInt(id))
        }
        idsString = idsString.slice(id.length + 1, idsString.length)
    }
    return ids
}
/**
 * handling error message based on envirement
 */
exports.errorHandler = (err) => {
    let error = err, status = 500

    switch (err.name) {
        case 'ValidationError':
            status = 422

            break;

        default:
            break;
    }
    if (process.env.NODE_ENV == 'dev') {
        return { error, status }
    } else {
        return { error: error.name, status }
    }
}