
/* Registration Service */

(function() {

	var shareService = function($http, $rootScope, authService, Constants, utilsService){

		var factory= {};
		factory.gShareFileObj = {};
		factory.downloadAndDecryptDropBoxFile = function(fUrl, fileName, encr_key){
			fUrl = fUrl.replace('?dl', '?dl=1');
			if (fileName.indexOf(".$enc") > -1) {
				var fName = fileName.slice(0, -4);
				var fExt = utilsService.getExtention(fName);

				var res = $http ({
					method: 'POST',
					url: Constants.PHP_LIBS_URL + "app/libs/downloadShareFile.php",
					data: $.param({ dURL: fUrl, fileName:fName, mimeType:fExt, enc_key:encr_key}),
					headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
				}).success(function(locData, status, header, config) {
					console.log("data : ", locData);
				}).error(function(err, status, header, config) {
					console.log("Box : ", err);
				});

				// var res = $http({
				// 			method: 'GET',
				// 			url: fUrl,
				// 			responseType :  "blob"
				// 	}).success(function(data, status, headers, config) {
				// 		if (data !== undefined) {
				// 				fr = new FileReader();
				// 				fr.onload = function(){
				// 						try {
				// 							var rawData = fr.result.split("base64,")[1];
				// 							var base64Data = RNCryptor.Decrypt(encr_key, sjcl.codec.base64.toBits(rawData));
				// 							var base64DataOP = sjcl.codec.base64.fromBits(base64Data);
				// 							var blob = utilsService.b64toBlob(base64DataOP, fExt);
				// 							saveAs(blob, fName);
				// 							$rootScope.$broadcast('changeCurrentState', {data: "Operation Done"});
				// 						}
				// 						catch(err) {
				// 								console.log("Error : ", err);
				// 						}
				// 				};
				// 				fr.readAsDataURL(data);
				// 		}
				// 	}).error(function(error, status, header, config) {
				// 			console.log("Error : ", error);
				// 	});
			}else{
				$rootScope.$broadcast('changeCurrentState', {data: "Operation Done"});
				var anchor = angular.element('<a/>');
				anchor.css({display: 'none'}); // Make sure it's not visible
				angular.element(document.body).append(anchor); // Attach to document
				anchor.attr({
					href: fUrl,
					target: '_blank',
					download: ''
				})[0].click();
				anchor.remove();
			}
		};

		factory.downloadAndDecryptBoxFile = function(fUrl, fileName, encr_key){
			if (fileName.indexOf(".$enc") > -1) {
				var fName = fileName.slice(0, -4);
				var mimeType = utilsService.getExtention(fName);

				var res = $http ({
					method: 'POST',
					url: Constants.PHP_LIBS_URL + "app/libs/downloadShareFile.php",
					data: $.param({ dURL: fUrl, fileName:fName, mimeType:mimeType, enc_key:encr_key}),
					headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
				}).success(function(locData, status, header, config) {
					console.log("data : ", locData);
				}).error(function(err, status, header, config) {
					console.log("Box : ", err);
				});

				// var res = $http({
				// 			method: 'GET',
				// 			url: fUrl,
				// 			responseType :  "blob"
				// 	}).success(function(data, status, headers, config) {
				// 		if (data !== undefined) {
				// 				fr = new FileReader();
				// 				fr.onload = function(){
				// 						try {
				// 							var rawData = fr.result.split("base64,")[1];
				// 							var base64Data = RNCryptor.Decrypt(encr_key, sjcl.codec.base64.toBits(rawData));
				// 							var base64DataOP = sjcl.codec.base64.fromBits(base64Data);
				// 							var blob = utilsService.b64toBlob(base64DataOP, fExt);
				// 							saveAs(blob, fName);
				// 							$rootScope.$broadcast('changeCurrentState', {data: "Operation Done"});
				// 						}
				// 						catch(err) {
				// 								console.log("Error : ", err);
				// 						}
				// 				};
				// 				fr.readAsDataURL(data);
				// 		}
				// 	}).error(function(error, status, header, config) {
				// 			console.log("Error : ", error);
				// 	});
			}else{
				$rootScope.$broadcast('changeCurrentState', {data: "Operation Done"});
				var anchor = angular.element('<a/>');
				anchor.css({display: 'none'}); // Make sure it's not visible
				angular.element(document.body).append(anchor); // Attach to document
				anchor.attr({
					href: fUrl,
					target: '_blank',
					download: ''
				})[0].click();
				anchor.remove();
			}
		};

		factory.downloadAndDecryptOneDriveFile = function(fUrl, fileName, encr_key){
			var dFURL = 'https://api.onedrive.com/v1.0/shares/'+ fUrl.split('/').pop() +'/root/content';
			if (fileName.indexOf(".$enc") > -1) {
				var fName = fileName.slice(0, -4);
				var fExt = utilsService.getExtention(fName);

				var res = $http ({
					method: 'POST',
					url: Constants.PHP_LIBS_URL + "app/libs/downloadShareFile.php",
					data: $.param({ dURL: dFURL, fileName:fName, mimeType:fExt, enc_key:encr_key}),
					headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
				}).success(function(locData, status, header, config) {
					console.log("data : ", locData);
				}).error(function(err, status, header, config) {
					console.log("Box : ", err);
				});

				// var res = $http({
				// 			method: 'GET',
				// 			url: dFURL,
				// 			responseType :  "blob"
				// 	}).success(function(data, status, headers, config) {
				// 		if (data !== undefined) {
				// 				fr = new FileReader();
				// 				fr.onload = function(){
				// 						try {
				// 							var rawData = fr.result.split("base64,")[1];
				// 							var base64Data = RNCryptor.Decrypt(encr_key, sjcl.codec.base64.toBits(rawData));
				// 							var base64DataOP = sjcl.codec.base64.fromBits(base64Data);
				// 							var blob = utilsService.b64toBlob(base64DataOP, fExt);
				// 							saveAs(blob, fName);
				// 							$rootScope.$broadcast('changeCurrentState', {data: "Operation Done"});
				// 						}
				// 						catch(err) {
				// 								console.log("Error : ", err);
				// 						}
				// 				};
				// 				fr.readAsDataURL(data);
				// 		}
				// 	}).error(function(error, status, header, config) {
				// 			console.log("Error : ", error);
				// 	});
			}else{
				$rootScope.$broadcast('changeCurrentState', {data: "Operation Done"});
				var anchor = angular.element('<a/>');
				anchor.css({display: 'none'}); // Make sure it's not visible
				angular.element(document.body).append(anchor); // Attach to document
				anchor.attr({
					href: dFURL,
					target: '_blank',
					download: ''
				})[0].click();
				anchor.remove();
			}
		};

		factory.downloadAndDecryptGoogleDriveFile = function(fUrl, fileName, encr_key){
			factory.gShareFileObj.url = fUrl;
			factory.gShareFileObj.encr_key = encr_key;
			factory.login();
		};

		/*
		*  Google Drive File Login method and callbacks
		*/
		factory.login = function(){
			var SCOPES = [Constants.GD_SCOPES];
			gapi.auth.authorize({
				'client_id': Constants.GD_CLIENT_ID,
				'scope': SCOPES,
				'immediate': false
			},factory.handleAuthResult);
		};

		factory.handleAuthResult = function(authResult) {
      var authorizeDiv = document.getElementById('authorize-div');
      if (authResult && !authResult.error) {
        factory.loadDriveApi();
      } else {
        console.log("GD error", authResult.error);
      }
    };

		factory.loadDriveApi = function() {
			gapi.client.load('drive', 'v2', function(){
				var gdFId = factory.gShareFileObj.url.split("/")[6];
				var _path = '/drive/v2/files/'+gdFId;
				var request = gapi.client.request({
					path : _path,
					method : 'GET'
				});
				request.execute(function(resp) {
					//var dlUrl = resp.exportLinks[Object.keys(resp.exportLinks)[0]];  //this is the url extracted from the request
					var dlUrl = resp.downloadUrl;
					var finalDlUrl = dlUrl.replace("?e=download&gd=true","");
					if (resp.fileExtension.indexOf(".$enc") > -1) {
						var gAccessToken = gapi.auth.getToken().access_token;
						var fName = resp.title.slice(0, -4);
						var fMimeType = resp.mimeType;

						var res = $http ({
							method: 'POST',
							url: Constants.PHP_LIBS_URL + "app/libs/downloadShareFile.php",
							data: $.param({ dURL: finalDlUrl, fileName:fName, mimeType:fMimeType, enc_key:factory.gShareFileObj.encr_key, tocken:'Bearer '+gAccessToken}),
							headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
						}).success(function(locData, status, header, config) {
							console.log("data : ", locData);
						}).error(function(err, status, header, config) {
							console.log("Box : ", err);
						});

						// var res = $http({
						// 			method: 'GET',
						// 			url: finalDlUrl,
						// 			headers: { 'Authorization': 'Bearer '+gAccessToken},
						// 			responseType :  "blob"
						// 	}).success(function(data, status, headers, config) {
						// 		if (data !== undefined) {
						// 				fr = new FileReader();
						// 					fr.onload = function(){
						// 							try {
						// 								var rawData = fr.result.split("base64,")[1];
						// 								var base64Data = RNCryptor.Decrypt(factory.gShareFileObj.encr_key, sjcl.codec.base64.toBits(rawData));
						// 								var base64DataOP = sjcl.codec.base64.fromBits(base64Data);
						// 								var blob = utilsService.b64toBlob(base64DataOP, fMimeType);
						// 								saveAs(blob, fName);
						// 								$rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
						// 							}
						// 							catch(err) {
						// 							    $rootScope.$broadcast('showErrorAlert', {data: err.message});
						// 							}
						// 					};
						// 					fr.readAsDataURL(data);
						// 		}
						// 	}).error(function(error, status, header, config) {
						// 			console.log("Error : ", error);
						// 	});
					}else {
						$rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
						var anchor = angular.element('<a/>');
						anchor.css({display: 'none'}); // Make sure it's not visible
						angular.element(document.body).append(anchor); // Attach to document
						anchor.attr({
							href: finalDlUrl,
							target: '_blank',
							download: ''
						})[0].click();
						anchor.remove();
					}
				});
			});
		}

		return factory;
	};

	shareService.$inject = ['$http', '$rootScope', 'authService', 'Constants', 'utilsService'];

	angular.module('authApp').factory('shareService', shareService);

}());
