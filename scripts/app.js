angular.module("app", ["btford.socket-io"])
.controller("appController", [
	"$scope",
	"$timeout",
	"socketFactory",
	function($scope, $timeout, socketFactory) {
		socketFactory = new socketFactory();

		$scope.formData = {};
		$scope.question = null;
		$scope.user = {};
		$scope.askedUserName = false;
		$scope.rightAnswer = false;
		$scope.wrongAnswer = false;
		$scope.answered = false;

		$scope.sendAnswer = function() {
			if($scope.formData.answer) {
				socketFactory.emit('question-answered', {
					answer: $scope.formData.answer
				});

				$scope.answered = true;
				$scope.formData.answer = null;
			}
		}

		$scope.sendUserName = function() {
			if(!!$scope.user.name) {
				socketFactory.emit('set-user-name', $scope.user.name);
				localStorage.setItem('user-name', $scope.user.name);
				$scope.askedUserName = false;
			}
		}

		socketFactory.on('connected', function(data) {
			$scope.user.name = data.userName;
			$scope.question = data.question;
			$scope.rightAnswer = data.rightAnswer;
		})

		socketFactory.on('question-right', function(name) {
			$scope.rightAnswer = true;
			$scope.answered = true;
		});

		socketFactory.on('question-wrong', function(name) {
			$scope.wrongAnswer = true;

			$timeout(function() {
				$scope.wrongAnswer = false;
			}, 500);
		});

		socketFactory.on('ask-user-name', function() {
			var userName = localStorage.getItem('user-name');

			if(!userName) {
				$scope.askedUserName = true;
			} else {
				$scope.user.name = userName;
				$scope.sendUserName();
			}
		});

		socketFactory.on('new-question', function(data) {
			$scope.answered = false;
			$scope.formData = {};
			$scope.question = data;
			$scope.rightAnswer = false;
		});
	}
]);
