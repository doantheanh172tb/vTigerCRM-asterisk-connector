const socketIO = require('socket.io');
const { configPBXservers, connectorURL } = require('../../config.js');
const aio = require('asterisk.io');
const vtws = require('node-vtiger');

function createWebSocket(server) {
    //create io object
    var io = socketIO(server);
    //loop all PBX config
    var AMIservers = configPBXservers.map(configPBX => {
        return {
            namespace: configPBX.company,
            server: aio.ami( //connect PBX with asterisk ami
                configPBX.asterisk.ASTERISK_SERVER_IP,
                configPBX.asterisk.ASTERISK_SERVER_PORT,
                configPBX.asterisk.ASTERISK_USERNAME,
                configPBX.asterisk.ASTERISK_PASSWORD
            ),
            crmAuth: {
                VT_URL: configPBX.crm.auth.VT_URL,
                VT_USER: configPBX.crm.auth.VT_USER,
                VT_ACCESSKEY: configPBX.crm.auth.VT_ACCESSKEY,
                LOGGING_LEVEL: configPBX.crm.auth.LOGGING_LEVEL,
            },
            customers: configPBX.crm.customers,
        };
    });
    AMIservers.forEach(function (AMI) {
        // console.log('AMI');
        // console.log(AMI);
        var vt_client = new vtws(
            AMI.crmAuth.VT_URL,
            AMI.crmAuth.VT_USER,
            AMI.crmAuth.VT_ACCESSKEY,
            AMI.crmAuth.LOGGING_LEVEL
        );

        /**
        * // error throw if
        * // - could not connect to hostname
        * // - could not log in with username/password
        * // - asterisk server close socket
        */
        AMI.server.on('error', function (err) {
            console.log(AMI.namespace, "::Err: " + err);
        });

        // when 'Shutdown' was emitted by asterisk ami, the event is 'event'+'Shutdown' will be emitted
        // data have full body message from asterisk ami
        AMI.server.on('eventShutdown', function (data) {
            console.log(AMI.namespace, '::eventShutdown');
            console.log(data);
        });

        // connected and logged with asterisk ami
        AMI.server.on('ready', function () {
            console.log(AMI.namespace, "::is ready to connect");
            //tao 1 namespace trong socket, phuong thuc use() cho phep dinh 1 middleware vao socket
            io.of('/' + AMI.namespace).use(function (socket, next) {
                //check crm authorized
                vt_client.doLogin((err, result) => {
                    if (err) {
                        console.log(AMI.namespace, '::authorized CRM failed');
                        next(new Error('not authorized'));
                    } else {
                        console.log(AMI.namespace, '::authorized CRM successed');
                        console.log(result);
                        next();
                    }
                });
            });
            //listen namseSpace AMI.namespace
            io.of('/' + AMI.namespace).on('connection', (socket) => {
                console.log(AMI.namespace, '::new connection');
                //create emitter vs listener
                createStream(socket, AMI.server);
            });

            //listen eventAny from AMI
            AMI.server.on('eventAny', function (data) {
                // console.log(AMI.namespace, '::eventAny');
                // Event = Cdr
                if (
                    data.Event == 'Cdr' //action Cdr
                    //&& data.AnswerTime != '' //ring source
                    && (data.UserField == 'Outbound' || data.UserField == 'Inbound') //call with customer
                ) {
                    console.log(data);
                    console.log(AMI.namespace, '::eventAny::crm user got call: __from:',
                        data.Source, '__to:', data.Destination, '__type:', data.UserField);

                    var phone_extension = '', phone_customer = '' /*, startTime = data.AnswerTime*/;
                    if (data.UserField == 'Outbound') {
                        //Outbound Call
                        phone_extension = data.Source;
                        phone_customer = data.Destination;
                    } else {
                        //Inbound Call
                        phone_extension = data.Destination;
                        phone_customer = data.Source;
                    }
                    //if data.Source = 664(169)
                    if (phone_extension.indexOf('(') != -1) {
                        phone_extension = phone_extension.substring(phone_extension.indexOf('(') + 1, phone_extension.indexOf(')'));
                    }
                    console.log('phone_extension: ', phone_extension, ' phone_customer:', phone_customer, 'UserField', data.UserField);
                    //check Login CRM
                    vt_client.doLogin((loginErr) => {
                        if (loginErr) {
                            console.log('Error> doLogin', JSON.stringify(loginErr));
                        } else {
                            let query = "SELECT id, phone_crm_extension FROM Users  WHERE  phone_crm_extension='" + phone_extension + "'";

                            //get user with phone_extension
                            vt_client.doQuery(query, (userErr, userResult) => {
                                if (userErr) {
                                    console.log('Error> doQueryPhoneExtension', JSON.stringify(userErr));
                                } else {
                                    console.log('Successed> userResult', JSON.stringify(userResult));
                                    if (userResult.length > 0) {
                                        // if (userResult.length == 1) {
                                        let queryCustomer = "SELECT id FROM " + AMI.customers.moduleName + "  WHERE ";
                                        for (i = 0; i < AMI.customers.phoneFields.length; ++i) {
                                            if (i == 0) {
                                                queryCustomer += AMI.customers.phoneFields[i] + "='" + phone_customer + "'";
                                            } else {
                                                queryCustomer += " OR " + AMI.customers.phoneFields[i] + "='" + phone_customer + "'";
                                            }
                                        }

                                        //get customer with phone_customer
                                        vt_client.doQuery(queryCustomer, (customerErr, customerResults) => {
                                            if (customerErr) {
                                                console.log('err111', JSON.stringify(customerErr));
                                            } else {
                                                console.log('1111', JSON.stringify(customerResults));
                                                switch (customerResults.length) {
                                                    case 0:
                                                        break;
                                                    default:
                                                        var pbx_data = {
                                                            "direction": data.UserField,
                                                            "callstatus": data.Disposition,
                                                            "starttime": data.StartTime,
                                                            "endtime": data.EndTime,
                                                            "totalduration": data.Duration,
                                                            "billduration": data.BillableSeconds,
                                                            "gateway": data.LastApplication,
                                                            "user": userResult[0].id,
                                                            "customernumber": phone_customer,
                                                            "customer": customerResults[0].id,
                                                        };

                                                        //create new pbx record
                                                        vt_client.doCreate('PBXManager', pbx_data, ((pbxErr, pbxResult) => {
                                                            if (pbxErr) {
                                                                console.log('Error > insert pbxmanager:: ', JSON.stringify(pbxErr));
                                                            } else {
                                                                console.log('Successed > insert pbxmanager:: ', JSON.stringify(pbxResult));
                                                            }
                                                        }));
                                                }
                                            }
                                        })
                                        // } else {
                                        // }
                                    } else {
                                        console.log(phone_extension + ' not existing in CRM');
                                    }
                                }
                            });
                        }
                    });
                } else {

                }
            });
        });
    });
}
module.exports = createWebSocket;