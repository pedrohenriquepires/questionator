angular.module("app", ["btford.socket-io"])
.controller("appController", [
	"$scope",
	"socketFactory",
	function($scope, socketFactory) {
		socketFactory = new socketFactory();

		$scope.question = {};
		$scope.users = [];
		$scope.registerNewQuestion = false;
		$scope.connected = false;
		$scope.newQuestion = {};

		(function init() {
			var adminKey = localStorage.getItem('admin-key');

			socketFactory.emit('send-token', adminKey);
		})()

		$scope.sendNewQuestion = function() {
			socketFactory.emit('send-new-question', $scope.newQuestion);
			$scope.newQuestion = {};
			$scope.registerNewQuestion = false;
		}

		$scope.openRegisterNewQuestion = function() {
			$scope.registerNewQuestion = true;
		}

		$scope.closeRegisterNewQuestion = function() {
			$scope.registerNewQuestion = false;
		}

		$scope.askNewQuestion = function() {
			socketFactory.emit('asked-new-question', {});
		}

		socketFactory.on('new-user', function(user) {
			$scope.users.push(user);
		})

		socketFactory.on('admin-connected', function(data) {
			$scope.users = data.users;
			$scope.question = data.question;
			$scope.connected = true;
		})

		socketFactory.on('new-question', function(data) {
			$scope.rightAnswers = [];
			$scope.question = data;

			$scope.users.forEach(function(user) {
				user.rightAnswer = false;
			})
		});

		socketFactory.on('admin-question-right', function(ip) {
			debugger;
			$scope.users.find(function(user) {
				return user.ip === ip;
			}).rightAnswer = true;
		});
	}
])
