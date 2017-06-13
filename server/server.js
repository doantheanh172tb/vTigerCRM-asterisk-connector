const path = require('path');
const express = require('express');
const http = require('http');

const configPBXservers = require('../config.js').configPBXservers;

var app = express();
//tao 1 express server
var server = http.createServer(app);
//set view engine
app.set('view engine', 'ejs');

//danh sach cac Namespace
app.get('/', function (req, res) {
    var companyList = configPBXservers.map(confPBX => confPBX.company);
    res.render('index', {
        companyList
    });
});


//trang log cho 1 Namespace
app.get('/:namespace', function (req, res) {
    res.render('detail', {
        namespace: req.params.namespace
    });
});

server.listen(3000, () => {
    console.log('app is running...');
})