/**
 * Created by RASAMIZANANY on 24/03/14.
 */
// We need to use the express framework: have a real web server that knows how to send mime types etc.
// We need to use the express framework: have a real web server that knows how to send mime types etc.
var express=require('express');

// Init globals variables for each module required
var app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);

// Indicate where static files are located
/*app.configure(function () {
    app.use(express.static(__dirname + '/'));
});*/
app.set(app.use(express.static(__dirname + '/')));


// launch the http server on given port
server.listen(8080);

// routing
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/canvas.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var lastPosition = { x: 0, y: 0 }; // whatever default data
io.sockets.on('connection', function (socket) {

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        //lastPosition = data;
        io.sockets.emit('updatechat', socket.username, data);
    });

    // when the client emits 'Line', this listens and executes
   // socket.emit('update_position', lastPosition);
    socket.on('drawLine', function (data) {
        //lastPosition = data;
        io.sockets.emit('Line',socket.username, data); // send `data` to all other clients
    });
    // when the client emits 'Circle', this listens and executes
    // socket.emit('update_position', lastPosition);
    socket.on('drawCircle', function (data) {
        //lastPosition = data;
        io.sockets.emit('Circle',socket.username, data); // send `data` to all other clients
    });
    // when the client emits 'Circle', this listens and executes
    // socket.emit('update_position', lastPosition);
    socket.on('drawRectangle', function (data) {
        //lastPosition = data;
        io.sockets.emit('Rectangle',socket.username, data); // send `data` to all other clients
    });
    socket.on('distributePaintCommand', function (paintCommand) {
        // send the paint command to everyone except sender
        socket.broadcast.emit('processPaintCommand',paintCommand);
    });
    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username){
        // we store the username in the socket session for this client
        socket.username = username;
        // add the client's username to the global list
        usernames[username] = username;
        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected');
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
        // update the list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    });
    socket.on('send:coords', function (data) {
        socket.broadcast.emit('load:coords', data);
    });

})