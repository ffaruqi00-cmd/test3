/**
 * Created by Jimmy Dave on 4/6/15.
 */

(function() {

    var homeController = function($scope,$state,$rootScope,$cookies) {

        $scope.email = $cookies.get('email');

        $scope.logout = function() {
            $cookies.remove('isLogin');
            $cookies.remove('email');
            $state.go('login');
        }

    };

    homeController.$inject = ['$scope','$state','$rootScope','$cookies'];
 

    angular.module('authApp').controller('homeController', homeController);

}());