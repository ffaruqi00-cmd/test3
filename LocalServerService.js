
/* Registration Service */

(function() {

	var localServerService = function($http, $rootScope, Constants, utilsService){

		var factory= {};

		factory.getFileDir = function (path) {
            return fetch(`http://${utilsService.getLocalServer1URL()}/cloudfishdrive/listing/?path=${path}&username=${utilsService.getLoggedInUsername()}`,{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                // mode: 'no-cors'
            })
                .then((data) => data.text())
                .then((response) => console.log(response));
        };

		return factory;
	};

    localServerService.$inject = ['$http', '$rootScope', 'Constants', 'utilsService'];

	angular.module('authApp').factory('localServerService', localServerService);

}());
