/**
 *  @Author xshanarain 05/09/2016
 *  Share URL controller after login.
 */

(function() {

    var settingsController = function ($scope, $state, $stateParams, $routeParams, $cookies, $http, utilsService, $location,
      Constants, authService, $timeout, $rootScope) {

      $scope.isDB = true;
      $scope.isBN = true;
      $scope.isGD = true;
      $scope.isOD = true;
      $scope.isDE = true;
      $scope.isMCD = false;
      $scope.isFileMenu = false;
      $scope.turnOfEncrption = false;
      $scope.objCVC = {
		  Compliance : false, 
		  HIPAA: false, 
		  GDPR: false, 
		  PCI: false, 
		  dataLeakProtection: false
	  };
	  $scope.decryptFilesWhileDownloading = false;
	
    /*
      Init method
    */
    var init = function() {
		debugger;
      $scope.isDB = utilsService.getLocalStorage("isDB");
      $scope.isBN = utilsService.getLocalStorage("isBN");
      $scope.isGD = utilsService.getLocalStorage("isGD");
      $scope.isOD = utilsService.getLocalStorage("isOD");
      $scope.isDE = utilsService.getLocalStorage("isDE");
      $scope.isMCD = utilsService.getLocalStorage("isMCD");
      $scope.isFileMenu = utilsService.getLocalStorage("isFileMenu");
	  $scope.objCVC.HIPAA = utilsService.getLocalStorage("HIPAA");
      $scope.objCVC.GDPR = utilsService.getLocalStorage("GDPR");
	  $scope.objCVC.PCI = utilsService.getLocalStorage("PCI");
	  $scope.objCVC.dataLeakProtection = utilsService.getLocalStorage("dataLeakProtection");
	  $scope.decryptFilesWhileDownloading = utilsService.getLocalStorage("decryptFilesWhileDownloading", false);
	  if($scope.objCVC.HIPAA || $scope.objCVC.GDPR || $scope.objCVC.PCI)
		  $scope.objCVC.Compliance = true;
		
        $scope.turnOfEncrption = utilsService.getLocalStorage("turnOfEncryption");
	}

    $scope.saveSettings = function(){
      utilsService.setLocalStorage("isDB", $scope.isDB);
      utilsService.setLocalStorage("isBN", $scope.isBN);
      utilsService.setLocalStorage("isOD", $scope.isOD);
      utilsService.setLocalStorage("isGD", $scope.isGD);
      utilsService.setLocalStorage("isDE", $scope.isDE);
      utilsService.setLocalStorage("isMCD", $scope.isMCD);
      utilsService.setLocalStorage("isFileMenu", $scope.isFileMenu);
	  
	  
	  utilsService.setLocalStorage("HIPAA", $scope.objCVC.HIPAA);
	  utilsService.setLocalStorage("GDPR", $scope.objCVC.GDPR);
	  utilsService.setLocalStorage("PCI", $scope.objCVC.PCI);
	  utilsService.setLocalStorage("dataLeakProtection", $scope.objCVC.dataLeakProtection);	
	  utilsService.setLocalStorage("decryptFilesWhileDownloading", $scope.decryptFilesWhileDownloading);

      $state.go("welcome");
    }
	
	$scope.setComplianceValidation = function(){
		if(!$scope.objCVC.Compliance)
		{
			$scope.objCVC.HIPAA = false;$scope.objCVC.GDPR = false;$scope.objCVC.PCI = false;
		}
	}
    $scope.resetSettings = function(){
      $state.go("welcome");
    }

    $scope.updateDropBoxVisibility = function(event){
      if ($scope.isBN == false && $scope.isOD == false &&  $scope.isGD == false && $scope.isMCD == false &&  $scope.isDB == true) {
        $('#dbCB').prop('checked', true);
        swal("Warning","You need to have atleast one cloud service enabled to use this application", "warning");
      }else{
        $scope.isDB = !$scope.isDB;
      }
    }

    $scope.updateBoxVisibility = function(event){
      if ($scope.isDB == false && $scope.isOD == false &&  $scope.isGD == false && $scope.isMCD == false &&  $scope.isBN == true) {
        $('#bnCB').prop('checked', true);
        swal("Warning","You need to have atleast one cloud service enabled to use this application", "warning");
      }else{
        $scope.isBN = !$scope.isBN;
      }
    }

    $scope.updateOneDriveVisibility = function(event){
      if ($scope.isDB == false && $scope.isBN == false &&  $scope.isGD == false && $scope.isMCD == false &&  $scope.isOD == true) {
        $('#odCB').prop('checked', true);
        swal("Warning","You need to have atleast one cloud service enabled to use this application", "warning");
      }else{
        $scope.isOD = !$scope.isOD;
      }
    }

    $scope.updateGoogleDriveVisibility = function(event){
      if ($scope.isDB == false && $scope.isBN == false &&  $scope.isOD == false && $scope.isMCD == false &&  $scope.isGD == true) {
        $('#gdCB').prop('checked', true);
        swal("Warning","You need to have atleast one cloud service enabled to use this application", "warning");
      }else{
        $scope.isGD = !$scope.isGD;
      }
    }

    $scope.updateMyCloudDriveVisibility = function(event){
      if ($scope.isDB == false && $scope.isBN == false &&  $scope.isOD == false &&  $scope.isGD == false && $scope.isMCD == true) {
        $('#mcdCB').prop('checked', true);
        swal("Warning","You need to have atleast one cloud service enabled to use this application", "warning");
      }else{
        $scope.isMCD = !$scope.isMCD;
      }
    }

     $scope.updateFileMenuVisibility = function(event){
        $scope.isFileMenu = !$scope.isFileMenu;

    }

    $scope.updateDefaultUpload = function(event){
      $scope.isDE = !$scope.isDE;
    }

		init();
	};

	settingsController.$inject = ['$scope', '$state', '$stateParams', '$routeParams', '$cookies', '$http', 'utilsService', '$location', 'Constants', 'authService', '$timeout', '$rootScope'];

	angular.module('authApp').controller('settingsController', settingsController);

}());
