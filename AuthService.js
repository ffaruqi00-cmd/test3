
/* Registration Service */

(function() {

	var authService = function($http, utilsService){


		var baseurlreg = "https://mycloudfish.com/device_tracking/index.php/api/user/deviceuser/format/json/";
		var baseurllogin = "https://mycloudfish.com/device_tracking/index.php/api/user/signin/format/json/";
        var baseurlloginADFS = "https://mycloudfish.com/device_tracking/index.php/api/user/ADFS/format/json/";
        var fetchLocalServerURL = "https://mycloudfish.com/device_tracking/index.php/api/user/company_local_server/format/json/";
		var baseurlForgotPassword = "https://mycloudfish.com/device_tracking/index.php/api/user/forgotPassword/format/json/";
		var baseurlUpdatePassword = "https://mycloudfish.com/device_tracking/index.php/api/user/changeUserPassword/format/json/";
        var baseurlResetPassword = "https://mycloudfish.com/device_tracking/index.php/api/user/resetPassword/format/json/";
        

		var factory= {};
		factory.activeSession = null;

		/* auth method */
        factory.registration = function(username, password, secretquestion, secretanswer, status) {

			/* RESTweb service for post data to Spring Controller */
            var res = $http ({
                method: 'POST',
                url: baseurlreg,
                data: $.param({username:username, passwd:password, secret_question:secretquestion, secret_answer:secretanswer, user_status:status}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        }

		/* auth method */

        factory.randomString = function () {
            var result = '';
            var chars ='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var length = 10;
            for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
            return result;
        };

        factory.createCustomer = function(username, password, fname, lname, status, fullPhoneNumber,MfaEnabled) {

    var randomId = factory.randomString();
    var date = new Date();
    randomId = date.getTime() + randomId;

    console.log("in create customer", username, password, fname, lname, status, fullPhoneNumber);

    var res = $http({
        method: 'POST',
        url: "https://mycloudfish.com/device_tracking/index.php/api/user/signup/format/json/",
        data: $.param({
            customer_id: randomId,
            username: username,
            passwd: password,
            secret_question: "test question",
            secret_answer: "test answer",
            user_status: status,
            end_date: '2018-12-31 00:00:00',
            licence_type: 'FREE',
            coupon_code: '',
            signup_platform: "WEB",
            signup_device_id_or_ip: "clientIP",
            company_id: "1",
            lastname: lname,
            firstname: fname,
            phone_number: fullPhoneNumber,
            MfaEnabled: MfaEnabled
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).success(function(data, status, header, config) {
        console.log('Success in create customer:', data);
        factory.activeSession = data;
        utilsService.saveAppAuthObject(data);
        utilsService.updateTrunOFEncryptionWithServer(data.isEncryptionOff);
        utilsService.updateCloudVisibilityWithServer(data.show_clouds);
        return data;
    }).error(function(err, status, header, config) {
        console.log('Error in create customer:', err);
        return err;
    });

    return res;
};



        factory.authenticateViaADFS = function(email, password) {

            console.log("in auth via ADFS" + email);

            var response = $http({
                method: 'POST',
                url: baseurlloginADFS,
                data: $.param({username:email, passwd:password, appcode:'1'}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded', 
                 }
            }).success(function(data, status, headers, config) {
                console.log("in sucess - auth via adfs");
                if (data.user_status === 'INACTIVE') {
                    console.log("in active");
                    data.token = undefined;
                    data.message =
                     "Your account is disabled by your admin. Please contact your admin. Thanks";
                }else {
                    factory.activeSession = data;
                    utilsService.saveAppAuthObject(data);
                    utilsService.updateSelectedCloud("Dropbox");
                    utilsService.updateTrunOFEncryptionWithServer(data.isEncryptionOff);
                    utilsService.updateCloudVisibilityWithServer(data.show_clouds);
                    console.log("auth via adfs else");
                }
                return data;
            }).error(function(err, status, headers, config) {
                return err;
            });
            return response;
        }
        

		factory.authenticate = function(email, password) {


            var response = $http({
                method: 'POST',
                url: baseurllogin,
                data: $.param({username:email, passwd:password, appcode:'1'}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded', 
                 }
            }).success(function(data, status, headers, config) {
                if (data.user_status === 'INACTIVE') {
                    data.token = undefined;
                    data.message =
                     "Your account is disabled by your admin. Please contact your admin. Thanks";
                }else {
                    factory.activeSession = data;
                    utilsService.saveAppAuthObject(data);
                    utilsService.updateSelectedCloud("Dropbox");
                    utilsService.updateTrunOFEncryptionWithServer(data.isEncryptionOff);
                    utilsService.updateCloudVisibilityWithServer(data.show_clouds);
                }
                return data;
            }).error(function(err, status, headers, config) {
                return err;
            });
            return response;
        }

        




      

        factory.fetchLocalServerInformation = function(companyId) {

        

            var response = $http({
                method: 'POST',
                url: fetchLocalServerURL,
                data: $.param({companyId:companyId}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(err, status, headers, config) {
                return err;
            });
            return response;
        }



				factory.forgotPassword = function(email) {
								var response = $http({
										method: 'POST',
										url: baseurlForgotPassword,
										data: $.param({username:email}),
										headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
								}).success(function(data, status, headers, config) {
										return data;
								}).error(function(err, status, headers, config) {
										return err;
								});
								return response;
				}

				factory.updatePassword = function(email, oldPassword, newPassword) {
								var response = $http({
										method: 'POST',
										url: baseurlUpdatePassword,
										data: $.param({username:email, passwd:oldPassword, newpasswd:newPassword}),
										headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
								}).success(function(data, status, headers, config) {
										return data;
								}).error(function(err, status, headers, config) {
										return err;
								});
								return response;
				}

                factory.resetPassword = function(email, newPassword) {
                    var response = $http({
                        method: 'POST',
                        url: baseurlResetPassword,
                        data: $.param({username:email, newpasswd:newPassword}),
                        headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
                    }).success(function(data, status, headers, config) {
                        return data;
                    }).error(function(err, status, headers, config) {
                        return err;
                    });
                    return response;
                }

              factory.fetchCompanyID = function(){ return companyID;}




		return factory;
	};

	authService.$inject = ['$http', 'utilsService'];

	angular.module('authApp').factory('authService', authService);

}());
