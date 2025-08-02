
/* Registration Controller to Handel Request from Registration */

(function() {

	var registrationController = function($scope,$state,$rootScope,$cookies, authService) {
		
		$scope.isLoad = false;
		
		/* register method */
		$scope.register = function() {
			$scope.isLoad = true;
			/* Call auth method in Registration Service*/
			authService.registration($scope.username, $scope.password, $scope.secretquestion, $scope.secretanswer, $scope.status).then(function(success){
				if(success.data.message == "New user Added to Database"){
					$state.go('login');
				}else {
					$scope.err = success.data.message;
				}
                $scope.isLoad = false;
			},function(error) {
    		    $scope.isLoad = false;   
			    }
			);
		};
	};

	registrationController.$inject = ['$scope','$state','$rootScope','$cookies', 'authService'];

	angular.module('authApp').controller('registrationController', registrationController);
}());