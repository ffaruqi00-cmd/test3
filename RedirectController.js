/**
 *  @Author Jimmy Dave 23/03/2016
 *  Dropbox redirect controller after login.
 */

(function() {

    var redirectController = function ($scope, $state,$stateParams, $cookies, $http, utilsService, $location, Constants) {

	    var dropboxToken = "";

		//Fetch app token from response of authentication and list fist when page loads.
		var init = function() {

			var selectedCloud = utilsService.getSelectedCloud();
			if (selectedCloud == "Dropbox") {
				var str = $stateParams.access_token;
				if(str !== undefined && str.length > 2) {
					// Umair --24-4-22 there was token getting issue from string, which is not of fixed length
					//dropboxToken = str.substring(13, 77);
					var mixToken = str.split('=')[1];
					dropboxToken = mixToken.split('&')[0];
					$cookies.put("dropboxToken", dropboxToken);
				}
			}else if(selectedCloud == "Box"){
				var _url = $location.absUrl();
				var authCode = utilsService.getURLParameterValue("code", _url);
				if (authCode && authCode !== undefined && authCode.length > 2) {
                    var res = $http ({
                		method: 'POST',
        				url: Constants.PHP_LIBS_URL + "app/libs/Box.php",
        				data: $.param({bn_code:authCode}),
        				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
        			}).success(function(data, status, header, config) {
        				//test
                utilsService.saveBoxDotNetToken(data.access_token);
                window.location = Constants.REDIRECT_URL+"#/welcome";
        			}).error(function(err, status, header, config) {
        				console.log("Box : ", err);
        			});
				}
			}else if(selectedCloud == "OneDrive"){
        var oneDriveToken = $stateParams.access_token;
				if(oneDriveToken !== undefined && oneDriveToken.length > 2) {
					$cookies.put("oneDriveToken", oneDriveToken);
				}
        // var _url = $location.absUrl();
				// var authCode = utilsService.getURLParameterValue("code", _url);
				// if (authCode && authCode !== undefined && authCode.length > 2) {
        //         var res = $http ({
    		// 		method: 'POST',
    		// 		url: Constants.PHP_LIBS_URL + "app/libs/OneDrive.php",
    		// 		data: $.param({od_code:authCode}),
    		// 		headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
    		// 	}).success(function(data, status, header, config) {
        //     utilsService.saveOneDriveToken(data.access_token);
        //     window.location = Constants.REDIRECT_URL+"#/welcome";
    		// 	}).error(function(err, status, header, config) {
    		// 		console.log("One Drive : ", err);
    		// 	});
			  // }
			}
             $state.go("welcome");
		}

		init();
	};

	redirectController.$inject = ['$scope', '$state', '$stateParams','$cookies', '$http', 'utilsService', '$location', 'Constants'];

	angular.module('authApp').controller('redirectController', redirectController);

}());
