/**
 *  @Author xshanarain 05/09/2016
 *  Share URL controller after login.
 */

(function() {

    var shareController = function ($scope, $state, $stateParams, $routeParams, $cookies, $http, utilsService, $location,
      Constants, shareService, $timeout, $rootScope) {

    /*
      Init method
    */
    var init = function() {
      window.setTimeout(function() {$scope.downloadShareFile();}, 500);
		}

    $scope.downloadShareFile = function(){
      console.log("$routeParams : ", $location.search());
      var source = $location.search().csource;
      var url = $location.search().surl;
      var fileName = $location.search().fileName;
      var encr_key = $location.search().utocken;
      if (source == 'Dropbox') {
        shareService.downloadAndDecryptDropBoxFile(url, fileName, encr_key);
      }else if (source == 'GoogleDrive') {
        shareService.downloadAndDecryptGoogleDriveFile(url, fileName, encr_key);
      }else if (source == 'Box') {
        shareService.downloadAndDecryptBoxFile(url, fileName, encr_key);
      }else if (source == 'OneDrive') {
        shareService.downloadAndDecryptOneDriveFile(url, fileName, encr_key);
      }
    }

    //Show Error Alert method
    $scope.$on('changeCurrentState', function(event, data) {
      if ($cookies.get('appToken')) {
        $state.go("welcome");
      }else
        $state.go("login");
    });

		init();
	};

	shareController.$inject = ['$scope', '$state', '$stateParams', '$routeParams', '$cookies', '$http', 'utilsService', '$location', 'Constants', 'shareService', '$timeout', '$rootScope'];

	angular.module('authApp').controller('shareController', shareController);

}());
