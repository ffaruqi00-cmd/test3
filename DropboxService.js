/**
 *  @Author Jimmy Dave 15/03/2016
 *  Dropbox service for call the dropbox apis.
 */

(function() {

    var dropboxService = function($http, $rootScope, authService, Constants, utilsService){

        var factory = {};

        factory.downloadFileContent = function(token, fileName) {

            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileName
                    })
                }
            }).then(function (res) {
                return res.blob();
            }).then(function (data) {
                return data;
            }).catch(function(err) {
                return err;
            });

            return res;
        }

        factory.dowloadBlob = function(dropboxToken, filePath, fileName, upCloud){
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                if (xhr.status === 200) {
                    var blob = new Blob([xhr.response], {type: 'application/octet-stream'});
                    if (upCloud == 'GoogleDrive') {
                        $rootScope.$broadcast('uploadBlobToGoogleDrive', {data: blob});
                    }else if (upCloud == 'Box') {
                        $rootScope.$broadcast('uploadBlobToBoxDotNet', {data: blob});
                    }else if (upCloud == 'OneDrive') {
                        $rootScope.$broadcast('uploadBlobToOneDrive', {data: blob});
                    }
                }
                else {
                    var errorMessage = xhr.response || 'Unable to download file';
                }
            };
            xhr.open('POST', 'https://content.dropboxapi.com/2/files/download');
            xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
            xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
                path: filePath
            }));
            xhr.send();
        }

        factory.downloadFile = function(dropboxToken, fileName){
            var dfName = fileName.split('/').pop();
            console.log("-------");
            console.log(fileName);
            console.log("-------");
            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + dropboxToken,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileName
                    })
                }
            }).then(function (res) {
                console.log("---then111---");
                return res.blob();
            }).then(function (fileBlob) {
                console.log("---then222---");
                if (fileName.indexOf(".$enc") > -1) {
                    console.log("---then333---");
                    console.log(fileBlob);
                    if (fileBlob !== undefined) {
                        console.log("---then44---");
                        var fExt = utilsService.getExtention(fileName.replace('.$enc', ''));
                        console.log("---then455---"+fExt+"---"+authService.activeSession.encr_key);
                        utilsService
                            .decryptFileObject(fileBlob, authService.activeSession.encr_key, fExt)
                            .then(function (decBlob) {
                                 console.log("---then666---"+decBlob);
                                saveAs(decBlob, dfName.replace('.$enc', ''));
                                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                            });
                    }
                    console.log("---then555---");
                } else {
                    saveAs(fileBlob, dfName, true);
                    $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                }
            });
        };
		
		factory.getAIResponse = function(dropboxToken, fileName, prompt){
            var dfName = fileName.split('/').pop();
            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + dropboxToken,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileName
                    })
                }
            }).then(function (res) {
                return res.blob();
            }).then(function (fileBlob) {
				var fExt = utilsService.getExtention(fileName.replace('.$enc', ''));
                if (fileName.indexOf(".$enc") > -1) {
                    if (fileBlob !== undefined) {
                        utilsService
                            .decryptFileObject(fileBlob, authService.activeSession.encr_key, fExt)
                            .then(function (decBlob) {
								utilsService.getResponseFromAIApi(decBlob,dfName.replace('.$enc', ''),fExt,prompt);
                                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                            });
                    }
                } else {
					utilsService.getResponseFromAIApi(fileBlob,fileName,fExt,prompt);
                    $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                }
            });
        };

        factory.uploadBlobFiles = function(token, blob, fileName){
            var _path = "/";
            var headers = {
                'Authorization' : 'Bearer '+token,
                'Dropbox-API-Arg' : '{\"path\": \"'+ _path + fileName +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type' : 'application/octet-stream'
            };
            $.ajax({
                url: 'https://content.dropboxapi.com/2/files/upload',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: blob
            }).complete(function ( data ) {
                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
            });
        };

        factory.uploadRTBlobFiles = function(token, blob, fileName, _path){
            var headers = {
                'Authorization' : 'Bearer '+token,
                'Dropbox-API-Arg' : '{\"path\": \"'+ _path + fileName +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type' : 'application/octet-stream'
            };
            $.ajax({
                url: 'https://content.dropboxapi.com/2/files/upload',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: blob
            }).complete(function ( data ) {
                $rootScope.$broadcast('updateDBListView', {data: data});
            });
        };


        factory.uploadFiles = function(token, file, _path){

            if (_path != '/') {	_path = _path+"/"; }

            var headers = {
                'Authorization' : 'Bearer '+token,
                'Dropbox-API-Arg' : '{\"path\": \"'+_path + file.name+'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type' : 'application/octet-stream'
            };
            $.ajax({
                url: 'https://content.dropboxapi.com/2/files/upload',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: file
            }).complete(function ( data ) {
                $rootScope.$broadcast('updateDBListView', {
                    data: data
                });
            });
        };

        factory.uploadFilesAndFolder = function(token, fileObj, _path){

            if (_path != '/') {	_path = _path+"/"; }
            _path = _path.slice(0, -1)+fileObj.fPath+"/";
            var file = fileObj.dFile;
            var headers = {
                'Authorization' : 'Bearer '+token,
                'Dropbox-API-Arg' : '{\"path\": \"'+_path + file.name+'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type' : 'application/octet-stream'
            };
            $.ajax({
                url: 'https://content.dropboxapi.com/2/files/upload',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: file
            }).complete(function ( data ) {
                $rootScope.$broadcast('uploadedFileOfMFnF', {
                    data: data
                });
            });
        };

        factory.uploadFilesAndFolderEncrypted = function(token, fileObj, _path){
            if (_path != '/') {	_path = _path+"/"; }
            var encFn = fileObj.dFile.name+".$enc";
            utilsService
                .encyprtFileObject(fileObj.dFile, authService.activeSession.encr_key)
                .then(function (blob) {
                    var headers = {
                        'Authorization' : 'Bearer '+token,
                        'Dropbox-API-Arg' : '{\"path\": \"'+ _path + encFn +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                        'Content-Type' : 'application/octet-stream'
                    };
                    $.ajax({
                        url: 'https://content.dropboxapi.com/2/files/upload',
                        headers: headers,
                        type: 'POST',
                        processData: false,
                        contentType: false,
                        data: blob
                    }).complete(function ( data ) {
                        $rootScope.$broadcast('uploadedFileOfMFnF', {
                            data: data
                        });
                    });
                });
        };

        factory.uploadFilesEncrypted = function(token, file, _path){
            if (_path != '/') {	_path = _path+"/"; }
            var encFn = file.name+".$enc";
            console.log("------"+authService.activeSession.encr_key);
            utilsService
                .encyprtFileObject(file, authService.activeSession.encr_key)
                .then(function (blob) {
                    var headers = {
                        'Authorization' : 'Bearer '+token,
                        'Dropbox-API-Arg' : '{\"path\": \"'+ _path + file.name+".$enc" +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                        'Content-Type' : 'application/octet-stream'
                    };
                    $.ajax({
                        url: 'https://content.dropboxapi.com/2/files/upload',
                        headers: headers,
                        type: 'POST',
                        processData: false,
                        contentType: false,
                        data: blob
                    }).complete(function ( data ) {
                        $rootScope.$broadcast('updateDBListView', {
                            data: data
                        });
                    });
                });
        };

        factory.renameFiles = function(token, originalName, newName){
            var res = $http({
                method: 'POST',
                url: 'https://api.dropboxapi.com/2/files/move_v2',
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json'},
                data:'{\"from_path\": \"'+originalName +'\",\"to_path\": \"'+ newName +'\",\"allow_shared_folder\": false,\"autorename\": false,\"allow_ownership_transfer\": false}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        }

        factory.createFolder = function(token, folderName, _path){
            if (_path != '/') {	_path = _path+"/"; }
            var res = $http({
                method: 'POST',
                url: 'https://api.dropboxapi.com/2/files/create_folder_v2',
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json'},
                data:'{\"path\": \"'+ _path +folderName +'\",\"autorename\": false}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        }

        factory.deleteFile = function(token, originalName){
            var res = $http({
                method: 'POST',
                url: 'https://api.dropboxapi.com/2/files/delete_v2',
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json'},
                data:'{\"path\": \"'+ originalName +'\"}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        }

        factory.uploadAndDeleteFile = function (dropboxToken, cblob, cFName, fileId, folderId, isSync) {
            var headers = {
                'Authorization' : 'Bearer '+dropboxToken,
                'Dropbox-API-Arg' : '{\"path\": \"'+ folderId +'/'+ cFName +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type' : 'application/octet-stream'
            };
            $.ajax({
                url: 'https://content.dropboxapi.com/2/files/upload',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: cblob
            }).complete(function ( data ) {
                var res = $http({
                    method: 'POST',
                    url: 'https://api.dropboxapi.com/2/files/delete_v2',
                    headers: { 'Authorization': 'Bearer '+dropboxToken, 'Content-Type':'application/json'},
                    data:'{\"path\": \"'+ fileId +'\"}'
                }).success(function(data, status, headers, config) {
                    if(isSync) {
                        $rootScope.$broadcast('encryptDecryptSynchronizedCallback', { data: data });
                    } else {
                        $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                        $rootScope.$broadcast('updateDBListView', { data: data });
                    }
                }).error(function(error, status, header, config) {
                    return error;
                });
            });
        };

        factory.encryptDecrypt =  function (dropboxToken, fileId, folderId){
            if (folderId == "/") {
                folderId = "";
            }
            var fName = fileId.split('/').pop();
            var fExt = utilsService.getExtention(fName);
            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + dropboxToken,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileId
                    })
                }
            }).then(function (res) {
                return res.blob();
            }).then(function (data) {
                if (data !== undefined) {
                    var cFName = fName.indexOf(".$enc") === -1 ? fName.concat(".$enc") : fName.replace(".$enc", "");
                    if(fName.indexOf(".$enc") === -1) {
                        utilsService
                            .encyprtFileObject(data, authService.activeSession.encr_key)
                            .then(function (cblob) {
                                factory.uploadAndDeleteFile(dropboxToken,
                                    cblob,
                                    cFName,
                                    fileId,
                                    folderId,
                                    false);
                            })
                            .catch(function (error) {
                                $rootScope.$broadcast('showErrorAlert', {data: error});
                            });
                    } else {
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (cblob) {
                                factory.uploadAndDeleteFile(dropboxToken,
                                    cblob,
                                    cFName,
                                    fileId,
                                    folderId,
                                    false);
                            })
                            .catch(function (error) {
                                $rootScope.$broadcast('showErrorAlert', {data: error});
                            });
                    }
                }
            }).catch(function(error) {
                console.log("Error : ", error);
            });
        };

        factory.encryptDecryptSynchronized =  function (dropboxToken, fileId, folderId){
            var fName = fileId.substr(1);
            var fExt = utilsService.getExtention(fName);
            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + dropboxToken,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileId
                    })
                }
            }).then(function (res) {
                return res.blob();
            }).then(function (data) {
                if (data !== undefined) {
                    var cFName = fName.indexOf(".$enc") === -1 ? fName.concat(".$enc") : fName.replace(".$enc", "");
                    if(fName.indexOf(".$enc") === -1) {
                        utilsService
                            .encyprtFileObject(data, authService.activeSession.encr_key)
                            .then(function (cblob) {
                                factory.uploadAndDeleteFile(dropboxToken,
                                    cblob,
                                    cFName,
                                    fileId,
                                    folderId,
                                    true);
                            })
                            .catch(function (error) {
                                $rootScope.$broadcast('showErrorAlert', {data: error});
                            });
                    } else {
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (cblob) {
                                factory.uploadAndDeleteFile(dropboxToken,
                                    cblob,
                                    cFName,
                                    fileId,
                                    folderId,
                                    true);
                            })
                            .catch(function (error) {
                                $rootScope.$broadcast('showErrorAlert', {data: error});
                            });
                    }
                }
            }).catch(function(error) {
                console.log("Error : ", error);
            });
        };

        factory.shareFile = function(token, path){
            var res = $http({
                method: 'POST',
                // url: 'https://api.dropboxapi.com/2/sharing/create_shared_link',
                url: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json'},
                data:'{\"path\": \"/'+ path.substr(1) +'\",\"settings\": {\"requested_visibility\": \"public\"}}'
                // data:'{\"path\": \"/'+ path.substr(1) +'\",\"short_url\": false}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        };

        factory.getSharedLink = function (token, path) {
            var res = $http({
                method: 'POST',
                url: 'https://api.dropboxapi.com/2/sharing/list_shared_links',
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json' ,
                    'Content-Type': 'application/json'
                },
                data:'{\"path\": \"/'+ path.substr(1) +'\"}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });
            return res;
        };

        factory.getListOfSharedMembers = function(token, _cId, isDir) {
            if (isDir === false) {
                var res = $http({
                    method: 'POST',
                    url: 'https://api.dropboxapi.com/2/sharing/list_file_members',
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json' ,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        file: _cId,
                        include_inherited: true,
                        limit: 100
                    })
                }).success(function(data, status, headers, config) {
                    return data;
                }).error(function(error, status, header, config) {
                    return error;
                });
                return res;
            } else {
                var res = $http({
                    method: 'POST',
                    url: 'https://api.dropboxapi.com/2/sharing/list_folder_members',
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json' ,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        shared_folder_id: _cId,
                        actions: [],
                        limit: 100
                    })
                }).success(function(data, status, headers, config) {
                    return data;
                }).error(function(error, status, header, config) {
                    return error;
                });
                return res;
            }
        };

        factory.removeMemberFromSharedFile = function(token, _cId, email, isDir) {
            if (isDir === false) {
                var res = $http({
                    method: 'POST',
                    url: 'https://api.dropboxapi.com/2/sharing/remove_file_member_2',
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json' ,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        file: _cId,
                        member: {
                            ".tag": "email",
                            "email": email
                        }
                    })
                }).success(function(data, status, headers, config) {
                    return data;
                }).error(function(error, status, header, config) {
                    return error;
                });
                return res;
            } else {
                var res = $http({
                    method: 'POST',
                    url: 'https://api.dropboxapi.com/2/sharing/remove_folder_member',
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json' ,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        shared_folder_id: _cId,
                        member: {
                            ".tag": "email",
                            "email": email
                        },
                        leave_a_copy: false
                    })
                }).success(function(data, status, headers, config) {
                    return data;
                }).error(function(error, status, header, config) {
                    return error;
                });
                return res;
            }
        };

        factory.advanceFileShare = function(token, fileId, fileName, username, sharerEmailAddress,
                                            sharerName, shareFrom, shareTo, notifyMe, canDownload, message) {
            var _url = 'https://content.dropboxapi.com/2/files/download';
            var _token = 'Bearer ' + token;
            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileId
                    })
                }
            }).then(function (res) {
                return res.blob();
            }).then(function (fileBlob) {
                if (fileBlob !== undefined) {
                    var uploadFormData = new FormData();
                    uploadFormData.append("fileToUpload", fileBlob);
                    uploadFormData.append("token", _token);
                    uploadFormData.append("dURL", _url);
                    uploadFormData.append("fileName", fileName);
                    uploadFormData.append("filePath", fileId);
                    uploadFormData.append("cloudName", 'dropbox');
                    uploadFormData.append("userName", username);
                    uploadFormData.append("sharedUserName", sharerName);
                    uploadFormData.append("sharedEmailAddress", sharerEmailAddress);
                    uploadFormData.append("shareForm", shareFrom);
                    uploadFormData.append("shareTo", shareTo);
                    uploadFormData.append("notifyMe", notifyMe ? 1 : 0);
                    uploadFormData.append("downloadAllowed", canDownload);
                    uploadFormData.append("userMessage", message);
                    var headers = {
                        'Content-Type' : 'application/octet-stream'
                    };
                    $.ajax({
                        url: 'https://mycloudfish.com/app/libs/advanceShareWithUpload.php',
                        // headers: headers,
                        type: 'POST',
                        processData: false,
                        contentType: false,
                        data: uploadFormData
                    }).complete(function ( data ) {
                        $rootScope.$broadcast('onShareFiledDownloadedOnServer', {data: data});
                    });
                }
            });
        }

        factory.decryptAndGetShareURL =  function (dropboxToken, fileId, folderId){
            var fName = fileId.substr(1);
            var fExt = utilsService.getExtention(fName);
            fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + dropboxToken,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: fileId
                    })
                }
            }).then(function (res) {
                return res.blob();
            }).then(function (data) {
                if (data !== undefined) {
                    var cFName = fName.indexOf(".$enc") === -1 ? fName.concat(".$enc") : fName.replace(".$enc", "");
                    utilsService
                        .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                        .then(function (cblob) {
                            var headers = {
                                'Authorization' : 'Bearer '+dropboxToken,
                                'Dropbox-API-Arg' : '{\"path\": \"'+ folderId + cFName +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                                'Content-Type' : 'application/octet-stream'
                            };
                            $.ajax({
                                url: 'https://content.dropboxapi.com/2/files/upload',
                                headers: headers,
                                type: 'POST',
                                processData: false,
                                contentType: false,
                                data: cblob
                            }).complete(function ( data ) {
                                console.log("JSON.parse(data.responseText).path_display : ", JSON.parse(data.responseText).path_display);
                                var res = $http({
                                    method: 'POST',
                                    url: 'https://api.dropboxapi.com/2/sharing/create_shared_link',
                                    headers: { 'Authorization': 'Bearer '+dropboxToken, 'Content-Type':'application/json'},
                                    data:'{\"path\": \"'+JSON.parse(data.responseText).path_display +'\",\"short_url\": false}'
                                }).success(function(data, status, headers, config) {
                                    $rootScope.$broadcast('dropBoxShareViewEmailFileLink', {
                                        data: data
                                    });
                                }).error(function(error, status, header, config) {
                                    return error;
                                });
                            });
                        })
                        .catch(function (error) {
                            $rootScope.$broadcast('showErrorAlert', {data: error});
                        });
                }
            }).catch(function(error) {
                console.log("Error : ", error);
            });
        };

        factory.login = function(){
            window.location = 'https://www.dropbox.com/oauth2/authorize?client_id='
                + encodeURIComponent(Constants.dropboxKey)
                + '&response_type=token&redirect_uri=' + encodeURIComponent(Constants.REDIRECT_URL);
        };

        factory.uploadRequestedBlobFiles = function(token, blob, fileName, key){
            var _path = "/Requested Files/";
            var headers = {
                'Authorization' : 'Bearer '+token,
                'Dropbox-API-Arg' : '{\"path\": \"'+ _path + fileName+".$enc" +'\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type' : 'application/octet-stream'
            };
            console.log("RD111");
            $.ajax({
                url: 'https://content.dropboxapi.com/2/files/upload',
                headers: headers,
                type: 'POST',
                processData: false,
                contentType: false,
                data: blob
            }).complete(function ( data ) {
                console.log("RD222");
                utilsService.updateRequestedFilePushStatus(key)
                    .then(function (success) {
                        console.log("RD333");
                        toastr.success('A new file requested by you has been loaded to your Dropbox account',
                            'Plase refresh!');
                        factory.listfiles(token, '/');
                    }, function (error) {
                        console.log("RD444");
                        console.error(error);
                    })
            });
        };

        factory.downloadFileFromCloudFish = function (fileName, token, key) {
            var dFUrl = Constants.PHP_LIBS_URL + 'app/libs/downloadLocalFile.php?fileName=' + fileName;
            fetch(dFUrl).then(function (res) {
                return res.blob();
            }).then(function (blob) {
                factory.uploadRequestedBlobFiles(token, blob, fileName, key );
            }).catch(function(err) {
                return err;
            });
        };

        factory.syncRequestedFileFolder = function (token) {
            utilsService.getAllRequestFiles()
                .then(function (success) {
                    console.log("1111");
                    if (success.data) {
                        var files = JSON.parse(success.data);
                        files.filter(function (obj) {
                            return obj.req_cloud === 'Dropbox'
                        }).forEach(function (obj) {
                            factory.downloadFileFromCloudFish(obj.fileNmae, token, obj.file_key)
                                .then(function (success) {
                                    console.log(success);
                                }, function (error) {
                                    console.error(error);
                                })
                        });
                    }
                }, function (error) {
                    console.log("222");
                    console.error(error);
                });
        };

        factory.shareFolderStatus = function (token, fileId, emailAddresses, isDir) {
            var json = {
                path: fileId,
                acl_update_policy: "editors",
                force_async: false,
                member_policy: "team",
                shared_link_policy: "anyone"
            }
            var res = $http ({
                method: 'POST',
                url: 'https://api.dropboxapi.com/2/sharing/share_folder',
                data: JSON.stringify(json),
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'}
            }).success(function(data, status, headers, config) {
                factory.shareFileWithMembers(token, data.shared_folder_id, emailAddresses, true);
                return data;
            }).error(function(error, status, header, config) {
                console.log(error);
                return error;
            });
        };

        factory.shareFileWithMembers = function (token, fileId, emailAddresses, isDir) {
            var emails = emailAddresses.replace(",", ";").split(";");
            emails = emails.map(function (e) {
                if (isDir) {
                    return ({
                        "member": {
                            ".tag": "email",
                            "email": e.trim()
                        },
                        "access_level": "editor"
                    });
                } else {
                    return ({
                        ".tag": "email",
                        "email": e.trim()
                    });
                }
            });
            var f = isDir ? "shared_folder_id" : "file";
            var _id = isDir ? fileId.replace("id:", "") : fileId;
            var json = {
                [f] : _id,
                "members": emails,
                "quiet": false,
                "custom_message": "Share by Cloud-Fish.com"
            }
            if ( !isDir) {
                json.access_level = "viewer";
            }
            var _url = isDir ? "https://api.dropboxapi.com/2/sharing/add_folder_member" :
                "https://api.dropboxapi.com/2/sharing/add_file_member";
            var res = $http ({
                method: 'POST',
                url: _url,
                data: JSON.stringify(json),
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'}
            }).success(function(data, status, headers, config) {
                console.log(data);
                return data;
            }).error(function(error, status, header, config) {
                console.log(error);
                return error;
            });
        };

        factory.listfiles = function(token, path) {

            if(path.includes("/shared_folders")){
                var _url = 'https://api.dropboxapi.com/2/sharing/list_received_files';
                var res = $http ({
                    method: 'POST',
                    url: _url,
                    data: '{"limit": 100,"actions": []}',
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'}
                }).success(function(data, status, headers, config) {
                    console.log(data);
                    return data;
                }).error(function(error, status, header, config) {
                    console.log(error);
                    return error;
                });

                setTimeout(function () {
                    factory.syncRequestedFileFolder(token);
                },1000);

                return res;
            }else if (path === '/list_shared_folder_with_user') {
                var _url = 'https://api.dropboxapi.com/2/sharing/list_folders';
                var res = $http ({
                    method: 'POST',
                    url: _url,
                    data: '{"limit": 100,"actions": []}',
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'}
                }).success(function(data, status, headers, config) {
                    console.log(data);
                    data.entries = data.entries.map(function (t) {
                        return {
                            'title' : t.name,
                            'path_lower': t.path_lower ? t.path_lower : '/'+ t.name,
                            'client_modified': t.time_invited,
                            'id': t.shared_folder_id,
                            'size': 0,
                            '.tag': 'folder',
                            'preview_url': t.preview_url
                        }
                    });
                    return data;
                }).error(function(error, status, header, config) {
                    console.log(error);
                    return error;
                });
                return res;
            }else{
                if(path === '/') path = "";
                var _url =  "https://api.dropboxapi.com/2/files/list_folder";
                // : 'https://api.dropboxapi.com/1/shared_folders';

                var res = $http({
                    method: 'POST',
                    url: _url,
                    headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'},
                    data: '{"path": "'+path+'","recursive": false,"include_media_info": true,"include_deleted": false,"include_has_explicit_shared_members": true,"include_mounted_folders": true}'
                }).success(function(data, status, headers, config) {
                    return data;
                }).error(function(err, status, headers, config) {
                    return err;
                });

                setTimeout(function () {
                    factory.syncRequestedFileFolder(token);
                },1000);

                return res;
            }
        };

        return factory;
    };

    dropboxService.$inject = ['$http', '$rootScope', 'authService', 'Constants', 'utilsService'];

    angular.module('authApp').factory('dropboxService', dropboxService);

}());
