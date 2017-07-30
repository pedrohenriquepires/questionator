var ADMIN_KEY = "cr3sc3r";

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var specificity = require('specificity');

var currentQuestion = -1;
var users = [];
var rightAnswers = [];
var questions = [
	{ question: "Faz ai qualquer seletor com a especificidade 0-1-0", answers: ["0,0,1,0"], specificity: true },
];

app.use(express.static(__dirname));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
app.get('/admin', function(req, res){
	res.sendFile(__dirname + '/admin.html');
});

io.on('connection', function(socket){
	var ip = getIp(socket);
	var user = getUser(ip);

	if(!user) {
		socket.emit('ask-user-name');
	} else {
		socket.emit('connected', {
			question: (questions[currentQuestion] || {}).question,
			rightAnswer: rightAnswers.indexOf(user) >= 0,
			userName: user.name
		});
	}

	var _users = users;

	_users.forEach(function(user) {
		user.rightAnswer = rightAnswers.indexOf(user) >= 0;
	});

	socket.on('set-user-name', function(name) {
		user = {
			name: name,
			ip: ip
		};

		addUser(user);
		console.log(name + " entrou");

		socket.broadcast.emit('new-user', user);

		socket.emit('connected', {
			question: (questions[currentQuestion] || {}).question,
			rightAnswer: rightAnswers.indexOf(ip) >= 0,
			userName: user.name
		});
	});

	socket.on('send-token', function(token) {
		if(token === ADMIN_KEY) {
			socket.emit('admin-connected', {
				question: (questions[currentQuestion] || {}).question,
				users: _users
			});
		}
	});

	socket.on('asked-new-question', function() {
		var isLastQuestion = currentQuestion === (questions.length - 1);

		if(isLastQuestion) {
			return;
		}

		currentQuestion++;
		rightAnswers = [];

		socket.broadcast.emit('new-question', (questions[currentQuestion] || {}).question);
		socket.emit('new-question', (questions[currentQuestion] || {}).question);
	});

	socket.on('send-new-question', function(question) {
		question.answers = question.answers.split(' || ');
		questions.push(question);
	});

	socket.on('question-answered', function(data) {
		var user = getUser(getIp(socket));
		var question = questions[currentQuestion];
		var isRightAnswer;

		if(question && question.specificity) {
			var answerSpecificty = specificity.calculate(data.answer)[0].specificity;

			isRightAnswer = question.answers.indexOf(answerSpecificty) >= 0;
		} else {
			isRightAnswer = question.answers.indexOf(data.answer) >= 0;
		}

		if(isRightAnswer) {
			addRightAnswer(user);

			socket.broadcast.emit('admin-question-right', user.ip);
			socket.emit('question-right');

			console.log(user.name + ' acertou - ' + data.answer);
		} else {
			socket.emit('question-wrong', data.name);

			console.log(user.name + ' errou - ' + data.answer);
		}
	});
});

function addRightAnswer(user) {
	rightAnswers.push(user);
}

function addUser(user) {
	users.push(user);
}

function getIp(socket) {
	return socket.handshake.address;
}

function getUser(ip) {
	return users.find(function(user) {
		return user.ip === ip;
	});
}

http.listen(3000, function(){
	console.log('listening on *:3000');
});
