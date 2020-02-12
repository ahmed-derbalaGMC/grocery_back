const appRootPath = require('app-root-path');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var authentification = require('./utils/authentification') //Middleware
var cors = require('cors');




global.log = require(`${appRootPath}/utils/log`).log
require(`${appRootPath}/config/db`) //loading db connection
global.models = require('./models') //loading models
var app = express();
app.use(cors())

//display extra informations on terminal and calculate response time on prod and test envirements
if (process.env.NODE_ENV == 'development') {
    app.use(logger(`:status :method :url :remote-addr responseTime=[*:response-time*]`, { stream: log.stream }));
} else {
    app.use(logger(`:status :method :url :remote-addr responseTime=[*:response-time*]\n:user-agent`, { stream: log.streamProd }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//loading routes
app.use('/', require('./routes/index'));//to make baseUrl:port/ works
app.use(authentification.tokenAuth);
for (let r = 0; r < authentification.routes.length; r++) {
    app.use('/' + authentification.routes[r], require('./routes/' + authentification.routes[r]))
}

module.exports = app;
