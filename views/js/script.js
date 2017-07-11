var namespace = document.getElementById('namespace').value;
// var cookie = escape(document.cookie);
// var token = escape("sid:cdda691da5a7d39c1c3bcb00123f2c4aacb97bf3,1498114678"); //example token
var socket = io('/'+namespace/*,{ 'query': "token="+token+"&cookie="+escape("PHPSESSID=mr34n3a229tikkr44qmggl0f17")}*/);
var result = 'Web command line interface Asterisk ver 1.0';
var eventFilter = "all";
var contentFilter = "all";
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('greeting', (data) => {
    document.getElementById('result').innerHTML = '<span style="color: blue">' + data + '</span>';
    scrollToBot();
});

socket.on('errorAMI', (data) => {
    result += "<br>" + '<span style="color: red"><b>Error: </b></span> ' + JSON.stringify(data);
    document.getElementById('result').innerHTML = result;
    scrollToBot();
})

socket.on('info', (data) => {
    if (eventFilter == 'all' && contentFilter == 'all') {
        result += "<br>" + '<span style="color: blue"><b>Event:</b> (event filter: ' + eventFilter + ', content filter: ' + contentFilter + ') </span> ' + JSON.stringify(data);
    } else if (eventFilter != 'all' && contentFilter == 'all') {
        if (data.Event == eventFilter) {
            result += "<br>" + '<span style="color: blue"><b>Event:</b> (event filter: ' + eventFilter + ', content filter: ' + contentFilter + ') </span> ' + JSON.stringify(data);
        }
    } else if (eventFilter == 'all' && contentFilter != 'all') {
        if (JSON.stringify(data).indexOf(contentFilter) !== -1) {
            result += "<br>" + '<span style="color: blue"><b>Event:</b> (event filter: ' + eventFilter + ', content filter: ' + contentFilter + ') </span> ' + JSON.stringify(data);
        }
    } else if (eventFilter != 'all' && contentFilter != 'all') {
        if (data.Event == eventFilter && JSON.stringify(data).indexOf(contentFilter) !== 1) {
            result += "<br>" + '<span style="color: blue"><b>Event:</b> (event filter: ' + eventFilter + ', content filter: ' + contentFilter + ') </span> ' + JSON.stringify(data);
        }
    }
    document.getElementById('result').innerHTML = result;
    scrollToBot();
    if (data.Event == 'End MixMonitorCall') {
        var player = document.getElementById('player');
        var playerSource = document.getElementById('playersource');
        var urlArray = data.File.split("/");
        if (urlArray.length > 5 && urlArray.length < 7) {
            playerSource.src = '/'+namespace+'/' + urlArray[4] + '/' + urlArray[5];
            player.load();
            player.play();
        }
    }
})

socket.on('command', (data) => {
    result += "<br>" + '<span style="color: green"><b>Command: </b></span> ' + JSON.stringify(data);
    document.getElementById('result').innerHTML = result;
    scrollToBot();
})

function scrollToBot() {
    var objDiv = document.getElementById("resultFrame");
    objDiv.scrollTop = objDiv.scrollHeight;
}

document.getElementById('command').onkeypress = function (e) {
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13') {
        var command = document.getElementById('command').value;
        if (command == 'clear') {
            result = 'Web command line interface Asterisk ver 1.0';
            document.getElementById('result').innerHTML = result;
            document.getElementById('command').value = "";
        } else if ((command.split(" ")[0] == 'filter')) {
            if (command.split(" ").length > 2) {
                if (command.split(" ")[1] == 'event') {
                    eventFilter = command.split(" ")[2];
                } else if (command.split(" ")[1] == 'content') {
                    contentFilter = command.split(" ")[2];
                } else {
                    result += "<br>" + '<span style="color: red"><b>Error: </b></span> Not found ' + command;
                    document.getElementById('result').innerHTML = result;
                    scrollToBot();
                }
            } else {
                result += "<br>" + '<span style="color: red"><b>Error: </b></span> Missing parameters ' + command;
                document.getElementById('result').innerHTML = result;
                scrollToBot();
            }

            document.getElementById('command').value = "";
        } else {
            socket.emit('command', command, function () {
                document.getElementById('command').value = "";
            });
        }

    }
}