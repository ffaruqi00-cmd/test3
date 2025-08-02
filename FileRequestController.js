/**
 * Created by xshanarain.
 */

(function() {

    var fileRequestController = function($scope,$state,$rootScope,$cookies,$location,utilsService) {

        $scope.username ;
        $scope.tocken;
        $scope.fileKey;
        $scope.isFileLoad = false;

        $scope.reset = function(){
            $state.go("login");
        }

        var init = function() {
            $scope.username = $location.search().username;
            $scope.tocken = $location.search().key;
            $scope.fileKey = $location.search().fileKey;
        }

        $scope.uploadFile = function() {
            $scope.isFileLoad = true;
            var encFn = $scope.myFile.name;
            var fExt = utilsService.getExtention($scope.myFile.name);
            utilsService
                .encyprtFileObject($scope.myFile, $scope.tocken)
                .then(function (blob) {
                    var uploadFormData = new FormData();
                    uploadFormData.append("fileToUpload", blob);
                    uploadFormData.append("username", $scope.username);
                    uploadFormData.append("fileKey", $scope.fileKey);
                    uploadFormData.append("fileName", encFn);
                    var headers = {
                        'Content-Type' : 'application/octet-stream'
                    };
                    $.ajax({
                        url: 'https://mycloudfish.com/app/libs/upload.php',
                        // headers: headers,
                        type: 'POST',
                        processData: false,
                        contentType: false,
                        data: uploadFormData
                    }).complete(function ( data ) {
                        $scope.isFileLoad = false;
                        $scope.$evalAsync();
                        swal("Thanks!", "You have uploaded requested file successfully!", "success")
                    });
                });
        };

        init();

    };

    fileRequestController.$inject = ['$scope','$state','$rootScope','$cookies','$location', 'utilsService'];

    angular.module('authApp').controller('fileRequestController', fileRequestController);

}());
