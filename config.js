const ConnectorURL = 'http://localhost:3000';
const configPBXservers = [{
    company: 'ASK',
    crm: {
        auth: {
            VT_URL: 'http://localhost/vtigercrm',
            VT_USER: 'admin',
            VT_ACCESSKEY: 'TPMBl9pBTjwCDzVE', // accesskey is in your vtiger user preferences
            LOGGING_LEVEL: 'warning',   // level of logging (error||warning||info||debug||trace)
        },
        customers: {
            moduleName: 'Contacts',
            phoneFields: ['phone', 'mobile', 'phone'],
        },
    },
    asterisk: {
        ASTERISK_SERVER_IP: '192.168.100.3',
        ASTERISK_SERVER_PORT: 5038,
        ASTERISK_USERNAME: 'admin',
        ASTERISK_PASSWORD: 'password',
    },
    ftp: {
        host: '192.168.100.3',
        port: 21,
        user: 'root',
        password: 'ys123456'
    }
}];

module.exports.connectorURL = ConnectorURL;
module.exports.configPBXservers = configPBXservers;