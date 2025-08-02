/**
 *  @Author xshanarain 05/09/2016
 *  Share URL controller after login.
 */

(function() {

    var changePasswordController = function ($scope, $state, $stateParams, $routeParams, $cookies, $http, utilsService, $location,
      Constants, authService, $timeout, $rootScope) {

      $scope.oldPaswd = "";
      $scope.newPaswd = "";
      $scope.rNewPaswd = "";

    $scope.updatePassword = function(){
      if ($scope.oldPaswd != undefined && $scope.oldPaswd.length > 2) {
        if ($scope.newPaswd == $scope.rNewPaswd) {
          swal({
            title: "Please wait!",
            text: "We are updating your password!",
            showConfirmButton: false
          });

          authService.updatePassword($cookies.get("cUsername"), $scope.oldPaswd, $scope.newPaswd).then(function(success) {
            $scope.oldPaswd = "";
            $scope.newPaswd = "";
            $scope.rNewPaswd = "";
            swal("Successful","Your password has been updated successfully.", "success");
            $state.go("welcome");
          }, function(error) {
            swal("Error",error.date, "error");
          });

        }else{
          swal("New password mismatch","Please try again.", "error");
        }
      }else {
        swal("Invalid old password","Please try again.", "error");
      }
    }

    $scope.reset = function(){
      $state.go("welcome");
    }

	};

	changePasswordController.$inject = ['$scope', '$state', '$stateParams', '$routeParams', '$cookies', '$http', 'utilsService', '$location', 'Constants', 'authService', '$timeout', '$rootScope'];

	angular.module('authApp').controller('changePasswordController', changePasswordController);

}());
