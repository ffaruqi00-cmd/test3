/**
 *  @Author Jimmy Dave 15/03/2016
 *  Dropbox service for call the dropbox apis.
 */

(function() {

    var boxService = function($http, $rootScope, authService, Constants, utilsService){

        var factory = {};
        factory.isRequestedFile = false;

        factory.downloadFileContent = function(token, fileName) {

        }

        factory.dowloadBlob = function(boxToken, fileId, fileName, upCloud){
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var res = $http({
                method: 'GET',
                url: url,
                responseType :  "blob",
                headers : { Authorization: 'Bearer '+boxToken }
            }).success(function(data, status, headers, config) {
                if (data !== undefined) {
                    if (upCloud == 'Dropbox') {
                        $rootScope.$broadcast('uploadBlobToDropBox', {data: data});
                    }else if (upCloud == 'GoogleDrive') {
                        $rootScope.$broadcast('uploadBlobToGoogleDrive', {data: data});
                    }else if (upCloud == 'OneDrive') {
                        $rootScope.$broadcast('uploadBlobToOneDrive', {data: data});
                    }
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });
        };

        factory.downloadFile = function(boxToken, fileId, fileName){
            // var fileName = file.name;
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var res = $http({
                method: 'GET',
                url: url,
                responseType :  "blob",
                headers : { Authorization: 'Bearer '+boxToken }
            }).success(function(data, status, headers, config) {
                if (data !== undefined) {
                    if (fileName.indexOf(".$enc") > -1) {
                        var fName = fileName.slice(0, -4);
                        var fExt = utilsService.getExtention(fName);
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (decBlob) {
                                saveAs(decBlob, fileName.replace('.$enc', ''));
                                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                            })
                            .catch(function (err) {
                                $rootScope.$broadcast('showErrorAlert', {data: err});
                            });
                    }else {
                        saveAs(data, fileName);
                        $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                    }
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });
        };
		
		factory.getAIResponse = function(boxToken, fileId, fileName, prompt){
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var res = $http({
                method: 'GET',
                url: url,
                responseType :  "blob",
                headers : { Authorization: 'Bearer '+boxToken }
            }).success(function(data, status, headers, config) {
                if (data !== undefined) {
                    if (fileName.indexOf(".$enc") > -1) {
                        var fName = fileName.slice(0, -4);
                        var fExt = utilsService.getExtention(fName);
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (decBlob) {
								utilsService.getResponseFromAIApi(decBlob,fName,fExt,prompt);
                                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                            })
                            .catch(function (err) {
                                $rootScope.$broadcast('showErrorAlert', {data: err});
							$rootScope.isAILoad = false;
                            });
                    }else {
						var fExt = utilsService.getExtention(fileName);
						utilsService.getResponseFromAIApi(data,fileName,fExt,prompt);
                        $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                    }
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
				$rootScope.isAILoad = false;
            });
        };

        factory.uploadBlobFiles = function(token, blob, fileName){

            var folderId = "0";

            var fd = new FormData();
            fd.append('file', blob);
            var jsonBody = '{"name":"' + fileName + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+token
            };

            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                // This prevents JQuery from trying to append the form as a querystring
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {
                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
            });
        };

        factory.uploadRTBlobFiles = function(token, blob, fileName,folderId){

            var fd = new FormData();
            fd.append('file', blob);
            var jsonBody = '{"name":"' + fileName + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+token
            };

            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                // This prevents JQuery from trying to append the form as a querystring
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {
                $rootScope.$broadcast('updateBNListView', {data: data});
            });
        };


        factory.uploadFiles = function(token, fileOBj, folderId){
            var fd = new FormData();
            fd.append('file', fileOBj);
            var jsonBody = '{"name":"' + fileOBj.name + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+token
            };

            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                // This prevents JQuery from trying to append the form as a querystring
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {
                $rootScope.$broadcast('updateBNListView', {
                    data: data
                });
            });

        };

        factory.uploadFilesAndFolder = function(token, fileOBj, folderId){
            var fd = new FormData();
            fd.append('file', fileOBj);
            var jsonBody = '{"name":"' + fileOBj.name + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+token
            };
            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {
                $rootScope.$broadcast('uploadedFileOfMFnF', {
                    data: data
                });
            });
        };

        factory.uploadFilesAndFolderEncrypted = function(token, file, folderId){
            var encFn = file.name+".$enc";
            var fExt = utilsService.getExtention(file.name, authService.activeSession.encr_key);
            utilsService
                .encyprtFileObject(file, authService.activeSession.encr_key)
                .then(function (blob) {
                    var fd = new FormData();
                    fd.append('file', blob);
                    var jsonBody = '{"name":"' + encFn + '", "parent":{"id":"'+ folderId + '"}}';
                    fd.append('attributes', jsonBody);
                    var headers = {
                        Authorization: 'Bearer '+token
                    };

                    $.ajax({
                        url: 'https://upload.box.com/api/2.0/files/content',
                        headers: headers,
                        type: 'POST',
                        // This prevents JQuery from trying to append the form as a querystring
                        processData: false,
                        contentType: false,
                        data: fd
                    }).complete(function ( data ) {
                        $rootScope.$broadcast('uploadedFileOfMFnF', {
                            data: data
                        });
                    });
                });
        };

        factory.uploadBlobAndUpdateListView  = function (token, blob, fileName, folderId) {
            var fd = new FormData();
            fd.append('file', blob);
            var jsonBody = '{"name":"' + fileName + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+token
            };

            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {
                $rootScope.$broadcast('updateBNListView', {
                    data: data
                });
            });
        };

        factory.uploadFilesEncrypted = function(token, file, folderId){
            var encFn = file.name+".$enc";
            var fExt = utilsService.getExtention(file.name);
            utilsService
                .encyprtFileObject(file, authService.activeSession.encr_key)
                .then(function (blob) {
                    factory.uploadBlobAndUpdateListView(token, blob, encFn, folderId);
                })
                .catch(function (err) {
                    $rootScope.$broadcast('showErrorAlert', {data: err.message});
                });
        };

        factory.renameFiles = function(token, newName, fileId){
            var res = $http({
                method: 'PUT',
                url: 'https://api.box.com/2.0/files/'+fileId,
                headers: { 'Authorization': 'Bearer '+token},
                data : {'name' : newName}
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        }

        factory.deleteFile = function(token, fileId, name){
            var _url = 'https://api.box.com/2.0/files/'+fileId;
            if(name.indexOf(".") == -1){
                _url = 'https://api.box.com/2.0/folders/'+fileId+'?recursive=true';
            }
            var res = $http({
                method: 'DELETE',
                url: _url,
                headers: { 'Authorization': 'Bearer '+token}
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });
            return res;
        }

        factory.createFolder = function(token, folderName, _path){
            var jsonBody = '{"name":"' + folderName + '", "parent":{"id":"'+ _path + '"}}';
            var res = $http({
                method: 'POST',
                url: 'https://api.box.com/2.0/folders',
                headers: { 'Authorization': 'Bearer '+token},
                data : jsonBody
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });
            return res;
        }

        factory.uploadBlobAndDeleteLastVersion = function (boxToken, blob, fileId, fileName, folderId, isSync) {
            var fd = new FormData();
            fd.append('file', blob);
            var jsonBody = '{"name":"' + fileName + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+boxToken
            };

            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                // This prevents JQuery from trying to append the form as a querystring
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {

                var res = $http({
                    method: 'DELETE',
                    url: 'https://api.box.com/2.0/files/'+fileId,
                    headers: { 'Authorization': 'Bearer '+boxToken}
                }).success(function(data, status, headers, config) {
                    if (isSync) {
                        $rootScope.$broadcast('encryptDecryptSynchronizedCallback', {
                            data: data
                        });
                    } else {
                        $rootScope.$broadcast('updateBNListView', {
                            data: data
                        });
                    }
                }).error(function(error, status, header, config) {
                    return error;
                });
            });
        };

        factory.encryptDecrypt =  function (boxToken, fileId, fileName, folderId){
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var res = $http({
                method: 'GET',
                url: url,
                responseType : "blob",
                headers : { Authorization: 'Bearer '+boxToken }
            }).success(function(data, status, headers, config) {
                if (data !== undefined) {
                    var fName = fileName;
                    var fExt = utilsService.getExtention(fName.replace(".$enc", ""));
                    if (fileName.indexOf(".$enc") > -1) {
                        fName = fName.replace(".$enc", "");
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteLastVersion(boxToken,
                                    blob, fileId, fName, folderId, false);
                            })
                            .catch(function (err) {
                                $rootScope.$broadcast('showErrorAlert', {data: err.message});
                            });
                    } else {
                        fName = fName + ".$enc";
                        utilsService
                            .encyprtFileObject(data, authService.activeSession.encr_key)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteLastVersion(boxToken,
                                    blob, fileId, fName, folderId, false);
                            })
                            .catch(function (err) {
                                $rootScope.$broadcast('showErrorAlert', {data: err.message});
                            });
                    }
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });
        };

        factory.decryptAndGetShareURL =  function (boxToken, fileId, fileName, folderId){
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var fName = fileName.replace(".$enc", "");
            var fExt = utilsService.getExtention(fName);
            var res = $http({
                method: 'GET',
                url: url,
                responseType : "blob",
                headers : { Authorization: 'Bearer '+boxToken }
            }).success(function(data, status, headers, config) {
                if (data !== undefined) {
                    utilsService
                        .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                        .then(function (blob) {
                            var fd = new FormData();
                            fd.append('file', blob);
                            var jsonBody = '{"name":"' + fName + '", "parent":{"id":"'+ folderId + '"}}';
                            fd.append('attributes', jsonBody);
                            var headers = {
                                Authorization: 'Bearer '+boxToken
                            };

                            $.ajax({
                                url: 'https://upload.box.com/api/2.0/files/content',
                                headers: headers,
                                type: 'POST',
                                // This prevents JQuery from trying to append the form as a querystring
                                processData: false,
                                contentType: false,
                                data: fd
                            }).complete(function ( data ) {
                                console.log(JSON.parse(data.responseText).entries[0].id);
                                var res = $http({
                                    method: 'PUT',
                                    url: 'https://api.box.com/2.0/files/'+JSON.parse(data.responseText).entries[0].id,
                                    headers: { 'Authorization': 'Bearer '+boxToken},
                                    data:'{"shared_link": {}}'
                                }).success(function(data, status, headers, config) {
                                    $rootScope.$broadcast('boxShareViewEmailFileLink', {
                                        data: data
                                    });
                                }).error(function(error, status, header, config) {
                                    return error;
                                });

                            });
                        })
                        .catch(function (err) {
                            $rootScope.$broadcast('showErrorAlert', {data: err.message});
                        });
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });
        };

        factory.encryptDecryptSynchronized =  function (boxToken, fileId, fileName, folderId){
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var fName = fileName.replace(".$enc", "");
            var fExt = utilsService.getExtention(fName);
            var res = $http({
                method: 'GET',
                url: url,
                responseType : "blob",
                headers : { Authorization: 'Bearer '+boxToken }
            }).success(function(data, status, headers, config) {
                if (data !== undefined) {

                    if (fileName.indexOf(".$enc") > -1) {
                        fName = fName.replace(".$enc", "");
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteLastVersion(boxToken,
                                    blob, fileId, fName, folderId, true);
                            })
                            .catch(function (err) {
                                $rootScope.$broadcast('showErrorAlert', {data: err.message});
                            });

                    } else {
                        fName = fName + ".$enc";
                        utilsService
                            .encyprtFileObject(data, authService.activeSession.encr_key)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteLastVersion(boxToken,
                                    blob, fileId, fName, folderId, true);
                            })
                            .catch(function (err) {
                                $rootScope.$broadcast('showErrorAlert', {data: err.message});
                            });
                    }
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });
        };

        factory.shareFile = function(token, fileId){
            var res = $http({
                method: 'PUT',
                url: 'https://api.box.com/2.0/files/'+fileId,
                headers: { 'Authorization': 'Bearer '+token},
                data:'{"shared_link": {}}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });
            return res;
        }

        factory.advanceFileShare = function(token, fileId, fileName, username, sharerEmailAddress,
                     sharerName, shareFrom, shareTo, notifyMe, canDownload, message){
            var url = 'https://api.box.com/2.0/files/'+ fileId + '/content';
            var _token = 'Bearer '+token;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/advanceShare.php",
                data: $.param({
                    token: _token,
                    dURL: url,
                    fileName: fileName,
                    filePath: fileId,
                    cloudName: 'boxnet',
                    userName: username,
                    sharedUserName: sharerName,
                    sharedEmailAddress: sharerEmailAddress,
                    shareForm: shareFrom,
                    shareTo: shareTo,
                    notifyMe: notifyMe ? 1 : 0,
                    downloadAllowed: canDownload ? 1 : 0,
                    userMessage: message
                }),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                $rootScope.$broadcast('onShareFiledDownloadedOnServer', {data: locData});
            });
        }

        factory.uploadRequestedBlobFiles = function(token, blob, fileName, folderId, key){

            var fd = new FormData();
            fd.append('file', blob);
            var jsonBody = '{"name":"' + fileName+".$enc" + '", "parent":{"id":"'+ folderId + '"}}';
            fd.append('attributes', jsonBody);
            var headers = {
                Authorization: 'Bearer '+token
            };

            $.ajax({
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: headers,
                type: 'POST',
                // This prevents JQuery from trying to append the form as a querystring
                processData: false,
                contentType: false,
                data: fd
            }).complete(function ( data ) {
                utilsService.updateRequestedFilePushStatus(key)
                    .then(function (success) {
                        toastr.success('A new file requested by you has been loaded to your Box account',
                            'Plase refresh!');
                        factory.listfiles(token, '0');
                    }, function (error) {
                        console.error(error);
                    });
            });
        };

        factory.downloadFileFromCloudFish = function (fileName, token, folderId, key) {
            var dFUrl = Constants.PHP_LIBS_URL + 'app/libs/downloadLocalFile.php?fileName=' + fileName;
            fetch(dFUrl).then(function (res) {
                return res.blob();
            }).then(function (blob) {
                factory.isRequestedFile = true;
                factory.uploadRequestedBlobFiles(token, blob,fileName, folderId, key );
            }).catch(function(err) {
                return err;
            });
        };

        factory.syncRequestedFileFolder = function (token) {
            utilsService.getAllRequestFiles()
                .then(function (success) {
                    if (success.data) {
                        var files = JSON.parse(success.data);
                        files.filter(function (obj) {
                            return obj.req_cloud === 'Box'
                        }).forEach(function (obj) {
                            factory.downloadFileFromCloudFish(obj.fileNmae, token, obj.parent_path, obj.file_key)
                                .then(function (success) {
                                    console.log(success);
                                }, function (error) {
                                    console.error(error);
                                })
                        });
                    }
                }, function (error) {
                    console.error(error);
                });
        };

        factory.login = function(){
            window.location = 'https://account.box.com/api/oauth2/authorize?response_type=code&client_id='
                + encodeURIComponent(Constants.BN_CLIENT_ID)
                + '&redirect_uri=' + encodeURIComponent(Constants.REDIRECT_URL) + "&state=security_token%eHNoYW5hcmFpbg==";
        }

        factory.listfiles = function(token, path) {

            var res = $http({
                method: 'GET',
                url: 'https://api.box.com/2.0/folders/'+path+"/items?limit=1000&offset=0",
                headers: { 'Authorization': 'Bearer '+token}
            }).success(function(data, status, headers, config) {
                setTimeout(function () {
                    factory.isRequestedFile = false;
                    factory.syncRequestedFileFolder(token);
                },1000);
                return data;
            }).error(function(err, status, headers, config) {
                factory.login();
                return err;
            });

            return res;
        }

        return factory;
    };

    boxService.$inject = ['$http', '$rootScope', 'authService', 'Constants', 'utilsService'];

    angular.module('authApp').factory('boxService', boxService);

}());
