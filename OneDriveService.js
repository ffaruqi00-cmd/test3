/**
 *  @Author Jimmy Dave 15/03/2016
 *  Dropbox service for call the dropbox apis.
 */

(function() {

    var oneDriveService = function($http, $rootScope, authService, Constants, utilsService){

        var factory = {};

        factory.downloadFileContent = function(token, fileName) {

        }

        factory.dowloadBlob = function(oneDriveToken, fileId, fileName, upCloud){
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+oneDriveToken;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {
                    var fName = fileName.replace(".$enc", "");
                    var fExt = utilsService.getExtention(fName);
                    var res = $http({
                        method: 'GET',
                        url: dFUrl,
                        responseType :  "blob"
                    }).success(function(data, status, headers, config) {
                        if (data !== undefined) {
                            if (upCloud == 'Dropbox') {
                                $rootScope.$broadcast('uploadBlobToDropBox', {data: data});
                            }else if (upCloud == 'GoogleDrive') {
                                $rootScope.$broadcast('uploadBlobToGoogleDrive', {data: data});
                            }else if (upCloud == 'Box') {
                                $rootScope.$broadcast('uploadBlobToBoxDotNet', {data: data});
                            }
                        }
                    }).error(function(error, status, header, config) {
                        console.log("Error : ", error);
                    });
                }
            }).error(function(err, status, header, config) {
                console.log("OneDrive : ", err);
            });
        }

        factory.downloadFile = function(oneDriveToken, fileId, fileName){
            // var fileName = file.name;
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+oneDriveToken;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {
                    if (fileName.indexOf(".$enc") > -1) {
                        var fName = fileName.replace(".$enc", "");
                        var fExt = utilsService.getExtention(fName);

                        var res = $http({
                            method: 'GET',
                            url: dFUrl,
                            responseType :  "blob"
                        }).success(function(data, status, headers, config) {
                            if (data !== undefined) {
                                utilsService
                                    .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                    .then(function (decBlob) {
                                        saveAs(decBlob, fName);
                                        $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                                    })
                                    .catch(function (err) {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            }
                        }).error(function(error, status, header, config) {
                            console.log("Error : ", error);
                        });

                    }else {
                        $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                        var anchor = angular.element('<a/>');
                        anchor.css({display: 'none'}); // Make sure it's not visible
                        angular.element(document.body).append(anchor); // Attach to document
                        anchor.attr({
                            href: dFUrl,
                            target: '_blank',
                            download: ''
                        })[0].click();
                        anchor.remove();
                    }
                }
            }).error(function(err, status, header, config) {
                console.log("OneDrive : ", err);
            });
        }
		
		factory.getAIResponse = function(oneDriveToken, fileId, fileName, prompt){
            // var fileName = file.name;
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+oneDriveToken;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {
                        var res = $http({
                            method: 'GET',
                            url: dFUrl,
                            responseType :  "blob"
                        }).success(function(data, status, headers, config) {
                            if (data !== undefined) {
								if (fileName.indexOf(".$enc") > -1) {
                        			var fName = fileName.replace(".$enc", "");
                        			var fExt = utilsService.getExtention(fName);
									utilsService
										.decryptFileObject(data, authService.activeSession.encr_key, fExt)
										.then(function (decBlob) {
											utilsService.getResponseFromAIApi(decBlob,fName,fExt,prompt);
										})
										.catch(function (err) {
											$rootScope.$broadcast('showErrorAlert', {data: err});
											$rootScope.isAILoad = false;
										});
								} else {
									var fExt = utilsService.getExtention(fileName);
									utilsService.getResponseFromAIApi(data,fileName,fExt,prompt);
								}
							}
                        }).error(function(error, status, header, config) {
                            console.log("Error : ", error);
							$rootScope.isAILoad = false;
                        });
                }
            }).error(function(err, status, header, config) {
                console.log("OneDrive : ", err);
				$rootScope.isAILoad = false;
            });
        }

        factory.uploadBlobFiles = function(token, blob, fileName, folderId){
            console.log("uploadBlobFiles");
            var fd = new FormData();
            fd.append('file', blob);
            var res = $http({
                method: 'PUT',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fileName + '/content', //39C7B435340CEC28!181
                headers: { 'Authorization': 'Bearer '+token},
                data: blob
            }).success(function(data, status, headers, config) {
                $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
            }).error(function(error, status, headers, config) {
                console.log("error : ", error);
            });
        };

        factory.uploadRTBlobFiles = function(token, blob, fileName, folderId){
            console.log("uploadBlobFiles");
            var fd = new FormData();
            fd.append('file', blob);
            var res = $http({
                method: 'PUT',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fileName + '/content', //39C7B435340CEC28!181
                headers: { 'Authorization': 'Bearer '+token},
                data: blob
            }).success(function(data, status, headers, config) {
                $rootScope.$broadcast('hideLoadingButton', {data: data});
            }).error(function(error, status, headers, config) {
                console.log("error : ", error);
            });
        };

        factory.uploadFiles = function(token, fileData, folderId){

            // var odFileReader = new FileReader();
            // odFileReader.addEventListener("load",function(event){
            // 	var fileBinaryData = odFileReader.result;
            // 	var res = $http({
            // 			method: 'PUT',
            // 			url: 'https://api.onedrive.com/v1.0/drive/items/' + folderId + '/children/' + fileData.name + '/content?%40name.conflictBehavior=rename',
            // 			headers: {
            // 					'Authorization': 'Bearer '+token
            // 			},
            // 			data: fileBinaryData
            // 		}).success(function(data, status, headers, config) {
            //       $rootScope.$broadcast('updateODListView', {
            //               data: data
            //       });
            // 		}).error(function(error, status, headers, config) {
            // 			console.log("error : ", error);
            // 	});
            // });
            // odFileReader.readAsBinaryString(fileData);


            var fd = new FormData();
            fd.append('file', fileData);
            var res = $http({
                method: 'PUT',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fileData.name + '/content', //39C7B435340CEC28!181
                headers: { 'Authorization': 'Bearer '+token},
                data: fd
            }).success(function(data, status, headers, config) {
                $rootScope.$broadcast('updateODListView', {
                    data: data
                });
            }).error(function(error, status, headers, config) {
                console.log("error : ", error);
            });
        };

        factory.uploadFilesAndFolder = function(token, fileData, folderId){
            var fd = new FormData();
            fd.append('file', fileData);
            var res = $http({
                method: 'PUT',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fileData.name + '/content', //39C7B435340CEC28!181
                headers: { 'Authorization': 'Bearer '+token},
                data: fd
            }).success(function(data, status, headers, config) {
                $rootScope.$broadcast('uploadedFileOfMFnF', {
                    data: data
                });
            }).error(function(error, status, headers, config) {
                console.log("error : ", error);
            });
        };

        factory.uploadFilesAndFolderEncrypted = function(token, file, folderId){
            var encFn = file.name+".$enc";
            utilsService
                .encyprtFileObject(file, authService.activeSession.encr_key)
                .then(function (blob) {
                    var fd = new FormData();
                    fd.append('file', blob);
                    var res = $http({
                        method: 'PUT',
                        url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + encFn + '/content',
                        headers: { 'Authorization': 'Bearer '+token},
                        data: blob
                    }).success(function(data, status, headers, config) {
                        $rootScope.$broadcast('uploadedFileOfMFnF', {
                            data: data
                        });
                    }).error(function(error, status, headers, config) {
                        console.log("Error : ", error);
                    });
                    return res;
                })
                .catch(function (err) {
                    $rootScope.$broadcast('showErrorAlert', {data: err});
                    console.log("pb");
                });
        }

        factory.uploadFilesEncrypted = function(token, file, folderId){
            var encFn = file.name+".$enc";
            utilsService
                .encyprtFileObject(file, authService.activeSession.encr_key)
                .then(function (blob) {
                    var fd = new FormData();
                    fd.append('file', blob);
                    var res = $http({
                        method: 'PUT',
                        url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + encFn + '/content',
                        headers: { 'Authorization': 'Bearer '+token},
                        data: blob
                    }).success(function(data, status, headers, config) {
                        $rootScope.$broadcast('updateODListView', {
                            data: data
                        });
                    }).error(function(error, status, headers, config) {
                        console.log("Error : ", error);
                         console.log("here3");
                    });
                    return res;
                })
                .catch(function (err) {
                    $rootScope.$broadcast('showErrorAlert', {data: err});
                    console.log("here2");
                });
        };

        factory.renameFiles = function(token, newName, fileId){
            var res = $http({
                method: 'PATCH',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+fileId,
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type' : 'application/json'},
                data : {'name' : newName}
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        }

        factory.deleteFile = function(token, fileId){
            var res = $http({
                method: 'DELETE',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+fileId,
                headers: { 'Authorization': 'Bearer '+token}
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });
            return res;
        }

        factory.createFolder = function(token, folderName, _path){
            if (_path == '0') {
                _url = 'https://api.onedrive.com/v1.0/drive/root/children';
            }else{
                _url = 'https://api.onedrive.com/v1.0/drive/items/'+_path +'/children';
            }
            var res = $http({
                method: 'POST',
                url: _url,
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type' : 'application/json'},
                data : {'name' : folderName, 'folder' : {} }
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });

            return res;
        }

        factory.uploadBlobAndDeleteLastVersion = function (oneDriveToken, blob, fileId, fileName, folderId, isSync) {
            var fd = new FormData();
            fd.append('file', blob);
            var res = $http({
                method: 'PUT',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fileName + '/content', //39C7B435340CEC28!181
                headers: { 'Authorization': 'Bearer '+oneDriveToken},
                data: blob
            }).success(function(data, status, headers, config) {
                var res = $http({
                    method: 'DELETE',
                    url: 'https://api.onedrive.com/v1.0/drive/items/'+fileId,
                    headers: { 'Authorization': 'Bearer '+oneDriveToken}
                }).success(function(data, status, headers, config) {
                    if (isSync) {
                        $rootScope.$broadcast('encryptDecryptSynchronizedCallback', {
                            data: data
                        });
                    } else {
                        $rootScope.$broadcast('updateODListView', {
                            data: data
                        });
                    }
                }).error(function(error, status, header, config) {

                });
            }).error(function(error, status, headers, config) {
                console.log("error : ", error);
            });
        };


        factory.encryptDecrypt =  function (oneDriveToken, fileId, fileName, folderId){
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+oneDriveToken;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {
                    var res = $http({
                        method: 'GET',
                        url: dFUrl,
                        responseType : "blob"
                    }).success(function(data, status, headers, config) {
                        if (data !== undefined) {

                            var fName = fileName.replace(".$enc", "");
                            var fExt = utilsService.getExtention(fName);

                            if (fileName.indexOf(".$enc") > -1) {
                                fName = fName.replace(".$enc", "");
                                utilsService
                                    .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteLastVersion(oneDriveToken,
                                            blob,
                                            fileId,
                                            fName,
                                            folderId,
                                            false);
                                    })
                                    .catch(function (err) {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            } else {
                                fName = fName + ".$enc";
                                utilsService
                                    .encyprtFileObject(data, authService.activeSession.encr_key)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteLastVersion(oneDriveToken,
                                            blob,
                                            fileId,
                                            fName,
                                            folderId,
                                            false);
                                    })
                                    .catch(function (err) {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            }
                        }
                    }).error(function(error, status, header, config) {
                        console.log("Error : ", error);
                    });
                }
            }).error(function(err, status, header, config) {
                console.log("OneDrive : ", err);
            });
        };

        factory.decryptAndGetShareURL =  function (oneDriveToken, fileId, fileName, folderId){
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+oneDriveToken;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {

                    var fName = fileName.replace(".$enc", "");
                    var fExt = utilsService.getExtention(fName);

                    var res = $http({
                        method: 'GET',
                        url: dFUrl,
                        responseType : "blob"
                    }).success(function(data, status, headers, config) {
                        if (data !== undefined) {
                            utilsService
                                .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                .then(function (blob) {
                                    var fd = new FormData();
                                    fd.append('file', blob);
                                    var res = $http({
                                        method: 'PUT',
                                        url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fName + '/content', //39C7B435340CEC28!181
                                        headers: { 'Authorization': 'Bearer '+oneDriveToken},
                                        data: blob
                                    }).success(function(data, status, headers, config) {
                                        var res = $http({
                                            method: 'POST',
                                            url: 'https://api.onedrive.com/v1.0/drive/items/'+data.id+'/action.createLink',
                                            headers: { 'Authorization': 'Bearer '+oneDriveToken, 'Content-Type':'application/json'},
                                            data:'{"type": "edit"}'
                                        }).success(function(data, status, headers, config) {
                                            $rootScope.$broadcast('oneDriveShareViewEmailFileLink', {data: data});
                                        }).error(function(error, status, header, config) {
                                            return error;
                                        });
                                    }).error(function(error, status, headers, config) {
                                        console.log("error : ", error);
                                    });
                                })
                                .catch(function (err) {
                                    $rootScope.$broadcast('showErrorAlert', {data: err});
                                });
                        }
                    }).error(function(error, status, header, config) {
                        console.log("Error : ", error);
                    });
                }
            }).error(function(err, status, header, config) {
                console.log("OneDrive : ", err);
            });
        };

        factory.encryptDecryptSynchronized =  function (oneDriveToken, fileId, fileName, folderId){
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+oneDriveToken;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {

                    var res = $http({
                        method: 'GET',
                        url: dFUrl,
                        responseType : "blob"
                    }).success(function(data, status, headers, config) {
                        if (data !== undefined) {

                            var fName = fileName.replace(".$enc", "");
                            var fExt = utilsService.getExtention(fName);

                            if (fileName.indexOf(".$enc") > -1) {
                                fName = fName.replace(".$enc", "");
                                utilsService
                                    .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteLastVersion(oneDriveToken,
                                            blob,
                                            fileId,
                                            fName,
                                            folderId,
                                            true);
                                    })
                                    .catch(function (err) {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            } else {
                                fName = fName + ".$enc";
                                utilsService
                                    .encyprtFileObject(data, authService.activeSession.encr_key)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteLastVersion(oneDriveToken,
                                            blob,
                                            fileId,
                                            fName,
                                            folderId,
                                            true);
                                    })
                                    .catch(function (err) {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            }
                        }
                    }).error(function(error, status, header, config) {
                        console.log("Error : ", error);
                    });
                }
            }).error(function(err, status, header, config) {
                console.log("OneDrive : ", err);
            });
        }

        factory.shareFile = function(token, fileId){
            var res = $http({
                method: 'POST',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+fileId+'/action.createLink',
                headers: { 'Authorization': 'Bearer '+token, 'Content-Type':'application/json'},
                data:'{"type": "edit"}'
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                return error;
            });
            return res;
        }

        factory.advanceFileShare = function(token, fileId, fileName, username, sharerEmailAddress,
                                            sharerName, shareFrom, shareTo, notifyMe, canDownload, message){
            var url = 'https://api.onedrive.com/v1.0/drive/items/'+ fileId + "/content";
            var _token = 'Bearer '+token;
            var res = $http ({
                method: 'POST',
                url: Constants.PHP_LIBS_URL + "app/libs/Location.php",
                data: $.param({ token: _token, dURL: url}),
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function(locData, status, header, config) {
                var dFUrl = utilsService.extractURL(locData);
                if (dFUrl && dFUrl !== undefined) {
                    var res1 = $http({
                        method: 'POST',
                        url: Constants.PHP_LIBS_URL + "app/libs/advanceShare.php",
                        data: $.param({
                            token: _token,
                            dURL: dFUrl,
                            fileName: fileName,
                            filePath: fileId,
                            cloudName: 'onedrive',
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
                    }).success(function(data, status, headers, config) {
                        console.log(data);
                        $rootScope.$broadcast('onShareFiledDownloadedOnServer', {data: data});
                    }).error(function(error, status, header, config) {
                        console.log("Error : ", error);
                    });
                }
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });;
        };

        factory.uploadRequestedBlobFiles = function(token, blob, fileName, folderId, key){
            fileName = fileName + ".$enc";
            var fd = new FormData();
            fd.append('file', blob);
            var res = $http({
                method: 'PUT',
                url: 'https://api.onedrive.com/v1.0/drive/items/'+ folderId + '/children/' + fileName + '/content', //39C7B435340CEC28!181
                headers: { 'Authorization': 'Bearer '+token},
                data: blob
            }).success(function(data, status, headers, config) {
                utilsService.updateRequestedFilePushStatus(key)
                    .then(function (success) {
                        toastr.success('A new file requested by you has been loaded to your One Drive account',
                            'Plase refresh!');
                        factory.listfiles(token, '0');
                    }, function (error) {
                        console.error(error);
                    });
            }).error(function(error, status, headers, config) {
                console.log("error : ", error);
            });
        };

        factory.downloadFileFromCloudFish = function (fileName, token, folderId, key) {
            var dFUrl = Constants.PHP_LIBS_URL + 'app/libs/downloadLocalFile.php?fileName=' + fileName;
            fetch(dFUrl).then(function (res) {
                return res.blob();
            }).then(function (blob) {
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
                            return obj.req_cloud === 'OneDrive'
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
						console.log('Constants.OD_SCOPE')
						console.log(Constants.OD_SCOPE)
            var url = "https://login.live.com/oauth20_authorize.srf"+ "?client_id=" + Constants.OD_APP_ID +
                "&scope=" + encodeURIComponent(Constants.OD_SCOPE) + "&response_type=token" +
                "&redirect_uri=" + encodeURIComponent("https://mycloudfish.com/oneDriveCallback.html");

            window.location = url;
        }

        factory.listfiles = function(token, _path) {
            if (_path == '0') {
                _url = 'https://api.onedrive.com/v1.0/drive/root/children';
            }else if(_path === 'sharedWithMe'){
                _url = 'https://api.onedrive.com/v1.0/drive/view.sharedWithMe';
            }else{
                _url = 'https://api.onedrive.com/v1.0/drive/items/'+_path +'/children';
            }
            var res = $http({
                method: 'GET',
                url: _url,
                headers: { 'Authorization': 'Bearer '+token}
            }).success(function(data, status, headers, config) {
                setTimeout(function () {
                    factory.syncRequestedFileFolder(token);
                },1000);
                return data;
            }).error(function(err, status, headers, config) {
                return err;
            });
            return res;
        }

        return factory;
    };

    oneDriveService.$inject = ['$http', '$rootScope', 'authService', 'Constants', 'utilsService'];

    angular.module('authApp').factory('oneDriveService', oneDriveService);

}());
