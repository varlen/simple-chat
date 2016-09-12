express = require('express');    /* outdated in tutorial */
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var fs = require('fs');
var escape = require('escape-html');

var users = {};
var pattern_yt = /(?:https?:\/\/)?(?:www\.)?youtu(.be\/|be\.com\/watch\?v=)(\w{11})/;

// if (process.argv[2] != undefined) {
// 	var users = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
// }


app.get('/', function(req, res) {
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname + '/index.html'); /* double underscore */
});

app.get('/icq.ogg', function (req, res) {

	res.sendFile(__dirname + '/icq.ogg');
});

io.on('connection', function(socket){
	console.log('a user connected');
	//console.log(socket.client.request.headers);
	console.log(socket.handshake.address);


	var nick = users[socket.handshake.address];
	if (nick) {
		socket.handshake.nickname = nick;
		console.log(socket.handshake.address + ' logged in as ' + nick);
		io.sockets.connected[socket.id].emit('iknowyou', nick); //Send to specific user
		io.emit('chat message', nick + ' is back');   //socket emit manda pra o usuario em questao!
	} else {
		io.sockets.connected[socket.id].emit('whoareyou'); //Send to specific user
	}

	socket.on('disconnect', function(){
		console.log('a user disconnected');
		io.emit('chat message', socket.handshake.nickname + ' disconnected');
	});

	socket.on('chat message', function(msg){
		if (socket.handshake.nickname) {
			console.log('[' + socket.handshake.nickname + ']:' + msg );
			io.emit('chat message', socket.handshake.nickname + ' says: ' + msg);
		}
	});

	socket.on('alert', function (msg){
		if (socket.handshake.nickname) {
			console.log('[' + socket.handshake.nickname + '] sent an alert:' + msg);
			io.emit('alert', msg);
		}
	});

	socket.on('chat image', function(url){
		if (socket.handshake.nickname) {
			console.log('[' + socket.handshake.nickname + '] sent a image (' + url + ')');
			io.emit('chat image', { "txt" : socket.handshake.nickname + " sent a image : ", "url" : url } );
		}
	});

	socket.on('chat code', function(code){
		if (socket.handshake.nickname) {
			console.log('[' + socket.handshake.nickname + '] sent a code snippet' );
			io.emit('chat code', { "code":escape(code.replace("	","   ")) , "text": socket.handshake.nickname + " sent a code snippet:" });
		}
	});

	socket.on('chat youtube', function(url){
		if (socket.handshake.nickname) {
			console.log('[' + socket.handshake.nickname + '] sent a YouTube video ' + url);
			if (url.match(pattern_yt)){  //Without this, a malformed YT URL could break the server
				var videoCode = url.match(pattern_yt)[2];
				var iframe = '<iframe id="ytplayer" type="text/html" width="640" height="390" src="http://www.youtube.com/embed/'+ videoCode +'" frameborder="0"/>';
				io.emit('chat youtube', { "iframe":iframe, "text": socket.handshake.nickname + " sent a YouTube video:"})
			}
		}
	});

	socket.on('nickname', function(nick){
		if (socket.handshake.nickname) {
			var oldNick = socket.handshake.nickname;
		}
		socket.handshake.nickname = nick;
		users[socket.handshake.address] = socket.handshake.nickname;
		if (oldNick != undefined){
			console.log(oldNick + ' is now known as ' + nick);
			io.emit('chat message', oldNick + ' is now known as ' + nick);
		} else {
			console.log(socket.handshake.address + ' is now known as ' + nick);
			io.emit('chat message', nick + ' logged in');
		}

		// fs.writeFile("users.json", JSON.stringify(users), function (err) {
		// 	if (err){
		// 		console.log('Failed to save users file');
		// 	} else {
		// 		console.log('Saved users file');
		// 	}
		// });
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});