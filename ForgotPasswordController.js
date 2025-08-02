/**
 * Created by xshanarain.
 */

(function() {

    var forgotPasswordController = function($scope,$state,$rootScope,$cookies,authService) {

        $scope.usrEmail ;
        $scope.result;

        $scope.fPswd = function() {
          
          $scope.isLoad = true;
        	authService.forgotPassword($scope.usrEmail).then(function(success){
                $scope.result = success.data.message;
                $scope.isLoad = false;
          },
          function(error){
            $scope.isLoad = false;
            $scope.result = error.data.message;
          }
          );

        }

    };

    forgotPasswordController.$inject = ['$scope','$state','$rootScope','$cookies', 'authService'];

    angular.module('authApp').controller('forgotPasswordController', forgotPasswordController);

}());
