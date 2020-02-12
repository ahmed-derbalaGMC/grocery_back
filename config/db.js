const appRootPath = require('app-root-path');
const log = require(`${appRootPath}/utils/log`).log
const prefs = require(`${appRootPath}/config/prefs`)

var mongoose = require('mongoose');
mongoose.connect(`mongodb://${prefs.db.url}/${prefs.db.name}`, { useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex:true });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    log().verbose({ message: `connected to ${prefs.db.name} database on ${prefs.db.url}` })
});
