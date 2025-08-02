/**
 * Created by Jimmy Dave on 4/6/15.
 */

'use strict';

/**
 * Login controller for handle login request.
 */
(function() {

    var loginController = function($scope,$state,$rootScope,$cookies,authService, utilsService, $timeout,$http) {
    	 $scope.isLoad = false;
    	 $scope.errSU = "";
    	 $scope.aggAccepted = true;
        $scope.showOtpField = false;
		$scope.obfEmail;
		$scope.obfPhone;
		$scope.showSet2FA;
		$scope.IsEmail;
		$scope.generatedOtp;
		//$scope.isEnterprise = true;
		$scope.isMandatory = false;
		//$scope.isConsumer=true;

$scope.login = function () {
    console.log("login");
    $scope.isLoad = true;

    authService.authenticate($scope.email, $scope.password).then(function (success) {
        var token = success.data.token;
		debugger
        if (token !== undefined && token.length > 0) {
            $scope.isLoad = false;
			$cookies.put("userId", success.data.user_id);

			console.log("userId from cookie:", $cookies.get("userId"));
            $scope.tempToken = token;
            $scope.tempUsername = $scope.email;
            $scope.tempCompanyId = success.data.company_id;
            if (success.data.phone_number) {
                $scope.phone = success.data.phone_number;
            }

            console.log(success.data, "hello");

            authService.fetchLocalServerInformation(success.data.company_id)
                .then(function (localServerSuccess) {
                    $scope.tempLocalServerURL = localServerSuccess.data.local_server_address;
                }, function (localServerError) {
                    console.error(localServerError);
                });

            $scope.obfEmail = success.data.hashed_email;
            $scope.obfPhone = success.data.hashed_phone ? success.data.hashed_phone : null;

            

            if (!success.data.sms_verification_enabled || success.data.sms_verification_enabled == false ) {
                $cookies.put("appToken", $scope.tempToken);
                $cookies.put("cUsername", $scope.email);
                $cookies.put("justLoggedIn", true);
                $cookies.put("localServer1URL", $scope.tempLocalServerURL);
				console.log("hi");
                if (success.data.custpmer_type.toLowerCase() === "consumer" || success.data.custpmer_type === "") {
                    $scope.isConsumer = true;
                } else if (success.data.custpmer_type.toLowerCase() === "enterprise") {
                $scope.isEnterprise = true;

                if (success.data.mfa_mandatory ) {
                    $scope.isMandatory = true;
                  }
                }
               

                $scope.showOtpInput = false;
                $scope.disableFields = false;
                $scope.IsEmail = false;
            } else {
                $scope.showSet2FA = !success.data.sms_verification_enabled;
                $scope.showOtpField = true;
                $scope.disableFields = true;
            }

            $scope.err = "";
        } else {
            $scope.isLoad = false;
            $scope.err = success.data.message || "Invalid credentials.";
        }
    }, function (error) {
        $scope.isLoad = false;
        console.error(error);
        $scope.err = "An error occurred during login.";
    });
};	
		
$scope.skipMFA = function () {
    if (!$scope.$$phase) {
        $scope.$apply(() => {
            $scope.isEnterprise = false;
            $scope.isConsumer = false;
            $scope.mfaEnable = false;
        });
    } else {
        $scope.isEnterprise = false;
        $scope.isConsumer = false;
        $scope.mfaEnable = false;
    }
    $state.go('welcome'); 
};

$scope.moveMFA = function () {
    if (!$scope.$$phase) {
        $scope.$apply(() => {
            $scope.isEnterprise = false;
            $scope.isConsumer = false;
            $scope.mfaEnable = true;
        });
    } else {
        $scope.isEnterprise = false;
        $scope.isConsumer = false;
        $scope.mfaEnable = true;
    }
};

$scope.moveBackMFA = function () {
    if (!$scope.$$phase) {
        $scope.$apply(() => {
            $scope.isVerifyMFA = false;
			$scope.isEnterprise = false;
            $scope.isConsumer = false;
            $scope.mfaEnable = true;
        });
    } else {
		$scope.isVerifyMFA= false;
        $scope.isEnterprise = false;
        $scope.isConsumer = false;
        $scope.mfaEnable = true;
    }
};
$scope.enableMFA = async function () {
    try {
        const requestData = {
            phoneNumber: `${$scope.countrycode}${$scope.phone_number}`, 
            
          
        };

        const response = await fetch('https://track-my-device.com/api/twilio/sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`Failed to send OTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            $scope.$apply(() => {
                $scope.isVerifyMFA = true;
                $scope.isEnterprise = false;
                $scope.isConsumer = false;
                $scope.mfaEnable = false;
            });
        } else {
            $scope.$apply(() => {
                $scope.isVerifyMFA = false;
                $scope.isEnterprise = false;
                $scope.isConsumer = false;
                $scope.mfaEnable = false;
            });
            alert('Error sending OTP, please try again');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        alert('Oops! Something went wrong. Please try a different method.');
    }
};

$scope.verifyMfaOtp = async function () {
    try {
        const response = await fetch('https://track-my-device.com/api/twilio/sms-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: `${$scope.countrycode}${$scope.phone_number}`, 
                otp: $scope.MfaOtp
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to verify OTP: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            console.log("OTP verified successfully.");
            await $scope.enableMFAConfirm();
        } else {
            alert("Invalid OTP. Please try again.");
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        alert("Error verifying OTP, Try again.");
    }
};
$scope.enableMFAConfirm = async function () {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("email", $scope.email);
    urlencoded.append("password", $scope.password);
    urlencoded.append("phone_number", $scope.countrycode + $scope.phone_number);

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
    };

    try {
        const apiPath = "https://mycloudfish.com/device_tracking/index.php/api/user/enable2FA/format/json/";
        const response = await fetch(apiPath, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("MFA enabled successfully:", data);
        $scope.skipMFA();
    } catch (error) {
        console.error("Failed to enable MFA:", error);
    }
};
$scope.resendMfaOtp = async function () {
    try {
        const response = await fetch('https://track-my-device.com/api/twilio/sms/resend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: `${$scope.countrycode}${$scope.phone_number}`,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("OTP resent successfully:", data);
            alert(data.message);
        } else {
            throw new Error('Failed to resend OTP');
        }

    } catch (error) {
        console.error("Error resending OTP:", error);
        alert("Error resending OTP. Please try again.");
    }
};


$scope.closeOtpModal = function () {
    $scope.showOtpField = false;
	$scope.disableFields = false;
};
 
		
$scope.generateOtp = async function () {
    async function fetchDecryptionKey() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

        const urlencoded = new URLSearchParams();
        urlencoded.append("email", $scope.email); 
        urlencoded.append("password", $scope.password); 

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: urlencoded,
            redirect: "follow",
        };

        try {
            const response = await fetch("https://mycloudfish.com/device_tracking/index.php/api/user/sendOtpSms/format/json/", requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
        } catch (error) {
            console.error("Failed to fetch decryption key:", error);
            throw error;
        }
    }

    async function decryptAndCallSmsLogin() {
        try {
            
            const smsLoginUrl = "https://track-my-device.com/api/twilio/sms_login";
            const smsLoginData = new URLSearchParams();
            smsLoginData.append("email", $scope.email);
            smsLoginData.append("password", $scope.password);
            smsLoginData.append("phoneNumber", $scope.phone);

            const smsLoginResponse = await fetch(smsLoginUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: smsLoginData,
            });

            if (!smsLoginResponse.ok) {
                const responseJson = await smsLoginResponse.json();
                throw new Error(`sms_login API Error: ${responseJson.message}`);
            }
            alert("OTP sent to your number successfully!");
            console.log("SMS Login Response:", await smsLoginResponse.json());

        } catch (error) {
            if (error.message.includes('authentication failed')) {
                alert("Authentication failed. Try again later.");
            } else {
                alert("Oops! Something went wrong. Try again later or try a different method.");
            }
            console.error("Error during decryption or API call:", error);
        }
    }

   await decryptAndCallSmsLogin();
	
	$scope.$apply(() => {
        $scope.otpGenerated = true;
        $scope.showOtpInput = true;
        $scope.showOtpField = false;
    });
};


$scope.sendOtpEmail = function () {

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("emails", $scope.email);
    urlencoded.append("otpLength", "6");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
    };

    fetch("https://mycloudfish.com/device_tracking/index.php/api/user/sendOtpEmail/format/json/", requestOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((result) => {
		     //console.log("hi");
            if (result.success) {
                $scope.$apply(() => { 
                    $scope.otpGenerated = true;
                    $scope.showOtpInput = true;
					//console.log("hi");
                    $scope.showOtpField = false;
					//console.log("hi");
					$scope.IsEmail = true;
					$scope.isEmailText = true;
                });
            } else {
                alert("Failed to send OTP email: " + (result.message || "Unknown error"));
            }
        })
        .catch((error) => {
            console.error("Error sending OTP email:", error);
            alert("An error occurred while sending OTP email. Please try again.");
        });
};
 $scope.sendOtpNewNum = async function () {
    try {
        // Prepare the phone number
        const phoneNumber = `${$scope.countrycode}${$scope.phone_number}`;

        const response = await fetch('https://track-my-device.com/api/twilio/sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("OTP sent successfully:", data);
            alert("OTP sent successfully to your number.");
        } else {
            alert("Oops, something went wrong. Please try again later.");
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        alert("Oops, something went wrong. Please try again later.");
    }
};

$scope.resendOtpNewNum = function () {
        $scope.sendOtpNewNum(); 
 };

$scope.verifyOtpNewNum = async function () {
    const phoneNumber = `${$scope.countrycode}${$scope.phone_number}`;
    const otp = $scope.NewNumOtp;

    try {
        const response = await fetch('https://track-my-device.com/api/twilio/sms-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                otp: otp,
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert("OTP verified successfully!");
            $scope.closeVerifyNum();

            authService.createCustomer(
                $scope.email,
                $scope.choosepassword,
                $scope.firstname,
                $scope.lastname,
                "ACTIVE",
                phoneNumber,
                $scope.twoFactorAuth
            ).then(
                function (success) {
                    var token = success.data.token;
                    console.log("Signup successful. Token received.");
                    console.log(token);

                    $scope.isLoad = false;

                    $("#signUpModel").modal("hide");
                    $cookies.put("appToken", token);
                    $cookies.put("cUsername", $scope.email);
                    $cookies.put("justLoggedIn", true);

                    console.log("Redirecting to welcome page");
                    $state.go('welcome');
                },
                function (error) {
                    $scope.isLoad = false;
                    $scope.errSU = error.data.message;
                }
            );
        } else {
            alert("Invalid OTP. Please try again.");
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        alert("Oops, something went wrong. Please try again later.");
    }
};

    $scope.closeVerifyNum = function () {
		$('#signUpModel').modal('show');
        $scope.isVerifyNewNum = false; 
        $scope.NewNumOtp = ''; 
		
    };


$scope.clearOtp = function () {
    $scope.otp = null;
    $scope.otpCreatedAt = null;
    $scope.otpExpiresAt = null;
    $scope.otpGenerated = false;
    alert("OTP has expired.");
};

$scope.isOtpExpired = function () {
    if ($scope.otpExpiresAt) {
        return new Date().getTime() > $scope.otpExpiresAt;
    }
    return false;
};

$scope.generateOtpEmailButtonClicked = function () {
    $scope.sendOtpEmail();
};
$scope.generateOtpButtonClicked = function () {
    $scope.generateOtp();
};

$scope.verifyOtp = function () {
    if ($scope.IsEmail) {
        $scope.verifyEmailOtp();
    } else {
        $scope.submitOtp();
    }
};

$scope.resendOtp = async function () {
    if ($scope.IsEmail) {
        $scope.resendEmailOtp();
    } else {
        try {
            const requestBody = {
                email: $scope.email,
                password: $scope.password,
                phoneNumber: $scope.phoneNumber
            };

            const response = await fetch("https://track-my-device.com/api/twilio/sms-resendEp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const responseData = await response.json();
                if (responseData.success) {
                    alert(responseData.message);
                } else {
                    alert("Oops! Something went wrong. Try again later.");
                }
            } else {
                alert("Oops! Something went wrong. Try again later.");
            }
        } catch (error) {
            console.error("Error resending OTP:", error);
            alert("Oops! Something went wrong. Try again later.");
        }
    }
};

$scope.submitOtp = async function () {
    console.log("Submitting OTP");

    const enteredOtp = document.getElementById('otpInput').value;

    const otpData = {
        email: $scope.email,            
        password: $scope.password,      
        phoneNumber: $scope.phone,      
        otp: enteredOtp                 
    };

    try {
        const response = await fetch("https://track-my-device.com/api/twilio/sms_login/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(otpData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.message}`);
        }

        const data = await response.json();
        console.log("OTP Verified Successfully:", data);

        $cookies.put("appToken", data.token);
        $cookies.put("cUsername", $scope.email);
        $cookies.put("justLoggedIn", true);
        $state.go('welcome');
        console.log("User successfully redirected to welcome page");
    } catch (error) {
        console.error("Error during OTP verification:", error);
        alert("Oops, something went wrong. Please try again later.");
    }
};

$scope.verifyEmailOtp = function () {
    const enteredOtp = document.getElementById('otpInput').value;
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("otp", enteredOtp);
    urlencoded.append("email", $scope.email);

    fetch("https://mycloudfish.com/device_tracking/index.php/api/user/verifyOtp/format/json/", {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                alert("Email OTP verified successfully!");
                $cookies.put("appToken", $scope.tempToken);
                $cookies.put("cUsername", $scope.email);
                $cookies.put("justLoggedIn", true);
                $cookies.put("localServer1URL", $scope.tempLocalServerURL);
                $state.go('welcome');
                $scope.showOtpInput = false;
                $scope.disableFields = false;
				$scope.IsEmail = false;
            } else {
                alert("Invalid Email OTP. Please try again.");
            }
        })
        .catch((error) => {
            console.error("Error verifying email OTP:", error);
            alert("An error occurred while verifying email OTP.");
        });
};

$scope.resendEmailOtp = function () {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("email", $scope.email);
    urlencoded.append("otpLength", "6");

    fetch("https://mycloudfish.com/device_tracking/index.php/api/user/resendOtp/format/json/", {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                alert("A new OTP has been sent to your email.");
            } else {
                alert("Failed to resend email OTP. Please try again.");
            }
        })
        .catch((error) => {
            console.error("Error resending email OTP:", error);
            alert("An error occurred while resending email OTP.");
        });
};


$scope.goBack = function () {
    if ($scope.verifyNewNum) {
 
        $('#signUpModel').modal('show');
    } else { 
        $scope.showOtpInput = false;
        $scope.showOtpField = true;
        $scope.IsEmail = false;
        $scope.IsEmailText = false;
    }
};
        var wind="";

        $scope.loginViaOffice365 = function(){
            console.log("logininoffice365");
     var wLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var wTop = window.screenTop ? window.screenTop : window.screenY;
            var w = 840;
            var h = 600;
            var left = wLeft + (window.innerWidth / 2) - (w / 2);
            var top = 10;
         win = window.open("https://mycloudfish.com/app/LoginViaOffice365/app/", 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

            
        }



        var win="";

        $scope.loginViaADFS = function(){
            console.log("login via ADFS");
            $scope.isLoad = true;
            var wLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var wTop = window.screenTop ? window.screenTop : window.screenY;
            var w = 840;
            var h = 600;
            var left = wLeft + (window.innerWidth / 2) - (w / 2);
            var top = 10;
         win = window.open("/admin/adfs-integration/saml.php", 'SAML', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
            
}       
    
         window.loggedIn = function (name, email) {
            console.log("loggined in");
            win.close();
            var div = document.getElementById('user');
            div.innerHTML ="Name : "+name+"<br/>"+"Email : "+ email;
           // $scope.emailAddress = email;
           console.log(email);
           $scope.email = email;

           authService.authenticateViaADFS($scope.email, $scope.password).then(function(success){
             console.log("sucess in auth via adfs");
                var token = success.data.token;
                console.log(token+ "token");
                if(success.data.token !== undefined && token.length > 0){
                    console.log("sucess in auth via adfs");
                    $scope.isLoad = false;
                    $cookies.put("appToken", token);
                    $cookies.put("cUsername", $scope.email);
                    $cookies.put("justLoggedIn", true);
                     // console.log("companyidinlogincontroller"+success.data.company_id);
                    authService.fetchLocalServerInformation(success.data.company_id)
                        .then(function (success) {
                            $cookies.put("localServer1URL", success.data.local_server_address);
                        }, function (error) {
                            console.error(error);
                        });
                    if (authService.activeSession.audit_level > 0) {
                        utilsService.postAudit("LOGIN", "", "", "");
                    }
                     $state.go('welcome');
                }
                if(success.data.token === undefined)
                {
                    console.log("in fail");
                 $scope.emailaddress = email;
                $scope.choosepassword = "123";
                $scope.firstname = "fname";
                $scope.lastname = "lname";
                $scope.aggAccepted = true;
                $scope.signUp();
                }

                else {
                    $scope.isLoad = false;
                    $scope.err = success.data.message;
                }

              //console.log("here");
            },
            function(error){
            }
            );
       };


           // console.log($scope.emailAddress);
    


        $scope.aggrementAccepted = function () {
            $scope.aggAccepted = !$scope.aggAccepted;
        }

    $scope.signUp = function () {
    console.log("Signup process started");

    $scope.errSU = "";

    if ($scope.choosepassword !== $scope.confirmpassword) {
        console.log($scope.choosepassword, "--", $scope.confirmpassword);
        $scope.errSU = "Passwords do not match.";
        alert($scope.errSU);
        return;
    }

    if (!$scope.choosepassword) {
        $scope.errSU = "Please enter the password.";
        alert($scope.errSU);
        return;
    }

    if ($scope.twoFactorAuth || $scope.phoneNumber) {
        if (!$scope.countryCode || !$scope.phoneNumber) {
            $scope.errSU = "Phone number and country code are required.";
            alert($scope.errSU);
            return;
        }
        $scope.fullPhoneNumber = $scope.countryCode && $scope.phoneNumber ? $scope.countryCode + $scope.phoneNumber : null;
       
        $scope.isVerifyNewNum = true;
		 $scope.sendOtpNewNum();
        $("#signUpModel").modal("hide"); 
        return;
    }

    console.log("Validation complete");
    $scope.isLoad = true;

    var fullPhoneNumber = $scope.countryCode && $scope.phoneNumber ? $scope.countryCode + $scope.phoneNumber : null;

    authService.createCustomer(
        $scope.email,
        $scope.choosepassword,
        $scope.firstname,
        $scope.lastname,
        "ACTIVE",
        fullPhoneNumber,
        $scope.twoFactorAuth
    ).then(
        function (success) {
            var token = success.data.token;
            console.log("Signup successful. Token received.");
            console.log(token);

            $scope.isLoad = false;

            $("#signUpModel").modal("hide");
            $cookies.put("appToken", token);
            $cookies.put("cUsername", $scope.email);
            $cookies.put("justLoggedIn", true);

            console.log("Redirecting to welcome page");
            $state.go('welcome');
        },
        function (error) {
            $scope.isLoad = false;
            $scope.errSU = error.data.message;
        }
    );
};


        $scope.forgotPsd = function(){
          $state.go('forgotPassword');
        };

        $scope.freeAccount = function(){
          window.location = "http://free.cloud-fish.com";
		  
        };

        $scope.watchFirstVideo = function(){
          // window.location = "https://vimeo.com/146204459";
		   window.open('http://datasecurity.mycloudfish.com', '_blank');
        }

        $scope.watchSecondVideo = function(){
          // window.location = "https://vimeo.com/146204459";
		  window.open('https://vimeo.com/146204459', '_blank');
        }

        $scope.watchThirdVideo = function(){
          // window.location = "https://vimeo.com/146204459";
		   window.open('https://vimeo.com/146204459', '_blank');
        }
    };

    loginController.$inject = ['$scope','$state','$rootScope','$cookies','authService', 'utilsService'];

    angular.module('authApp').controller('loginController', loginController);

}());
