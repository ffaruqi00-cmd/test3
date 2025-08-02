/**
 * Created by xshanarain.
 */

(function() {

    var resetPasswordController = function($scope,$state,$rootScope,$cookies,$location,authService) {

        $scope.newPaswd ;
        $scope.rNewPaswd;
        $scope.username;


        $scope.resetPassword = function() {

            if($scope.newPaswd === $scope.rNewPaswd){
                $scope.isLoad = true;
                authService.resetPassword($scope.username,$scope.newPaswd).then(function(success){
                        $scope.result = success.data.message;
                        $scope.isLoad = false;
                        swal({
                            title: 'Password changed successfully..!!',
                            type: 'success'
                        },function () {
                            $state.go("login");
                        });
                    },
                    function(error){
                        $scope.isLoad = false;
                        $scope.result = error.data.message;
                    }
                );
            }else{
                $scope.result = "Password mismatch...!"
            }
        }

        $scope.reset = function(){
            $state.go("login");
        }

        var init = function() {
            $scope.username = $location.search().username;
        }

        init();

    };

    resetPasswordController.$inject = ['$scope','$state','$rootScope','$cookies','$location', 'authService'];

    angular.module('authApp').controller('resetPasswordController', resetPasswordController);

}());
