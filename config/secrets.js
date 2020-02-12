
const packagejson = require('../package.json');

let noreplyPassword = '123'

if (process.env.NODE_ENV == 'prod') {
    noreplyPassword = '123'
}

module.exports = {
    "privateKey": `ahmed${packagejson.name}`,
    "tokenEncryptionKey": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",//must be 32 characters
    "tokenEncryptionAlgorithm": "aes-256-cbc",
    "noreplyPassword": noreplyPassword
}