/**
 *  @Author Jimmy Dave 15/03/2016
 *  Dropbox controller for login, upload, download, rename operations.
 */

(function() {

    var cloudsController = function ($scope, $state, dropboxService, googleDriveService, boxService, oneDriveService, authService, utilsService, localServerService, Constants, $location, $stateParams, $cookies, $http, $timeout, $rootScope, $sce) {

        var dropboxToken = "";
        var boxDotNetToken = "";
        var oneDriveToken = "";

        var dbCFId = "";
        var odCFId = "";
        var bnCFId = "";
        var gdCFId = ""; 

    
      

        $scope.cUsername = "";
        $scope.companyID = 1;
        $scope.cDraggedFileName = "";
        $scope.isLoad = false;
        $scope.isFolderUpload = false;
        $scope.isPopUpShowCB = true;
        $scope.sharedFileName = "";
        $scope.sharedFilePath = "";
        $scope.sharedFileURL = "";
        $scope.shareFileTF = "";
        $scope.isPageLoad = true;
        $scope.isSelected = true;
        $scope.selectedArray = [];
        $scope.isFileMenuVisible = true;
        $scope.isGoogleDrive = false;
        $scope.dirBackStack = [];
        $scope.selectedCloud = "";
        $scope.curOperation = "Uploading...";
        $scope.isDBVisible = true;
        $scope.isGDVisible = true;
        $scope.isBNVisible = true;
        $scope.isODVisible = true;
        $scope.isMCDVisible = false;
        $scope.curDragFolderFiles = [];
        $scope.operationsArray = [];
        $scope.curOpFolderArray = [];
        $scope.isUploadEncrypted = false;
        $scope.googleDriveFilesArray = [];
        $scope.isShareDecrypted = true;
        $scope.curSelectedFileId = "";
        $scope.toShareEmailArrayString = "";
        $scope.isRTEmail = false;
        $scope.isPaintEmail = false;
        // Multiple file sharing variables
        $scope.multipleFileUrls = [];
        $scope.multipleShareFileNames = [];
        $scope.multipleShareProcessedCount = 0;
        $scope.multipleShareTotalCount = 0;
        $scope.isCloudSessionActive = false;
        $scope.recordingStatus = 0;
        $scope.requestedFileDirId = '';
        $scope.isEncDecInProgress = false;
        $scope.curSelectedShareFile = null;
        $scope.curSelectedShareFileId = null;
        
        // Track ongoing upload requests for cancellation
        $scope.ongoingUploadRequests = [];
        $scope.isUploadCancelled = false;

        $scope.advShareEmailAddress = '';
        $scope.advSharerName = '';
        $scope.advShareFromDtm = '';
        $scope.advShareFromTime = '';
        $scope.advShareToDtm = '';
        $scope.advShareToTime = '';
        $scope.advShareNotifyMe = false;
        $scope.advShareCanDownload = 0;
        $scope.advShareMessage = '';
        $scope.listOfSharedMembers = [];
		$scope.isGDModalShown = localStorage.getItem('isGDModalShown') === 'true'; // Check if modal was shown before

        var CLOUDS = {
            DROP_BOX : "Dropbox",
            GOOGLE_DRIVE : "GoogleDrive",
            BOX_NET : "Box",
            ONE_DRIVE : "OneDrive"
        };

        //Fetch app token from response of authentication and list fist when page loads.
        function init() {

            console.log("here in init");

            //console.log($scope.logoURL);

            authService.activeSession = utilsService.getAppAuthObject();

            $scope.cUsername = authService.activeSession.username;
            
            if($scope.cUsername== undefined)
                $scope.cUsername = $cookies.get("cUsername");
            
            $scope.companyID = authService.activeSession.company_id;

            console.log("username is "+$scope.cUsername);
            console.log(authService.activeSession);
            console.log("in cc");

            chooseLogo();

            //console.log(authService.activeSession);
            //$scope.companyID = $cookies.get("company_id");

            //console.log(authService.activeSession.company_id +"in cc");

            $scope.isPopUpShowCB = utilsService.getLocalStorage("isPopUpShow");
            var isJustLoggedIn = utilsService.isJustLoggedIn();
            if ($scope.isPopUpShowCB) {
                if (isJustLoggedIn == "true") {
                    utilsService.setJustLoggedIn();
                    $('#modalWithCarousel').modal('show');
                }
            }
            $scope.isPopUpShowCB = true;
            $scope.isDBVisible = utilsService.getLocalStorage("isDB");
            $scope.isGDVisible = utilsService.getLocalStorage("isGD");
            $scope.isBNVisible = utilsService.getLocalStorage("isBN");
            $scope.isODVisible = utilsService.getLocalStorage("isOD");
            $scope.isMCDVisible = utilsService.getLocalStorage("isMCD");
            $scope.isFileMenuVisible = utilsService.getLocalStorage("isFileMenu")
			$scope.HIPAA = utilsService.getLocalStorage("HIPAA");
			$scope.GDPR = utilsService.getLocalStorage("GDPR");
			$scope.PCI = utilsService.getLocalStorage("PCI");
			$scope.dataLeakProtection = utilsService.getLocalStorage("dataLeakProtection");
			$scope.decryptFilesWhileDownloading = utilsService.getLocalStorage("decryptFilesWhileDownloading", false);
            
            dropboxToken = utilsService.getDropBoxToken();
            boxDotNetToken = utilsService.getBoxDotNetToken();
            oneDriveToken = utilsService.getOneDriveToken();

            $scope.selectedCloud = utilsService.getSelectedCloud();
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 0) {
                    dbCFId = "/";
                    $scope.fetchAndUpdateDropBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                $scope.loginGD(true);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 0) {
                    bnCFId = "0";
                    $scope.fetchAndUpdateBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 0) {
                    odCFId = "0";
                    $scope.fetchAndUpdateOneDriveList();
                }
            }

            $scope.setupDropFile();
            $scope.setupSharePopUpTextField();
            window.setTimeout(function() { setupDrawingCanvas(); }, 5000);

			$(document).on('click', '.dropdown-toggle', function () {
				$(this).parent('.dropdown-parent').removeClass('dropup')
				var dropdown = $(this).next('.dropdown-menu'); // Find the associated dropdown menu
				var bottom = dropdown.length > 0 ? dropdown[0].getBoundingClientRect()?.bottom : 0
				var windowHeight = $(window).height();
				var spaceBelow = windowHeight - bottom + 10;

				// Check if there's enough space below
				if (spaceBelow < 0) {
				  // Not enough space below, use dropup
				  $(this).parent('.dropdown-parent').addClass('dropup');
				} else {
				  // Space is available below, remove dropup
				  $(this).parent('.dropdown-parent').removeClass('dropup');
				}
			  });
        }
		
        $scope.shareAfterDecrypt = function (event) {
            $scope.isShareDecrypted = !$scope.isShareDecrypted;
            console.log("shareAfterDecrypt", $scope.isShareDecrypted);
        };

        $scope.onShareViaEmail = function () {
			console.log("dycrypt check : ", $scope.isShareDecrypted);
            console.log("onshareviaemail", $scope.toShareEmailAddArray);
            var emails = new Array();
            $('.multiple-val-input li div').each(function() {
                emails.push($(this).html().replace(";", "").replace(",",""));
            });
            $scope.toShareEmailArrayString = emails.join();
            console.log("onshareviaemail", $scope.toShareEmailArrayString);
            $(".multiple-val-input ul").remove();
            $("#shareViaEmail").modal("hide");
            
            // Check if sharing multiple files
            if ($scope.multipleFileUrls && $scope.multipleFileUrls.length > 1) {
                console.log("Sharing multiple files via email:", $scope.multipleFileUrls.length, "files");
                $scope.sendEmailToAll(); // No URL parameter needed for multiple files
                return;
            }
            if($scope.isShareDecrypted && $scope.sharedFileName.indexOf('.$enc') > -1){
                $scope.isLoad = true;
                $scope.$evalAsync();
                if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    dropboxService.decryptAndGetShareURL(dropboxToken, $scope.curSelectedFileId, dbCFId);
                }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.decryptAndGetShareURL($scope.curSelectedFileId);
                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    boxService.decryptAndGetShareURL(boxDotNetToken, $scope.curSelectedFileId, $scope.sharedFileName, bnCFId);
                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    oneDriveService.decryptAndGetShareURL(oneDriveToken, $scope.curSelectedFileId, $scope.sharedFileName, odCFId);
                }
            }else{
                $scope.isLoad = true;
                $scope.$evalAsync();
                if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    dropboxService.shareFile(dropboxToken, $scope.curSelectedFileId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.sendEmailToAll(success.data.url);
                    },function(error){
                        $scope.isLoad = false;
                    });
                }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.shareFile($scope.curSelectedFileId);
                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    boxService.shareFile(boxDotNetToken, $scope.curSelectedFileId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.sendEmailToAll(success.data.shared_link.download_url);
                    },function(error){
                        $scope.isLoad = false;
                    });
                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    oneDriveService.shareFile(oneDriveToken, $scope.curSelectedFileId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.sendEmailToAll(success.data.link.webUrl);
                    },function(error){
                        $scope.isLoad = false;
                    });
                }
            }
            $scope.isShareDecrypted = true;
        };
//{"total_count":1,"entries":[{"type":"file","id":"153595364689","file_version":{"type":"file_version","id":"163404446289","sha1":"c4a41e19431faefdd16d33e1fc9cd6881424f18b"},"sequence_id":"0","etag":"0","sha1":"c4a41e19431faefdd16d33e1fc9cd6881424f18b","name":"AVI.png","description":"","size":16120,"path_collection":{"total_count":1,"entries":[{"type":"folder","id":"0","sequence_id":null,"etag":null,"name":"All Files"}]},"created_at":"2017-03-30T18:18:37-07:00","modified_at":"2017-03-30T18:18:37-07:00","trashed_at":null,"purged_at":null,"content_created_at":"2017-03-30T18:18:37-07:00","content_modified_at":"2017-03-30T18:18:37-07:00","created_by":{"type":"user","id":"205294013","name":"Muhammad Zeeshan","login":"zshan.arain@gmail.com"},"modified_by":{"type":"user","id":"205294013","name":"Muhammad Zeeshan","login":"zshan.arain@gmail.com"},"owned_by":{"type":"user","id":"205294013","name":"Muhammad Zeeshan","login":"zshan.arain@gmail.com"},"shared_link":null,"parent":{"type":"folder","id":"0","sequence_id":null,"etag":null,"name":"All Files"},"item_status":"active"}]}
        $scope.$on('dropBoxShareViewEmailFileLink', function(event, data) {
            $scope.isLoad = false;
            $scope.$evalAsync();
            $scope.sendEmailToAll(data.data.url);
        });
        $scope.$on('boxShareViewEmailFileLink', function(event, data) {
            $scope.isLoad = false;
            $scope.$evalAsync();
            $scope.sendEmailToAll(data.data.shared_link.download_url);
        });
		// Old Version
        $scope.$on('googleDriveShareViewEmailFileLink', function(event, data) {
            $scope.isLoad = false;
            $scope.$evalAsync();
            $scope.sendEmailToAll(data.data.selfLink);
        });
		$scope.$on('googleDriveShareFileLinkViaEmail', function(event, data) {
			$scope.isLoad = false;
			$scope.$evalAsync();
			// Use the new shareUrl and fileName from the event data
			$scope.curSelectedShareFile = data.data.fileId;
			$scope.sharedFileURL = data.data.shareUrl;
			$scope.sharedFileName = data.data.fileName;
			console.log("sharedFileURL", $scope.sharedFileURL, $scope.sharedFileName);
			$scope.sendEmailToAll($scope.sharedFileURL);
		});
		
        $scope.$on('oneDriveShareViewEmailFileLink', function(event, data) {
            $scope.isLoad = false;
            $scope.$evalAsync();
            $scope.sendEmailToAll(data.data.link.webUrl);
        });
	
		// Old version
        $scope.shareFileURLViaEmail = function () {
            console.log($scope.toShareEmailAddArray);
            $scope.toShareEmailArrayString = $scope.toShareEmailAddArray;
			$scope.sendEmailToAll($scope.sharedFileURL);
        };
		
		// new version
		$scope.shareDecryptedGoogleDriveFileViaEmail = function () {
            console.log("Emails to share with: ", $scope.toShareEmailAddArray);
            
            // Convert array to comma-separated string
            $scope.toShareEmailArrayString = $scope.toShareEmailAddArray;
        
            // Show loading indicator
            $scope.isLoad = true;
            $scope.$evalAsync();
        
            // Check if file is encrypted and needs decryption
            if ($scope.isShareDecrypted && $scope.sharedFileName.indexOf('.$enc') > -1) {
                // Handle cloud-specific decryption logic
                if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.decryptAndShareToSharedFolder($scope.curSelectedFileId); // folderId passed as dbCFId
                }
                // You can add support for other clouds (Dropbox, Box, OneDrive) here later
            } else {
                // Handle normal (non-encrypted) sharing
				$scope.isLoad = false;
                $scope.sendEmailToAll($scope.sharedFileURL);
                // Add other cloud providers similarly as needed
            }
        };

        $scope.sendEmailToAll =  function (urlToShare) {
            var subject, emailContent;
            
            // Check if sharing multiple files
            if ($scope.multipleFileUrls && $scope.multipleFileUrls.length > 1) {
                subject = $scope.multipleFileUrls.length + " files shared via VEEKRYPT";
                // Create email content with all file links
                emailContent = "Multiple files have been shared with you:\n\n";
                $scope.multipleFileUrls.forEach(function(fileObj, index) {
                    emailContent += (index + 1) + ". " + fileObj.name + "\n   " + fileObj.url + "\n\n";
                });
                console.log("Sending multiple files email", $scope.multipleFileUrls.length, "files");
                utilsService.sendEmails($scope.toShareEmailArrayString, subject, emailContent, $scope.sharedFileName);
            } else {
                // Single file sharing (existing logic)
                subject = $scope.sharedFileName + " shared via VEEKRYPT";
                console.log("Sending single file email", $scope.sharedFileName, urlToShare, $scope.curSelectedShareFile);
                utilsService.sendEmails($scope.toShareEmailArrayString, subject, urlToShare, $scope.sharedFileName);
            }
			.then(function(success) {
                console.log("Email : ", success.data);
                swal("Thanks!", "An email has been successfully sent!", "success");
            },function(error){
                console.log("Email : ", error.data);
            });
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                var isFile = $scope.curSelectedShareFile['.tag'] == 'file' ? true : false;
                if (isFile) {
                    dropboxService.shareFileWithMembers(dropboxToken,
                        $scope.curSelectedShareFile.id,
                        $scope.toShareEmailArrayString,
                        false
                    ).then(function (success) {
                        $scope.curSelectedShareFile = null;
                    }, function (error) {
                        $scope.curSelectedShareFile = null;
                        console.error(error);
                    });
                } else {

                    const _sharedFolderId = $scope.fileList.find(function (_item) {
                        return _item.path_lower === $scope.curSelectedShareFile.path_lower
                    });

                    if (_sharedFolderId !== undefined && _sharedFolderId.shared_folder_id !== undefined) {
                        dropboxService.shareFileWithMembers(dropboxToken,
                            _sharedFolderId.shared_folder_id,
                            $scope.toShareEmailArrayString,
                            true
                        ).then(function (success) {
                            $scope.curSelectedShareFile = null;
                        }, function (error) {
                            $scope.curSelectedShareFile = null;
                            console.error(error);
                        });
                    } else {
                        dropboxService.shareFolderStatus(dropboxToken,
                            $scope.curSelectedShareFile.path_lower,
                            $scope.toShareEmailArrayString,
                            true
                        ).then(function (success) {
                            $scope.curSelectedShareFile = null;
                        }, function (error) {
                            $scope.curSelectedShareFile = null;
                            console.error(error);
                        });
                    }
                }

            }

            if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                googleDriveService.shareFileAddMembers($scope.curSelectedShareFile,
                    $scope.toShareEmailArrayString);
                $scope.curSelectedShareFile = null;
            }

        }

        $scope.removeSharedMember = function (rmvBtn) {
            var cEId = rmvBtn.target.title;
            document.getElementById(cEId).remove()
            if ($scope.selectedCloud === CLOUDS.DROP_BOX) {
                var isDir = !$scope.curSelectedShareFileId.startsWith('id');
                dropboxService.removeMemberFromSharedFile(dropboxToken, $scope.curSelectedShareFileId, cEId, isDir)
                    .then(function (success) {
                        console.log(JSON.stringify(success.data));
                    }, function (error) {
                        console.error(JSON.stringify(error));
                    });
            } else if ($scope.selectedCloud === CLOUDS.GOOGLE_DRIVE) {
                googleDriveService.removeMemberFromSharedFile($scope.curSelectedShareFile, cEId);
            }
        };

        /*
         *   Setup Drap and Drop Functionality to View
         */

        $scope.traverseFileTree = function(item, path){
            path = path || "";
            if (item.isFile) {
                item.file(function(file) {
                    $scope.curDragFolderFiles.push(file);
                    // $scope.myFile = file;
                    // if ($scope.myFile.name.indexOf(".$enc") > -1) {
                    //     $scope.uploadFile();
                    // }else {
                    //     if (utilsService.getLocalStorage("isDE")) {
                    //         $scope.uploadModalEncrypted();
                    //     }else{
                    //         $scope.uploadFile();
                    //     }
                    // }
                });
            } else if (item.isDirectory) {
                var dirReader = item.createReader();
                dirReader.readEntries(function(entries) {
                    for (var i=0; i<entries.length; i++) {
                        $scope.traverseFileTree(entries[i], path + item.name + "/");
                    }
                });
            }
        };

        $scope.operationsArrayContains = function(_path){
            var found = false;
            for(var i = 0; i < $scope.operationsArray.length; i++) {
                if($scope.operationsArray[i].type == "folder"){
                    if ($scope.operationsArray[i].fPath == _path) {
                        found = true;
                        break;
                    }
                }
            }
            return found;
        };

        $scope.getFolderIdForOperationsFolder = function(_path){
            var found = "";
            for(var i = 0; i < $scope.curOpFolderArray.length; i++) {
                if ($scope.curOpFolderArray[i].fPath == _path) {
                    found = $scope.curOpFolderArray[i].fID;
                    break;
                }
            }
            return found;
        };

        $scope.setupDropFile = function(){

            document.getElementById("folderUploadInput").addEventListener("change", function(e) {
                e.preventDefault();
                $scope.operationsArray = [];
                var files = e.target.files;
                for (var i = 0, len = files.length; i < len; i++) {
                    var file = files[i];
                    var fileName = file.name;
                    var path = file.webkitRelativePath;
                    if (path.indexOf("/") > -1) {
                        var cfPath = path.replace(fileName, "");
                        if (!$scope.operationsArrayContains(cfPath)) {
                            var pPath = "";
                            while(cfPath.length > 0){
                                var cfName = cfPath.substr(0, cfPath.indexOf('/'));
                                pPath = pPath + "/"+cfName;
                                if (!$scope.operationsArrayContains(pPath)) {
                                    $scope.operationsArray.push({
                                        type : "folder",
                                        fPath : pPath,
                                        fName : cfName
                                    });
                                }
                                cfPath = cfPath.replace(cfName+"/","");
                            }
                        }

                        $scope.operationsArray.push({
                            type : "file",
                            fPath : "/" + path.replace("/"+fileName,""),
                            dFile : file
                        });
                    }else{
                        $scope.operationsArray.push({
                            type : "file",
                            fPath : "",
                            dFile : file
                        });
                    }
                }
                // for (var z = 0; z < $scope.operationsArray.length; z++){
                //     console.log( $scope.operationsArray[z].fPath);
                //     console.log( $scope.operationsArray[z].type);
                // }
            }, false);

            $('#dropUploadZone').on('dragenter',function(event){
				
                event.preventDefault();
            });
            $('#dropUploadZone').on('dragover',function(event){
                event.preventDefault();
            });
            $('#dropUploadZone').on('dragleave',function(event){
                event.preventDefault();

            });

            var target = document.getElementById("dropUploadZone");
            target.addEventListener("drop", function(event) {
                event.preventDefault();
                $scope.operationsArray = [];
                var dt = event.dataTransfer;
                if (dt == undefined){
                    dt = event.originalEvent.dataTransfer;
                }
                var dropedFiles = dt.files;
                // if (dropedFiles.length == 1){
                //     if(dropedFiles[0].name.indexOf(".lnk") > -1){
                //         if (window.chrome !== undefined) {
                //             var items = dt.items;
                //             for (var i=0; i<items.length; i++) {
                //               var item = items[i].webkitGetAsEntry();
                //               if (item) {
                //                 $scope.traverseFileTree(item);
                //               }
                //             }
                //             console.log("Foder Dir : ", $scope.curDragFolderFiles);
                //         }else {
                //             swal(
                //                 'Sorry!',
                //                 'Currently Google Chrome support folder drag and drop upload functionality.!',
                //                 'warning'
                //             )
                //         }
                //     }else{
                //         $scope.operationsArray.push({
                //             type: "file",
                //             fPath: "",
                //             dFile: dropedFiles[0]
                //         });
                //         $scope.uploadMultiFileAndFolder();
                //     }
                // }else {
                    for (var i = 0; i < dropedFiles.length; i++) {
                        $scope.operationsArray.push({
                            type: "file",
                            fPath: "",
                            dFile: dropedFiles[i]
                        });
                    }
                    $scope.isUploadEncrypted = utilsService.getLocalStorage('isDE');
                    $scope.uploadMultiFileAndFolder();

                    console.log("herew");
                // }
            }, false);

            $( "#dbTabBtn" ).droppable({
                drop: function( event, ui ) {
                    if ($scope.selectedCloud != CLOUDS.DROP_BOX) {
                        if(dropboxToken !== undefined && dropboxToken.length > 0) {
                            var msg = "Want to upload file from "+$scope.selectedCloud+" to Dropbox ?";
                            if (confirm(msg)) {
                                $scope.isLoad = true;
                                $scope.$apply();
                                var obj = ui.draggable.children('td').slice(1, 2).children();
                                var _id = obj['1'].getAttribute('cfid');
                                var _fname = obj.text();
                                $scope.cDraggedFileName = _fname;
                                if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                                    googleDriveService.dowloadBlob(_id, _fname, CLOUDS.DROP_BOX);
                                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                                    boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.DROP_BOX);
                                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                                    oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.DROP_BOX);
                                }
                            }
                        }else{
                            $scope.loginDB();
                        }
                    }
                }
            });

            $( "#gdTabBtn" ).droppable({
                drop: function( event, ui ) {
                    if ($scope.selectedCloud != CLOUDS.GOOGLE_DRIVE) {
						console.log('MS Upload test')
                        var msg = "Want to upload file from "+$scope.selectedCloud+" to Google Drive ?";
                        if (confirm(msg)) {
                            $scope.isLoad = true;
                            $scope.$apply();
                            var obj = ui.draggable.children('td').slice(1, 2).children();
                            var _id = obj['1'].getAttribute('cfid');
                            var _fname = obj.text();
                            $scope.cDraggedFileName = _fname;
                            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                                dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                                boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                                oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                            }
                        }
                    }
                }
            });

            $( "#bnTabBtn" ).droppable({
                drop: function( event, ui ) {
                    if ($scope.selectedCloud != CLOUDS.BOX_NET) {
                        if(boxDotNetToken !== undefined && boxDotNetToken.length > 0) {
                            var msg = "Want to upload file from "+$scope.selectedCloud+" to Box ?";
                            if (confirm(msg)) {
                                $scope.isLoad = true;
                                $scope.$apply();
                                var obj = ui.draggable.children('td').slice(1, 2).children();
                                var _id = obj['1'].getAttribute('cfid');
                                var _fname = obj.text();
                                $scope.cDraggedFileName = _fname;
                                if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                                    googleDriveService.dowloadBlob(_id, _fname, CLOUDS.BOX_NET);
                                }else if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                                    dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.BOX_NET);
                                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                                    oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.BOX_NET);
                                }
                            }
                        }else{
                            $scope.loginBN();
                        }
                    }
                }
            });

            $( "#odTabBtn" ).droppable({
                drop: function( event, ui ) {
                    if ($scope.selectedCloud != CLOUDS.ONE_DRIVE) {
                        if(oneDriveToken !== undefined && oneDriveToken.length > 0) {
                            var msg = "Want to upload file from "+$scope.selectedCloud+" to One Drive ?";
                            if (confirm(msg)) {
                                $scope.isLoad = true;
                                $scope.$apply();
                                var obj = ui.draggable.children('td').slice(1, 2).children();
                                var _id = obj['1'].getAttribute('cfid');
                                var _fname = obj.text();
                                $scope.cDraggedFileName = _fname;
                                if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                                    googleDriveService.dowloadBlob( _id, _fname, CLOUDS.ONE_DRIVE);
                                }else if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                                    dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.ONE_DRIVE);
                                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                                    boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.ONE_DRIVE);
                                }
                            }
                        }else{
                            $scope.loginOD();
                        }
                    }
                }
            });
        }
        
        $scope.setupSharePopUpTextField = function () {
            $('.multiple-val-input').on('click', function(){
                $(this).find('input:text').focus();
            });
            $('.multiple-val-input ul input:text').on('input propertychange', function(){
                $(this).siblings('span.input_hidden').text($(this).val());
                var inputWidth = $(this).siblings('span.input_hidden').width();
                $(this).width(inputWidth);
            });
            $('.multiple-val-input ul input:text').on('keypress', function(event){
                if(event.which == 32 || event.which == 44){
                    var toAppend = $(this).val();
                    if(toAppend!=''){
                        $('<li><a href="#">×</a><div>'+toAppend+'</div></li>').insertBefore($(this));
                        $(this).val('');
                    } else {
                        return false;
                    }
                    return false;
                };
            });
            $(document).on('click','.multiple-val-input ul li a', function(e){
                e.preventDefault();
                $(this).parents('li').remove();
            });
        };

        $scope.$on('uploadBlobToDropBox', function(event, data) {
            dropboxService.uploadBlobFiles(dropboxToken, data.data, $scope.cDraggedFileName);
        });

        $scope.$on('uploadBlobToGoogleDrive', function(event, data) {
            googleDriveService.uploadBlobFiles(data.data, $scope.cDraggedFileName);
        });

        $scope.$on('uploadBlobToBoxDotNet', function(event, data) {
            boxService.uploadBlobFiles(boxDotNetToken, data.data, $scope.cDraggedFileName);
        });

        $scope.$on('uploadBlobToOneDrive', function(event, data) {
            odCFId = utilsService.getODRootFolderID();
            oneDriveService.uploadBlobFiles(oneDriveToken, data.data, $scope.cDraggedFileName, odCFId);
        });

        $scope.onDialogCheckBoxSelectionChange = function(){
            $scope.isUploadEncrypted = !$scope.isUploadEncrypted;
            console.log($scope.isUploadEncrypted);
        };
		
		 


        $scope.uploadMultiFileAndFolder = function(){
            // Reset cancellation flag
            $scope.isUploadCancelled = false;
            $scope.isUploadEncrypted = utilsService.getLocalStorage('isDE');
            // swal({
            //   title: "Are you sure?",
            //   text: "This task will take a little bit more time to complete.",
            //   type: "warning",
            //   showCancelButton: true,
            //   confirmButtonColor: "#1E90FF",
            //   confirmButtonText: "Yes, upload it!",
            //   closeOnConfirm: true
            // },
            // function(){
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    var ffArray = [];
                    for (var i = 0; i < $scope.operationsArray.length; i++) {
                        if($scope.operationsArray[i].type == "file"){
                            ffArray.push($scope.operationsArray[i]);
                        }
                    }
                    $scope.operationsArray = ffArray;
                    var curOp = $scope.operationsArray.shift();
                    $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                    $("#uploadMFnF").modal("show");
                    $scope.$evalAsync();
                    if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                        dropboxService.uploadFilesAndFolder(dropboxToken, curOp, dbCFId);
                    }else{
                        dropboxService.uploadFilesAndFolderEncrypted(dropboxToken, curOp, dbCFId);
                    }

                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                var curOp = $scope.operationsArray.shift();
	              console.log('Upload MS', curOp.dFile);
				
                if(curOp.type == "folder"){
                    $scope.curOpFolderArray.push(curOp);
                    $scope.curOperation = "Creating Folder : "+curOp.fName;
                    $("#uploadMFnF").modal("show");
                    $scope.$evalAsync();
                    googleDriveService.createFolderWithCallback(curOp.fName, gdCFId);
                }else{
					console.log('oooo', gdCFId)
                    $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                    $("#uploadMFnF").modal("show");
                    $scope.$evalAsync();
                    if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                        googleDriveService.uploadFilesAndFolder(curOp.dFile, gdCFId);
                    }else{
                        googleDriveService.uploadFilesAndFolderEncrypted(curOp.dFile, gdCFId);
                    }
                }

                /*var ffArray = [];
                for (var i = 0; i < $scope.operationsArray.length; i++) {
                    if($scope.operationsArray[i].type == "file"){
                        ffArray.push($scope.operationsArray[i]);
                    }
                }
                $scope.operationsArray = ffArray;
                var curOp = $scope.operationsArray.shift();
                $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                $("#uploadMFnF").modal("show");
                $scope.$evalAsync();
                if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                    googleDriveService.uploadFilesAndFolder(curOp.dFile, gdCFId);
                }else{
                    googleDriveService.uploadFilesAndFolderEncrypted(curOp.dFile, gdCFId);
                }
                */
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    var curOp = $scope.operationsArray.shift();
                    if(curOp.type == "folder"){
                        $scope.curOpFolderArray.push(curOp);
                        $scope.curOperation = "Creating Folder : "+curOp.fName;
                        $("#uploadMFnF").modal("show");
                        $scope.$evalAsync();
                        boxService.createFolder(boxDotNetToken, curOp.fName, bnCFId).then(function(success) {
                            var lastOp = $scope.curOpFolderArray.pop();
                            lastOp.fID = success.data.id;
                            $scope.curOpFolderArray.push(lastOp);
                            $rootScope.$broadcast('uploadedFileOfMFnF', {
                                data: success.data
                            });
                        },function(error){
                            $scope.isLoad = false;
                        });
                    }else{
                        $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                        $("#uploadMFnF").modal("show");
                        $scope.$apply();

                        if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                            boxService.uploadFilesAndFolder(boxDotNetToken, curOp.dFile, bnCFId);
                        }else{
                            boxService.uploadFilesAndFolderEncrypted(boxDotNetToken, curOp.dFile, bnCFId);
                        }
                    }
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    var curOp = $scope.operationsArray.shift();
                    if(curOp.type == "folder"){
                        $scope.curOpFolderArray.push(curOp);
                        $scope.curOperation = "Creating Folder : "+curOp.fName;
                        $("#uploadMFnF").modal("show");
                        $scope.$evalAsync();
                        oneDriveService.createFolder(oneDriveToken, curOp.fName, odCFId).then(function(success) {
                            var lastOp = $scope.curOpFolderArray.pop();
                            lastOp.fID = success.data.id;
                            $scope.curOpFolderArray.push(lastOp);
                            $rootScope.$broadcast('uploadedFileOfMFnF', {
                                data: success.data
                            });
                        },function(error){
                            $scope.isLoad = false;
                        });
                    }else{
                        $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                        $("#uploadMFnF").modal("show");
                        $scope.$apply();
                        if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                            oneDriveService.uploadFilesAndFolder(oneDriveToken, curOp.dFile, odCFId);
                        }else{
                            oneDriveService.uploadFilesAndFolderEncrypted(oneDriveToken, curOp.dFile, odCFId);
                        }
                    }
                }
            } else {
                // No cloud selected or invalid selection
                $scope.isLoad = false;
                $rootScope.$broadcast('showErrorAlert', {data: 'Please select a cloud service before uploading files.'});
            }
            // });
        };

        $scope.$on('googleDriveCreatedFolder', function(event, data) {
            var lastOp = $scope.curOpFolderArray.pop();
            lastOp.fID = data.data.id;
            $scope.curOpFolderArray.push(lastOp);
            $rootScope.$broadcast('uploadedFileOfMFnF', {
                data: data.data
            });
        });

        $scope.$on('rtFileUploadedNowShare', function(event, data) {
            console.log("data : ", data);
			// debugger;
            if ($scope.isRTEmail == true){
                // $scope.isRTEmail = false;
                $scope.sharedFileName = data.data.title;
                $scope.curSelectedFileId = data.data.id;
                $scope.shareFile($scope.sharedFileName, $scope.curSelectedFileId);
                // $("#shareViaEmail").modal("show");
            }
			
			$scope.encryptDecrypt(data.data.id);
        });

        $scope.$on('createdRequestedFilDir', function(event, data) {
            $scope.sendRequestAFileEmail(data.data.id);
        });

        $scope.$on('uploadedFileOfMFnF', function(event, data) {
            // Check if upload was cancelled
            if ($scope.isUploadCancelled) {
                return;
            }
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                var curOp = $scope.operationsArray.shift();
                if (curOp !== undefined) {
                    $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                    $scope.$evalAsync();
                    if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                        dropboxService.uploadFilesAndFolder(dropboxToken, curOp, dbCFId);
                    }else{
                        dropboxService.uploadFilesAndFolderEncrypted(dropboxToken, curOp, dbCFId);
                    }
                }else{
                    $("#uploadMFnF").modal("hide");
                    $scope.curOpFolderArray = [];
                    $scope.fetchAndUpdateDropBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {

                var curOp = $scope.operationsArray.shift();
                if (curOp !== undefined) {
                    if(curOp.type == "folder"){

                        $scope.curOpFolderArray.push(curOp);
                        $scope.curOperation = "Creating Folder : "+curOp.fName;
                        $scope.$evalAsync();
                        var _cFPPath = curOp.fPath.substr(0, curOp.fPath.lastIndexOf('/'));
                        var curFPath = $scope.getFolderIdForOperationsFolder(_cFPPath);
                        googleDriveService.createFolderWithCallback(curOp.fName, curFPath);

                    }else{
                        if(curOp.fPath.length > 0){
                            var curFPath = $scope.getFolderIdForOperationsFolder(curOp.fPath);
                            $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                            $scope.$evalAsync();

                            if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                                googleDriveService.uploadFilesAndFolder(curOp.dFile, curFPath);
                            }else{
                                googleDriveService.uploadFilesAndFolderEncrypted(curOp.dFile, curFPath);
                            }

                        }else{
                            $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                            $scope.$evalAsync();
                            if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                                googleDriveService.uploadFilesAndFolder(curOp.dFile, gdCFId);
                            }else{
                                googleDriveService.uploadFilesAndFolderEncrypted(curOp.dFile, gdCFId);
                            }
                        }
                    }
                }else{
                    $("#uploadMFnF").modal("hide");
                    $scope.curOpFolderArray = [];
                    googleDriveService.listFiles();
                }

                /*var curOp = $scope.operationsArray.shift();
                if (curOp !== undefined) {
                    $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                    $scope.$evalAsync();
                    if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                        googleDriveService.uploadFilesAndFolder(curOp.dFile, gdCFId);
                    }else{
                        googleDriveService.uploadFilesAndFolderEncrypted(curOp.dFile, gdCFId);
                    }
                }else{
                    $("#uploadMFnF").modal("hide");
                    $scope.curOpFolderArray = [];
                    googleDriveService.listFiles();
                }*/


            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                var curOp = $scope.operationsArray.shift();
                if (curOp !== undefined) {
                    if(curOp.type == "folder"){
                        $scope.curOpFolderArray.push(curOp);
                        $scope.curOperation = "Creating Folder : "+curOp.fName;
                        $scope.$evalAsync();
                        var _cFPPath = curOp.fPath.substr(0, curOp.fPath.lastIndexOf('/'));
                        var curFPath = $scope.getFolderIdForOperationsFolder(_cFPPath);
                        boxService.createFolder(boxDotNetToken, curOp.fName, curFPath).then(function(success) {
                            var lastOp = $scope.curOpFolderArray.pop();
                            lastOp.fID = success.data.id;
                            $scope.curOpFolderArray.push(lastOp);
                            $rootScope.$broadcast('uploadedFileOfMFnF', {
                                data: success.data
                            });
                        },function(error){
                            $scope.isLoad = false;
                        });
                    }else{
                        if(curOp.fPath.length > 0){
                            var curFPath = $scope.getFolderIdForOperationsFolder(curOp.fPath);
                            $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                            $scope.$evalAsync();
                            if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                                boxService.uploadFilesAndFolder(boxDotNetToken, curOp.dFile, curFPath);
                            }else{
                                boxService.uploadFilesAndFolderEncrypted(boxDotNetToken, curOp.dFile, curFPath);
                            }
                        }else{
                            $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                            $scope.$evalAsync();
                            if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                                boxService.uploadFilesAndFolder(boxDotNetToken, curOp.dFile, bnCFId);
                            }else{
                                boxService.uploadFilesAndFolderEncrypted(boxDotNetToken, curOp.dFile, bnCFId);
                            }
                        }
                    }
                }else{
                    $("#uploadMFnF").modal("hide");
                    $scope.curOpFolderArray = [];
                    $scope.fetchAndUpdateBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                var curOp = $scope.operationsArray.shift();
                if (curOp !== undefined) {
                    if(curOp.type == "folder"){
                        $scope.curOpFolderArray.push(curOp);
                        $scope.curOperation = "Creating Folder : "+curOp.fName;
                        $scope.$evalAsync();
                        var _cFPPath = curOp.fPath.substr(0, curOp.fPath.lastIndexOf('/'));
                        var curFPath = $scope.getFolderIdForOperationsFolder(_cFPPath);
                        oneDriveService.createFolder(oneDriveToken, curOp.fName, curFPath).then(function(success) {
                            var lastOp = $scope.curOpFolderArray.pop();
                            lastOp.fID = success.data.id;
                            $scope.curOpFolderArray.push(lastOp);
                            $rootScope.$broadcast('uploadedFileOfMFnF', {
                                data: success.data
                            });
                        },function(error){
                            $scope.isLoad = false;
                        });
                    }else{
                        if(curOp.fPath.length > 0){
                            var curFPath = $scope.getFolderIdForOperationsFolder(curOp.fPath);
                            $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                            $scope.$evalAsync();
                            if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                                oneDriveService.uploadFilesAndFolder(oneDriveToken, curOp.dFile, curFPath);
                            }else{
                                oneDriveService.uploadFilesAndFolderEncrypted(oneDriveToken, curOp.dFile, curFPath);
                            }
                        }else{
                            $scope.curOperation = "Uploading file : "+curOp.dFile.name;
                            $scope.$evalAsync();
                            if (curOp.dFile.name.indexOf(".$enc") > -1 || $scope.isUploadEncrypted == false){
                                oneDriveService.uploadFilesAndFolder(oneDriveToken, curOp.dFile, odCFId);
                            }else{
                                oneDriveService.uploadFilesAndFolderEncrypted(oneDriveToken, curOp.dFile, odCFId);
                            }
                        }
                    }
                }else{
                    $("#uploadMFnF").modal("hide");
                    $scope.curOpFolderArray = [];
                    $scope.fetchAndUpdateOneDriveList();
                }
            }
        });

        $scope.closeUploadOperation = function(){
            // Set cancellation flag
            $scope.isUploadCancelled = true;
            
            // Cancel any ongoing AI requests
            if (typeof utilsService.stopAIRequest === 'function') {
                utilsService.stopAIRequest();
            }
            
            // Cancel all ongoing upload requests
            if ($rootScope.ongoingUploadRequests && $rootScope.ongoingUploadRequests.length > 0) {
                $rootScope.ongoingUploadRequests.forEach(function(request) {
                    if (request) {
                        // Handle different types of request objects
                        if (typeof request.abort === 'function') {
                            // jQuery AJAX request or XMLHttpRequest
                            request.abort();
                        } else if (typeof request.cancel === 'function') {
                            // Angular $http promise
                            request.cancel();
                        } else if (typeof request.cancelRequest === 'function') {
                            // Google API request
                            request.cancelRequest();
                        } else {
                            // For Google API requests that don't have cancelRequest method
                            // We can't directly cancel them, but we can prevent further processing
                            console.log('Google API request cannot be directly cancelled');
                        }
                    }
                });
                $rootScope.ongoingUploadRequests = [];
            }
            
            // Clear upload arrays
            $scope.operationsArray = [];
            $scope.curOpFolderArray = [];
            
            // Reset loading state
            $scope.isLoad = false;
            
            // Hide the modal
            $("#uploadMFnF").modal("hide");
            
            // Show user feedback
            swal("Upload Cancelled", "The upload operation has been cancelled.", "info");
        };


        $scope.settings = function() {
            $state.go("settings");
        };

        $scope.updatePassword = function() {
            $state.go("changePassword");
        };

        /*
         *   Logout from App and Clouds
         *   @Result : Erease Access Token of Clouds and App
         */
        $scope.logout = function() {

            $scope.fileList = [];

            var token = gapi.auth.getToken();
            if (token) {
                var accessToken = gapi.auth.getToken().access_token;
                if (accessToken) {
                    $http({
                        method: 'GET',
                        url: 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken
                    });
                }
            }
            gapi.auth.setToken(null);
            gapi.auth.signOut();

            utilsService.removeSession();

            if (authService.activeSession.audit_level > 0) {
                utilsService.postAudit("LOGOUT", "", "", "");
            }

            if(dropboxToken !== undefined && dropboxToken.length > 0) {
                window.open("https://www.dropbox.com/logout",'_blank');
            }
            $state.go("login");
        }

        $scope.cloudLogout = function (curCloud) {
            if (curCloud == 'DB'){
                if ($scope.selectedCloud == CLOUDS.DROP_BOX){
                    $scope.fileList = [];
                    $scope.$evalAsync();
                    $scope.selectedCloud = "";
                    swal(
                        'Alert!',
                        'You have logged out from Dropbox. Please click on the Dropbox tab to login again to your Dropbox account!',
                        'warning'
                    );
                }
                if(dropboxToken !== undefined && dropboxToken.length > 0) {
                    window.open("https://www.dropbox.com/logout",'_blank');
                    dropboxToken = "";
                    utilsService.removeDropBoxToken();
                }
            }else if (curCloud == 'GD'){
                if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE){
                    $scope.fileList = [];
                    $scope.googleDriveFilesArray = [];
                    $scope.$evalAsync();
                    $scope.selectedCloud = "";
                    gapi.auth.setToken(null);
                    gapi.auth.signOut();
                    swal(
                        'Alert!',
                        'You have logged out from Google Drive. Please click on the Google Drive tab to login again to your Google Drive account!',
                        'warning'
                    );
                }
                window.open("https://accounts.google.com/Logout?hl=en",'_blank');
            }else if (curCloud == 'BN'){
                if ($scope.selectedCloud == CLOUDS.BOX_NET){
                    $scope.fileList = [];
                    $scope.$evalAsync();
                    $scope.selectedCloud = "";
                    swal(
                        'Alert!',
                        'You have logged out from Box. Please click on the Box tab to login again to your Box account!',
                        'warning'
                    );
                }
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 0) {
                    window.open("https://app.box.com/login",'_blank');
                    boxDotNetToken = "";
                    utilsService.removeBoxNetToken();
                }
            }else if (curCloud == 'OD'){
                if ($scope.selectedCloud == CLOUDS.ONE_DRIVE){
                    $scope.fileList = [];
                    $scope.$evalAsync();
                    $scope.selectedCloud = "";
                    swal(
                        'Alert!',
                        'You have logged out from One Drive. Please click on the One Drive tab to login again to your One Drive account!',
                        'warning'
                    );
                }
                if(oneDriveToken !== undefined && oneDriveToken.length > 0) {
                    window.open("https://login.live.com/logout.srf?wa=wsignin1.0",'_blank');
                    oneDriveToken = "";
                    utilsService.removeOneDriveToken();
                }
            }else if (curCloud == 'CF'){
                $scope.fileList = [];
                $scope.googleDriveFilesArray = [];
                $scope.$evalAsync();
                $scope.selectedCloud = "";
                if(dropboxToken !== undefined && dropboxToken.length > 0) {
                    window.open("https://www.dropbox.com/logout",'_blank');
                }
                window.open("https://accounts.google.com/Logout?hl=en",'_blank');
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 0) {
                    window.open("https://app.box.com/login",'_blank');
                }
                if(oneDriveToken !== undefined && oneDriveToken.length > 0) {
                    window.open("https://login.live.com/logout.srf?wa=wsignin1.0",'_blank');
                }
                utilsService.removeSession();
                $state.go("login");
            }else if (curCloud == 'CFONLY'){
                utilsService.removeSession();
                $state.go("login");
            }
        }

        /*
         *   goBackDir
         *   Go back to the last folder
         *   @Result : Return list of files of parent folder
         */
        $scope.goBackDir = function() {
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                var _path = $scope.dirBackStack.pop();
                if (_path) {
                    dbCFId = _path;
                    $scope.fetchAndUpdateDropBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                var _path = $scope.dirBackStack.pop();
                if (_path) {
                    gdCFId = _path;
                    $scope.fileList = $scope.googleDriveFilesArray.filter(function (_item) {
                        if(gdCFId == "root"){
                            if(_item.parents.length > 0 &&
                                _item.parents[0].isRoot ) return true;
                        }else if(gdCFId == "sharedFolderID"){
                            if(_item.parents.length > 0 &&
                                _item.shared ) return true;
                        }else if(_item.parents.length > 0 &&
                            _item.parents[0].id == gdCFId
                            ) return true;
                        else return false;
                    }).map(function (_item) {
                        if(_item.mimeType == 'application/vnd.google-apps.folder'){
                            _item.fileIcon = "images/fileIcons/FOLDER.png";
                        }else{
                            _item.fileIcon = _item.iconLink;
                        }
                        return _item;
                    });
					
					console.log('MS RAJPURA');
					console.log($scope.fileList);
                }
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                var _path = $scope.dirBackStack.pop();
                if (_path) {
                    bnCFId = _path;
                    $scope.fetchAndUpdateBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                var _path = $scope.dirBackStack.pop();
                if (_path) {
                    odCFId = _path;
                    $scope.fetchAndUpdateOneDriveList();
                }
            }
			$scope.selectAll = false;
        }

        /*
         *   refreshDir
         *   Refresh List of files
         *   @Result : Fetch all files for current Dir
         */
        $scope.refreshDir = function() {
			if($scope.isCloudSessionActive){
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    $scope.isLoad = true;
                    $scope.fetchAndUpdateDropBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                $scope.isLoad = true;
                $scope.loginGD();
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    $scope.isLoad = true;
                    $scope.fetchAndUpdateBoxList();
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    $scope.isLoad = true;
                    $scope.fetchAndUpdateOneDriveList();
                }
            }
			}
        }
		
		$scope.openCreateNewFolderModal = function(){
			if($scope.isCloudSessionActive){
				$("#createFolderModel").modal("show");
			}
		}

        /*
         *   refreshDir
         *   Refresh List of files
         *   @Result : Fetch all files for current Dir
         */
        $scope.createFolder = function() {
            $("#createFolderModel").modal("hide");
			if(!$scope.isCloudSessionActive){
				toastr.error("Cloud not selected!");
				return;
			}
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    $scope.isLoad = true;
                    dropboxService.createFolder(dropboxToken, $scope.newFolderName, dbCFId).then(function(success) {
                        console.log('Folder Created successfully');
                        $scope.isLoad = false;
                        $scope.fetchAndUpdateDropBoxList();
                    },function(error) {
                        $scope.isLoad = false;
                    });
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                $scope.isLoad = true;
                googleDriveService.createFolder($scope.newFolderName, gdCFId);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    $scope.isLoad = true;
                    boxService.createFolder(boxDotNetToken, $scope.newFolderName, bnCFId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.fetchAndUpdateBoxList();
                    },function(error){
                        $scope.isLoad = false;
                    });
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    $scope.isLoad = true;
                    oneDriveService.createFolder(oneDriveToken, $scope.newFolderName, odCFId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.fetchAndUpdateOneDriveList();
                    },function(error){
                        $scope.isLoad = false;
                    });
                }
            }
        }

        /*
        * Page Tab buttons
        *
        * */
        $scope.onShowAllFiles = function () {
            console.log('onShowAllFiles');
            if ($scope.selectedCloud === CLOUDS.DROP_BOX) {
                dbCFId = "/";
                $scope.fetchAndUpdateDropBoxList();
            } else if ($scope.selectedCloud === CLOUDS.GOOGLE_DRIVE) {
                $scope.loginGD();
            } else if ($scope.selectedCloud === CLOUDS.BOX_NET) {
                bnCFId = "0";
                $scope.fetchAndUpdateBoxList();
            } else if ($scope.selectedCloud === CLOUDS.ONE_DRIVE) {
                odCFId = "0";
                $scope.fetchAndUpdateOneDriveList();
            }
        };

        $scope.onShowSharedWithMeFiles = function () {
            console.log('onShowSharedWithMeFiles');
            if ($scope.selectedCloud === CLOUDS.DROP_BOX) {
                var _file = {
                    "fileIcon": "images/fileIcons/FOLDER.png",
                    "thumb_exists": false,
                    "path_lower": "/shared_folders",
                    "is_dir": true,
                    "title": "Files Shared with Me",
                    "icon": "folder",
                    ".tag": "folder",
                    "read_only": false,
                    "modifier": null,
                    "bytes": 0,
                    "modified": "Mon, 21 Nov 2016 03:49:53 +0000",
                    "size": "0 bytes",
                    "root": "dropbox",
                    "revision": 428
                };
                $scope.downloadFile(_file);
            } else if ($scope.selectedCloud === CLOUDS.GOOGLE_DRIVE) {
                var _file = {
                    "kind": "drive#file",
                    "id": "sharedFolderID",
                    "title": "Files Shared with Me",
                    "mimeType": "application/vnd.google-apps.folder",
                    "fileIcon": "images/fileIcons/FOLDER.png",
                    "labels":{
                        "trashed": false,
                        "hidden" : false
                    },
                    "parents": [
                        {
                            "id": "root",
                            "isRoot": true
                        }
                    ]
                };
                $scope.downloadFile(_file);
            } else if ($scope.selectedCloud === CLOUDS.BOX_NET) {

            } else if ($scope.selectedCloud === CLOUDS.ONE_DRIVE) {
                var _file = {
                    "id": "sharedWithMe",
                    "name": "Files Shared with Me",
                    "createdDateTime": "",
                    "lastModifiedDateTime": "",
                    "size": 0,
                    "parentReference": { "driveId": "0", "id": "root", "path": "/drive/root" },
                    "folder": { },
                    "fileIcon": "images/fileIcons/FOLDER.png"
                };
                $scope.downloadFile(_file);
            }
        };

		$scope.checkIfAllSelected = function() {
			if (!$scope.fileList || $scope.fileList.length === 0) {
				$scope.selectAll = false;
				return;
			}
			$scope.selectAll = $scope.fileList.every(file => file.selected);
		};

        $scope.onShowRequestedFiles = function () {
            console.log('onShowRequestedFiles');

            if ($scope.selectedCloud === CLOUDS.DROP_BOX) { // $scope.requestedFileDirId
                $scope.downloadFile({
                    "path_lower": "/requested files",
                    "is_dir": true,
                    "title": "Files Shared with Me",
                    "icon": "folder",
                    ".tag": "folder",
                });
            } else if ($scope.selectedCloud === CLOUDS.GOOGLE_DRIVE) {
                const _items =  $scope.fileList.filter(function (_item) {
                    return (_item.title == 'Requested File Dir'
                        && _item.mimeType == 'application/vnd.google-apps.folder'
                        && _item.parents.length > 0
                        && _item.parents[0].isRoot)
                });
                if (_items.length > 0) {
                    $scope.downloadFile(_items[0]);
                }
            } else if ($scope.selectedCloud === CLOUDS.BOX_NET) {
                //Requested File Dir
                $scope.downloadFile({
                    "id": $scope.requestedFileDirId,
                    "type": 'folder'
                });
            } else if ($scope.selectedCloud === CLOUDS.ONE_DRIVE) {
                $scope.downloadFile({
                    "id": $scope.requestedFileDirId,
                    "folder": { }
                });
            }
        };

        $scope.onShowTeamFolders = function () {
            console.log('onShowTeamFolders');
            if ($scope.selectedCloud === CLOUDS.DROP_BOX) {
                $scope.downloadFile({
                    "path_lower": "/list_shared_folder_with_user",
                    "is_dir": true,
                    "title": "Share Folder With User",
                    "icon": "folder",
                    ".tag": "folder",
                });
            } else if ($scope.selectedCloud === CLOUDS.GOOGLE_DRIVE) {

            } else if ($scope.selectedCloud === CLOUDS.BOX_NET) {

            } else if ($scope.selectedCloud === CLOUDS.ONE_DRIVE) {

            }
        };

        /*
         *   Clouds Download File Method
         *   @Param  : File ID or Name to be download
         *   @Result : Download file, Decrypt if file is Encrypted
         */
        $scope.downloadFile = function(file, isFileView, $event) {
			// debugger
			if ($event) $event.preventDefault();
			console.log('download', file, isFileView);
			isFileView = typeof isFileView !== 'undefined' ? isFileView : null;
			console.log(isFileView, file);

            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if (file['.tag'] === 'folder') {
                    $scope.dirBackStack.push(dbCFId);
                    dbCFId = file.path_lower;
                    $scope.isLoad = true;
                    $scope.fetchAndUpdateDropBoxList();
                }else{
                    $scope.isLoad = true;
                    dropboxService.downloadFile(dropboxToken, file.path_lower);
                }
                if (authService.activeSession.audit_level > 1) {
                    utilsService.postAudit("Download", file.id, file.path_lower, $scope.selectedCloud);
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                //TODO: Fetch folder list
				// debugger;
                if(file.mimeType == 'application/vnd.google-apps.folder'){
                    // console.log($scope.googleDriveFilesArray);
                    $scope.dirBackStack.push(gdCFId);
                    gdCFId = file.id;

                    if (gdCFId === "sharedFolderID"){
                        $scope.fileList = $scope.googleDriveFilesArray.filter(function (_item) {
                            if(_item.shared && !_item.labels.trashed){
                                return true;
                            } else{
                                return false;
                            }
                        }).map(function (_item) {
                            if(_item.mimeType == 'application/vnd.google-apps.folder'){
                                _item.fileIcon = "images/fileIcons/FOLDER.png";
                            }else{
                                _item.fileIcon = _item.iconLink;
                            }
                            return _item;
                        });
                    }else{
                        $scope.fileList = $scope.googleDriveFilesArray.filter(function (_item) {
                            if(_item.parents.length > 0 && _item.parents[0].id == gdCFId && !_item.labels.trashed){
                                return true;
                            } else{
                                return false;
                            }
                        }).map(function (_item) {
                            if(_item.mimeType == 'application/vnd.google-apps.folder'){
                                _item.fileIcon = "images/fileIcons/FOLDER.png";
                            }else{
                                _item.fileIcon = _item.iconLink;
                            }
                            return _item;
                        });
                    }
                    $scope.$evalAsync();
                    $scope.addContextMenu();
                    $scope.addDragDownloadListener();
                }else{
console.log('isFileView------->', isFileView)
                    $scope.isLoad = true;
                    googleDriveService.downloadFile(file, isFileView,gdCFId);
                }
                if (authService.activeSession.audit_level > 1) {
                    utilsService.postAudit("Download", file.id, "", $scope.selectedCloud);
                }
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if (file.type == 'folder') {
                    $scope.dirBackStack.push(bnCFId);
                    bnCFId = file.id;
                    $scope.isLoad = true;
                    $scope.fetchAndUpdateBoxList();
                }else{
                    $scope.isLoad = true;
                    boxService.downloadFile( boxDotNetToken, file.id, file.name);
                }
                if (authService.activeSession.audit_level > 1) {
                    utilsService.postAudit("Download", file.name, file.id, $scope.selectedCloud);
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if (file.folder) {
                    $scope.dirBackStack.push(odCFId);
                    odCFId = file.id;
                    $scope.isLoad = true;
                    $scope.fetchAndUpdateOneDriveList();
                }else{
                    $scope.isLoad = true;
                    oneDriveService.downloadFile(oneDriveToken, file.id, file.name);
                }
                if (authService.activeSession.audit_level > 1) {
                    utilsService.postAudit("Download", file.name, file.id, $scope.selectedCloud);
                }
            }
			$scope.selectAll = false;
        };

        /*
         *   Clouds Upload File Method
         *   @Param  : File Object to be upload
         *   @Result : upload file and Update List View
         */
        $scope.uploadFile = function() {	
            $scope.isLoad = true;

            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    dropboxService.uploadFiles(dropboxToken, $scope.myFile, dbCFId);
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                googleDriveService.uploadFile($scope.myFile, gdCFId);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    boxService.uploadFiles(boxDotNetToken, $scope.myFile, bnCFId);
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    oneDriveService.uploadFiles(oneDriveToken, $scope.myFile, odCFId);
                }
            } else {
                // No cloud selected or invalid selection
                $scope.isLoad = false;
                $rootScope.$broadcast('showErrorAlert', {data: 'Please select a cloud service before uploading files.'});
            }
        };

        $scope.resetRTEditor = function () {
            $('#rtEditor').val("");
            $('.trix-content').val("");
        };

        $scope.callDrawingJS = function () {
            console.log("callDrawingJS");
            // callDrawing();
        };

        $scope.callAudioInit = function () {
            console.log("callAudioInit");
            $scope.recordingStatus = 0;

            window.AudioContext = window.AudioContext || window.webkitAudioContext;

            audioContext = new AudioContext();
            audioInput = null,
                realAudioInput = null,
                inputPoint = null,
                audioRecorder = null;
            rafID = null;
            analyserContext = null;
            canvasWidth = 600; canvasHeight = 300;
            recIndex = 0;

            if (!navigator.getUserMedia)
                navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (!navigator.cancelAnimationFrame)
                navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
            if (!navigator.requestAnimationFrame)
                navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

            navigator.getUserMedia(
                {
                    "audio": {
                        "mandatory": {
                            "googEchoCancellation": "false",
                            "googAutoGainControl": "false",
                            "googNoiseSuppression": "false",
                            "googHighpassFilter": "false"
                        },
                        "optional": []
                    },
                }, gotStream, function(e) {
                    alert('Error getting audio');
                    console.log(e);
                });
        };

		$scope.setNewDocumentStatus = function(heading, type){
			$scope.gdriveDocHead = heading;
			$scope.startDocFileProcess = false;
			$scope.createNewDocumentFile(type);
			window.setTimeout(function() {
				$scope.startDocFileProcess = true;
				$scope.$evalAsync();
				
			},5000);
			
		}
        $scope.onEmailRTFile = function () {
            $scope.isRTEmail = true;
            $scope.onUploadRTFile();
        }

        $scope.uploadRTFileWithName = function (ctfName) {
            var _rtContent = $('#rtEditor').val();
            $("#angularTrixModel").modal("hide");

            var blob = new Blob([_rtContent], {type: "text/html; charset=utf-8"});
            console.log($scope.selectedCloud);
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    dropboxService.uploadRTBlobFiles(dropboxToken,blob,ctfName,dbCFId);
                }else{
                    saveAs(blob, ctfName);
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                googleDriveService.uploadRTBlobFiles(blob,ctfName,gdCFId);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    boxService.uploadRTBlobFiles(boxDotNetToken,blob,ctfName,bnCFId);
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    oneDriveService.uploadRTBlobFiles(oneDriveToken,blob,ctfName,odCFId);
                }
            }else{
                saveAs(blob, ctfName);
            }
            $('#rtEditor').val("");
        };

        $scope.onSendRequestAFile = function () {
            var curFID = '/Downloads';
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                curFID = '/RequestedFileDir';
                $scope.sendRequestAFileEmail(curFID);
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
               const _items =  $scope.googleDriveFilesArray.filter(function (_item) {
                    return (_item.title == 'Requested File Dir'
                        && _item.mimeType == 'application/vnd.google-apps.folder'
                        && _item.parents.length > 0
                        && _item.parents[0].isRoot)
                });
                if (_items.length > 0) {
                    curFID = _items[0].id;
                    $scope.sendRequestAFileEmail(curFID);
                }else{
                    googleDriveService.createRequestedFileDirFolder();
                }
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if ($scope.requestedFileDirId.length === 0) {
                    boxService.createFolder(boxDotNetToken, 'Requested File Dir', '0')
                        .then(function(success) {
                            $scope.isLoad = false;
                            curFID = success.data.id;
                            $scope.requestedFileDirId = curFID;
                            $scope.sendRequestAFileEmail(curFID);
                        },function(error){
                            $scope.isLoad = false;
                        });
                } else {
                    $scope.sendRequestAFileEmail($scope.requestedFileDirId);
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if ($scope.requestedFileDirId.length === 0) {
                    oneDriveService.createFolder(oneDriveToken, 'Requested File Dir', "0")
                        .then(function(success) {
                            $scope.isLoad = false;
                            curFID = success.data.id;
                            $scope.requestedFileDirId = curFID;
                            $scope.sendRequestAFileEmail(curFID);
                        },function(error){
                            $scope.isLoad = false;
                        });
                } else {
                    $scope.sendRequestAFileEmail($scope.requestedFileDirId);
                }
            }
        };

        $scope.sendRequestAFileEmail = function (curFID) {
            $scope.isLoad = true;
            try {
                utilsService.sendFileReques($scope.cUsername,
                    authService.activeSession.encr_key,
                    $scope.reqFileName,
                    $scope.reqFileEmail,
                    $scope.reqFileBody,
                    $scope.selectedCloud,
                    curFID)
                    .then(function(success) {
                        $scope.isLoad = false;
                        $("#requestAFile").modal("hide");
                        $scope.reqFileName = '';
                        $scope.reqFileEmail = '';
                        $scope.reqFileBody = '';
                    },function(error){
                        $scope.isLoad = false;
                        $("#requestAFile").modal("hide");
                        $scope.reqFileName = '';
                        $scope.reqFileEmail = '';
                        $scope.reqFileBody = '';
                    });
            }catch (err) {
                console.log(err);
            }
        };
		
		/*Create new document file on google drive*/
		$scope.createNewDocumentFile = function(type){
			// debugger
			var filename = prompt("Enter file name value");
			if (!filename || filename === "") {
				toastr.error("Invalid file name..!");
				return false
			}
			
			
			if(type == "docx")
			{
				
				//googleDriveService.createAndOpenFile(filename+".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
				
				googleDriveService.createAndOpenFile(filename+".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
				  .then(function (file) {
									// debugger
					$scope.encryptDecrypt(file.id);
					console.log("File created with ID:", file.id);
				  })
				  .catch(function (err) {
					console.error("File creation failed:", err);
				  });
			}
			else if(type == "xlsx")
			{
				
				googleDriveService.createAndOpenFile(filename+".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
				  .then(function (file) {
									// debugger
					$scope.encryptDecrypt(file.id);
					console.log("File created with ID:", file.id);
				  })
				  .catch(function (err) {
					console.error("File creation failed:", err);
				  });
			}
			else
			{
				
				googleDriveService.createAndOpenFile(filename+".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
				  .then(function (file) {
									// debugger
					$scope.encryptDecrypt(file.id);
					console.log("File created with ID:", file.id);
				  })
				  .catch(function (err) {
					console.error("File creation failed:", err);
				  });
			}
			
			//googleDriveService.createGoogleDoc(filename, mimeType);
			$scope.startDocFileProcess = false;
		}
		/******************************************/
		


        $scope.onUploadRTFile = function () {
            var _text =  $scope.selectedCloud == CLOUDS.DROP_BOX ? '/Dropbox' :
                $scope.selectedCloud == CLOUDS.GOOGLE_DRIVE ? ' /Google Drive' :
                    $scope.selectedCloud == CLOUDS.ONE_DRIVE ? '/One Drive' :
                        $scope.selectedCloud == CLOUDS.BOX_NET ? '/Box' : '/Local Computer/Downloads';

            if ( $scope.isRTEmail == true ){
                var ctfName = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                ctfName = ctfName+'.html';
                $scope.sharedFilePath = ctfName;
                $scope.uploadRTFileWithName(ctfName);
            }else{

                var filename = prompt("Enter file name value");
                if (filename === "") {
                    swal.showInputError("Invalid file name..!");
                    return false
                }
                if(filename.indexOf(".html") == -1){
                    var ctfName =  filename+'.html';
                    $scope.sharedFilePath =  ctfName;
                    $scope.uploadRTFileWithName(ctfName);
                }else{
                    var ctfName =  filename;
                    $scope.sharedFilePath =  ctfName;
                    $scope.uploadRTFileWithName(ctfName);
                }

                /*swal({
                        title: "Save as",
                        text: 'Path : '+_text,
                        type: "input",
                        showCancelButton: true,
                        closeOnConfirm: true,
                        inputPlaceholder: "Untitled.html"
                },
                function(filename){
                    if (filename === false) return false;

                    if (filename === "") {
                        swal.showInputError("File Name Please!");
                        return false
                    }
                    if(filename.indexOf(".html") == -1){
                        var ctfName =  filename+'.html';
                        $scope.sharedFilePath =  ctfName;
                        $scope.uploadRTFileWithName(ctfName);
                    }else{
                        var ctfName =  filename;
                        $scope.sharedFilePath =  ctfName;
                        $scope.uploadRTFileWithName(ctfName);
                    }

                });*/

            }
        };

        $scope.onEmailPaintFile = function () {
            $scope.isRTEmail = true;
            $scope.onUploadPaintFile();
        };

        $scope.onUploadPaintFile = function () {
            var _text =  $scope.selectedCloud == CLOUDS.DROP_BOX ? '/Dropbox' :
                $scope.selectedCloud == CLOUDS.GOOGLE_DRIVE ? ' /Google Drive' :
                    $scope.selectedCloud == CLOUDS.ONE_DRIVE ? '/One Drive' :
                        $scope.selectedCloud == CLOUDS.BOX_NET ? '/Box' : '/Local Computer/Downloads';

            if ( $scope.isRTEmail == true ){
                var ctfName = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                ctfName = ctfName+'.jpeg';
                $scope.sharedFilePath = ctfName;
                $scope.uploadPaintFileWithName(ctfName);
            }else {

                var filename = prompt("Enter file name value");
                if (filename === "") {
                    swal.showInputError("Invalid file name..!");
                    return false
                }
                if (filename.indexOf(".jpeg") == -1) {
                    var ctfName = filename + '.jpeg';
                    $scope.sharedFilePath = ctfName;
                    $scope.uploadPaintFileWithName(ctfName);
                } else {
                    var ctfName = filename;
                    $scope.sharedFilePath = ctfName;
                    $scope.uploadPaintFileWithName(ctfName);
                }
            }
        };

        $scope.uploadPaintFileWithName = function (ctfName) { //drawingPanel
            var canvas = document.getElementById("canvas");
            canvas.toBlob(function(blob){
                $("#drawingPanel").modal("hide");
                if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    if(dropboxToken !== undefined && dropboxToken.length > 10) {
                        dropboxService.uploadRTBlobFiles(dropboxToken,blob,ctfName,dbCFId);
                    }else{
                        saveAs(blob, ctfName);
                    }
                }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.uploadRTBlobFiles(blob,ctfName,gdCFId);
                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                        boxService.uploadRTBlobFiles(boxDotNetToken,blob,ctfName,bnCFId);
                    }
                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                        oneDriveService.uploadRTBlobFiles(oneDriveToken,blob,ctfName,odCFId);
                    }
                }else{
                    saveAs(blob, ctfName);
                }
            }, 'image/jpeg', 0.95);
        };

        $scope.onEmailVoiceMemoFile = function () {
            $scope.isRTEmail = true;
            audioRecorder.exportWAV( doneEncoding );
        };

        $scope.onUploadVoiceMemoFile = function () {
            audioRecorder.exportWAV( doneEncoding );
        };

        function doneEncoding( blob ) {
             $scope.uploadVoiceMemoFileWithName(blob);
        }

        $scope.uploadVoiceMemoFileWithName = function (memoBlob) { //drawingPanel
            var _text =  $scope.selectedCloud == CLOUDS.DROP_BOX ? '/Dropbox' :
                $scope.selectedCloud == CLOUDS.GOOGLE_DRIVE ? ' /Google Drive' :
                    $scope.selectedCloud == CLOUDS.ONE_DRIVE ? '/One Drive' :
                        $scope.selectedCloud == CLOUDS.BOX_NET ? '/Box' : '/Local Computer/Downloads';

            if ( $scope.isRTEmail == true ){
                var ctfName = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                ctfName = "Memo-"+ctfName+'.wav';
                $scope.sharedFilePath = ctfName;
            }else {

                var filename = prompt("Enter file name value");
                if (filename === "") {
                    swal.showInputError("Invalid file name..!");
                    return false
                }
                if (filename.indexOf(".wav") == -1) {
                    var ctfName = filename + '.wav';
                    $scope.sharedFilePath = ctfName;
                } else {
                    var ctfName = filename;
                    $scope.sharedFilePath = ctfName;
                }
            }
            $("#AudiPanelMoel").modal("hide");
            $scope.isLoad = true;
            $scope.$evalAsync();
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    dropboxService.uploadRTBlobFiles(dropboxToken,memoBlob,ctfName,dbCFId);
                }else{
                    saveAs(memoBlob, ctfName);
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                googleDriveService.uploadRTBlobFiles(memoBlob,ctfName,gdCFId);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    boxService.uploadRTBlobFiles(boxDotNetToken,memoBlob,ctfName,bnCFId);
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    oneDriveService.uploadRTBlobFiles(oneDriveToken,memoBlob,ctfName,odCFId);
                }
            }else{
                saveAs( memoBlob, ctfName );
            }
        };

        /*
         *   Clouds Upload Folder Method
         *   @Param  : File Object to be upload
         *   @Result : upload file and Update List View
         */
        $scope.uploadFolder = function() {
            $("#uploadFolderModal").modal("hide");
            $scope.uploadMultiFileAndFolder();
        };

        /*
         *   Clouds Upload Encrypted File Method
         *   @Param  : File Object to be upload
         *   @Result : upload file and Update List View
         */
        $scope.uploadModalEncrypted = function() {
            if(!$scope.selectedCloud) {
                // No cloud selected or invalid selection
                $scope.isLoad = false;
                $rootScope.$broadcast('showErrorAlert', {data: 'Please select a cloud service before uploading files.'});
            }
            if ($scope.isUploadEncrypted == true ){
                $scope.isLoad = true;

                if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    if(dropboxToken !== undefined && dropboxToken.length > 10) {
                        dropboxService.uploadFilesEncrypted(dropboxToken, $scope.myFile, dbCFId);
                    }
                }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.uploadFileEncrypted($scope.myFile, gdCFId);
                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                        boxService.uploadFilesEncrypted(boxDotNetToken, $scope.myFile, bnCFId);
                    }
                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                        oneDriveService.uploadFilesEncrypted(oneDriveToken, $scope.myFile, odCFId);
                    }
                } else {
                    // No cloud selected or invalid selection
                    $scope.isLoad = false;
                    $rootScope.$broadcast('showErrorAlert', {data: 'Please select a cloud service before uploading files.'});
                }
            }else{
                $scope.uploadFile();
            }
        }

        //set original file name when bootstrap modal of rename file opens.
        $scope.setFileName = function(fileName, fileId) {

            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                $scope.fileId = fileId;
                $scope.originalFileName = fileName;
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                $scope.fileId = fileId;
                $scope.originalFileName = fileName;
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                $scope.fileId = fileId;
                $scope.originalFileName = fileName;
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                $scope.fileId = fileId;
                $scope.originalFileName =  fileName;
            }
            $scope.newName = $scope.originalFileName;
            $scope.$apply();
        }

        /*
         *   Clouds Rename File Method
         *   @Param  : File or File ID of Cloud file
         *   @Param  : Updated File Name
         *   @Result : Rename file and Update List View
         */
        $scope.renameFile = function() {
            $scope.isLoad = true;

            var _ext = $scope.originalFileName.split('.').pop();
            if ($scope.newName.indexOf(_ext, $scope.newName.length - _ext.length) == -1) {
                $scope.newName = $scope.newName + "." + _ext;
            }

            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                var newPath =  $scope.fileId.replace($scope.originalFileName, $scope.newName);
                dropboxService.renameFiles(dropboxToken, $scope.fileId, newPath).then(function(success) {
                    $scope.isLoad = false;
                    $("#myModal").modal("hide");
                    $scope.fetchAndUpdateDropBoxList();
                },function(error){
                    $scope.isLoad = false;
                });
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                // var re = /(?:\.([^.]+))?$/;
                // $scope.fileExtention = re.exec($scope.originalFileName)[1];
                googleDriveService.renameFiles($scope.fileId, $scope.newName, _ext);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                boxService.renameFiles(boxDotNetToken, $scope.newName, $scope.fileId).then(function(success) {
                    $scope.isLoad = false;
                    $("#myModal").modal("hide");
                    $scope.fetchAndUpdateBoxList();
                },function(error){
                    $scope.isLoad = false;
                });
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                oneDriveService.renameFiles(oneDriveToken, $scope.newName, $scope.fileId).then(function(success) {
                    $scope.isLoad = false;
                    $("#myModal").modal("hide");
                    $scope.fetchAndUpdateOneDriveList();
                },function(error){
                    $scope.isLoad = false;
                });
            }
        }

        /*
         *   Clouds Delete File Method
         *  @Param  : File or File ID of Cloud file
         *  @Result : Delete file and Update List View
         */
        $scope.deleteFile = function(fileId, fileName){
            $scope.isLoad = true;

            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            if (i == ($scope.selectedArray.length-1)) {
                                dropboxService.deleteFile(dropboxToken, _cfile.path_lower).then(function(success) {
                                    $scope.isLoad = false;
                                    $scope.fetchAndUpdateDropBoxList();
                                },function(error){
                                    $scope.isLoad = false;
                                });
                            }else {
                                dropboxService.deleteFile(dropboxToken, _cfile.path_lower);
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    dropboxService.deleteFile(dropboxToken, fileId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.fetchAndUpdateDropBoxList();
                    },function(error){
                        $scope.isLoad = false;
                    });
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            if (i == ($scope.selectedArray.length-1)) {
                                googleDriveService.deleteFile(_cfile.id, true);
                            }else {
                                googleDriveService.deleteFile(_cfile.id, false);
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    googleDriveService.deleteFile(fileId, true);
                }
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            if (i == ($scope.selectedArray.length-1)) {
                                boxService.deleteFile(boxDotNetToken, _cfile.id, _cfile.name).then(function(success) {
                                    $scope.isLoad = false;
                                    $scope.fetchAndUpdateBoxList();
                                },function(error){
                                    $scope.isLoad = false;
                                });
                            }else {
                                boxService.deleteFile(boxDotNetToken, _cfile.id, _cfile.name);
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    boxService.deleteFile(boxDotNetToken, fileId, fileName).then(function(success) {
                        $scope.isLoad = false;
                        $scope.fetchAndUpdateBoxList();
                    },function(error){
                        $scope.isLoad = false;
                    });
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            if (i == ($scope.selectedArray.length-1)) {
                                oneDriveService.deleteFile(oneDriveToken, _cfile.id).then(function(success) {
                                    $scope.isLoad = false;
                                    $scope.fetchAndUpdateOneDriveList();
                                },function(error){
                                    $scope.isLoad = false;
                                });
                            }else {
                                oneDriveService.deleteFile(oneDriveToken, _cfile.id)
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    oneDriveService.deleteFile(oneDriveToken, fileId).then(function(success) {
                        $scope.isLoad = false;
                        $scope.fetchAndUpdateOneDriveList();
                    },function(error){
                        $scope.isLoad = false;
                    });
                }
            }
            if (authService.activeSession.audit_level > 1) {
                utilsService.postAudit("Delete", fileName, fileId, $scope.selectedCloud);
            }
        };

        /*
         *   Clouds Share File Method
         *  @Param  : File or File ID of Cloud file
         *  @Param  : file name of Cloud file
         *  @Result : Share file to given email or generate share URL
         */
        $scope.shareFile = function(fileId, fileName){
            // Check if multiple files are selected
            if ($scope.isSelected == false && $scope.selectedArray && $scope.selectedArray.length > 0) {
                // Handle multiple file sharing
                $scope.shareMultipleFiles();
                return;
            }
            
            // Handle single file sharing (existing logic)
            $scope.sharedFileName = fileName;
            $scope.curSelectedFileId = fileId;
            $scope.isLoad = true;
            $scope.$evalAsync();
            $scope.listOfSharedMembers = [];
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {

                $scope.curSelectedShareFile = $scope.fileList.find(function (v) {
                    return  v.path_lower == fileId;
                });
                $scope.sharedFilePath = "/Dropbox/"+fileName;
                dropboxService.shareFile(dropboxToken, fileId).then(function(success) {
                    $scope.isLoad = false;
                    $scope.openEmailClient(success.data.url);
                },function(error){
                    dropboxService.getSharedLink(dropboxToken, fileId).then(function (success) {
                        $scope.isLoad = false;
                        var _cId = success.data.links[0]['.tag'] === 'file' ?
                            success.data.links[0].id : $scope.curSelectedShareFile.shared_folder_id;
                        $scope.curSelectedShareFileId = _cId;
                        dropboxService.getListOfSharedMembers(dropboxToken, _cId, success.data.links[0]['.tag'] !== 'file').then(
                            function (success) {
                                success.data.users.forEach(function (e) {
                                    $scope.listOfSharedMembers.push({
                                        display_name: e.user.display_name,
                                        email: e.user.email
                                    });
                                });
                                success.data.invitees.forEach(function (e) {
                                    $scope.listOfSharedMembers.push({
                                        display_name: e.invitee.email,
                                        email: e.invitee.email
                                    });
                                });
                                $scope.$evalAsync();
                            }, function (error) {
                                console.error(JSON.stringify(error));
                            }
                        );
                        $scope.openEmailClient(success.data.links[0].url);
                    }, function (error) {
                        $scope.isLoad = false;
                        swal("Sorry!", error.data.error_summary, "error");
                    });
                });
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                $scope.sharedFilePath = "/Google Drive/"+fileName;
                googleDriveService.shareFile(fileId);
                $scope.curSelectedShareFile = fileId;
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                $scope.sharedFilePath = "/Box/"+fileName;
                boxService.shareFile(boxDotNetToken, fileId).then(function(success) {
                    $scope.isLoad = false;
                    $scope.openEmailClient(success.data.shared_link.download_url);
                },function(error){
                    $scope.isLoad = false;
                });
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                $scope.sharedFilePath = "/One Drive/"+fileName;
                oneDriveService.shareFile(oneDriveToken, fileId).then(function(success) {
                    $scope.isLoad = false;
                    $scope.openEmailClient(success.data.link.webUrl);
                },function(error){
                    $scope.isLoad = false;
                });
            }
            if (authService.activeSession.audit_level > 1) {
                utilsService.postAudit("Share File", fileName, fileId, $scope.selectedCloud);
            }
        };

        /*
         *   Clouds Share File Method
         *  @Param  : File or File ID of Cloud file
         *  @Param  : file name of Cloud file
         *  @Result : Share file to given email or generate share URL
         */
        $scope.openAdvanceShareDialog = function(fileId, fileName) {
            $scope.sharedFileName = fileName;
            $scope.sharedFilePath = fileId;
            $scope.advShareEmailAddress = "";
            $scope.advSharerName = "";
            $scope.advShareMessage = "";
            $scope.advShareCanDownload = 1;
            var _date = new Date();
            var _from = utilsService.formatDateTime(_date.toISOString()).split(' ');
            $scope.advShareFromDtm = _from[0];
            $scope.advShareToDtm = _from[0];
            $scope.advShareFromTime = _from[1] + ' ' + _from[2].toUpperCase();
            $scope.advShareToTime = _from[1] + ' ' + _from[2].toUpperCase();
            $scope.$evalAsync();
        };

        $scope.advanceShareFile = function(){
            $("#advanceShareModel").modal("hide");
            $scope.isLoad = true;
            $scope.advShareFromDtm = $scope.advShareFromDtm + " " + $scope.advShareFromTime;
            if (new Date($scope.advShareFromDtm) == 'Invalid Date') {
                toastr.error('Invalid share from date!');
            } else {
                $scope.advShareFromDtm =  new Date($scope.advShareFromDtm).toISOString();
            }
            $scope.advShareToDtm = $scope.advShareToDtm + " " + $scope.advShareToTime;
            if (new Date($scope.advShareToDtm) == 'Invalid Date') {
                toastr.error('Invalid share to date!');
            } else {
                $scope.advShareToDtm =  new Date($scope.advShareToDtm).toISOString();
            }
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                dropboxService.advanceFileShare(dropboxToken, $scope.sharedFilePath, $scope.sharedFileName,
                    $scope.cUsername,$scope.advShareEmailAddress , $scope.advSharerName, $scope.advShareFromDtm,
                    $scope.advShareToDtm, true, $scope.advShareCanDownload,
                    $scope.advShareMessage);
                window.setTimeout(function() {
                    $scope.isLoad = false;
                    $scope.$evalAsync();
                    toastr.success('File shared successfully!');
                },5000);
                // .then(function(success) {
                //
                //     console.log(success);
                // },function(error){
                //     $scope.isLoad = false;
                // });
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                googleDriveService.advanceFileShare($scope.sharedFilePath, $scope.sharedFileName,
                    $scope.cUsername,$scope.advShareEmailAddress , $scope.advSharerName, $scope.advShareFromDtm,
                    $scope.advShareToDtm, true, $scope.advShareCanDownload,
                    $scope.advShareMessage);
                window.setTimeout(function() {
                    $scope.isLoad = false;
                    $scope.$evalAsync();
                    toastr.success('File shared successfully!');
                },5000);
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                boxService.advanceFileShare(boxDotNetToken, $scope.sharedFilePath, $scope.sharedFileName,
                    $scope.cUsername, $scope.advShareEmailAddress ,$scope.advSharerName, $scope.advShareFromDtm,
                    $scope.advShareToDtm, true, $scope.advShareCanDownload,
                    $scope.advShareMessage);
                window.setTimeout(function() {
                    $scope.isLoad = false;
                    $scope.$evalAsync();
                    toastr.success('File shared successfully!');
                },5000);
                //     .then(function(success) {
                //
                //    console.log(success);
                // },function(error){
                //     $scope.isLoad = false;
                // });
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                oneDriveService.advanceFileShare(oneDriveToken, $scope.sharedFilePath, $scope.sharedFileName,
                    $scope.cUsername, $scope.advShareEmailAddress ,$scope.advSharerName, $scope.advShareFromDtm,
                    $scope.advShareToDtm, true, $scope.advShareCanDownload,
                    $scope.advShareMessage);
                //     .then(function(success) {
                //     console.log(success);
                // },function(error){
                //     $scope.isLoad = false;
                // });
                window.setTimeout(function() {
                    $scope.isLoad = false;
                    $scope.$evalAsync();
                    toastr.success('File shared successfully!');
                },5000);
            }

        };

        /*
         * Share Multiple Files via Email
         * Handles sharing of multiple selected files
         */
        $scope.shareMultipleFiles = function() {
            if (!$scope.selectedArray || $scope.selectedArray.length === 0) {
                $rootScope.$broadcast('showErrorAlert', {data: 'No files selected for sharing'});
                return;
            }

            // Initialize variables for multiple file sharing
            $scope.multipleShareUrls = [];
            $scope.multipleShareFileNames = [];
            $scope.multipleShareProcessedCount = 0;
            $scope.multipleShareTotalCount = $scope.selectedArray.length;
            
            $scope.isLoad = true;
            $scope.$evalAsync();

            console.log('Starting multiple file sharing for', $scope.multipleShareTotalCount, 'files');

            // Process each selected file
            $scope.selectedArray.forEach(function(file, index) {
                var fileId = file.id || file.path_lower;
                var fileName = file.title || file.name;
                
                console.log('Processing file', index + 1, 'of', $scope.multipleShareTotalCount, ':', fileName);
                
                // Generate share URL for each file based on cloud provider
                if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    dropboxService.shareFile(dropboxToken, fileId).then(function(success) {
                        $scope.multipleShareUrls.push({
                            name: fileName,
                            url: success.data.url
                        });
                        $scope.multipleShareFileNames.push(fileName);
                        $scope.checkMultipleShareCompletion();
                    }, function(error) {
                        // Try getting existing shared link
                        dropboxService.getSharedLink(dropboxToken, fileId).then(function(success) {
                            if (success.data.links && success.data.links.length > 0) {
                                $scope.multipleShareUrls.push({
                                    name: fileName,
                                    url: success.data.links[0].url
                                });
                                $scope.multipleShareFileNames.push(fileName);
                            }
                            $scope.checkMultipleShareCompletion();
                        }, function(error) {
                            console.error('Error sharing file:', fileName, error);
                            $scope.checkMultipleShareCompletion();
                        });
                    });
                } else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    // For Google Drive, generate direct share URL
                    var shareUrl = "https://drive.google.com/file/d/" + fileId + "/view";
                    $scope.multipleShareUrls.push({
                        name: fileName,
                        url: shareUrl
                    });
                    $scope.multipleShareFileNames.push(fileName);
                    $scope.checkMultipleShareCompletion();
                } else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    boxService.shareFile(boxDotNetToken, fileId).then(function(success) {
                        $scope.multipleShareUrls.push({
                            name: fileName,
                            url: success.data.shared_link.url
                        });
                        $scope.multipleShareFileNames.push(fileName);
                        $scope.checkMultipleShareCompletion();
                    }, function(error) {
                        console.error('Error sharing file:', fileName, error);
                        $scope.checkMultipleShareCompletion();
                    });
                } else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    oneDriveService.shareFile(oneDriveToken, fileId).then(function(success) {
                        $scope.multipleShareUrls.push({
                            name: fileName,
                            url: success.data.link.webUrl
                        });
                        $scope.multipleShareFileNames.push(fileName);
                        $scope.checkMultipleShareCompletion();
                    }, function(error) {
                        console.error('Error sharing file:', fileName, error);
                        $scope.checkMultipleShareCompletion();
                    });
                }
            });
        };

        /*
         * Check if all multiple files have been processed for sharing
         */
        $scope.checkMultipleShareCompletion = function() {
            $scope.multipleShareProcessedCount++;
            console.log('Processed', $scope.multipleShareProcessedCount, 'of', $scope.multipleShareTotalCount, 'files');
            
            if ($scope.multipleShareProcessedCount >= $scope.multipleShareTotalCount) {
                $scope.isLoad = false;
                $scope.$evalAsync();
                
                if ($scope.multipleShareUrls.length === 0) {
                    $rootScope.$broadcast('showErrorAlert', {data: 'Failed to share any files'});
                    return;
                }
                
                console.log('All files processed. Opening email dialog with', $scope.multipleShareUrls.length, 'file URLs');
                
                // Set up data for email sharing
                $scope.sharedFileName = $scope.multipleShareFileNames.join(', ');
                $scope.multipleFileUrls = $scope.multipleShareUrls;
                
                // Open email sharing dialog
                $("#shareViaEmail").modal("show");
            }
        };

        $scope.$on('onShareFiledDownloadedOnServer', function(event, data) {
            $scope.isLoad = false;
            $scope.$evalAsync();

        });

        $scope.$on('googleDriveShareFileListener', function(event, data) {
            $scope.isLoad = false;
            $scope.$evalAsync();
            // $scope.sendEmailToAll(data.data.selfLink);
            var _gdURL = "https://drive.google.com/file/d/"+$scope.curSelectedFileId+"/view";
            $scope.openEmailClient(_gdURL);
            // $scope.openEmailClient(data.data.selfLink);
            googleDriveService.getListOfSharedMembers($scope.curSelectedShareFile, function (permissions) {
                permissions
                    .filter(function (item) {
                        return item.type !== 'anyone'
                    })
                    .forEach(function (item) {
                        $scope.listOfSharedMembers.push({
                            display_name: item.name ? item.name : item.emailAddress,
                            email: item.id
                        });
                    });
                $scope.$evalAsync();
            });
        });

        $scope.$on('googleDriveAdvanceShareFileListener', function(event, data) {
            $scope.isLoad = false;
            var urlParts = data.data.selfLink.split("/");
            _url = "https://drive.google.com/file/d/"+urlParts[6]+"/view";
            $scope.openShareModel(_url);
        });

        $scope.openEmailClient = function(shareURL){
            var _sURL = shareURL;
            $scope.sharedFileURL = shareURL;
            if($scope.isRTEmail == true){
                $scope.isRTEmail = false;
                $("#shareRTFileViaEmail").modal("show");
            }else{
                $("#shareViaEmail").modal("show");
            }
            $scope.$evalAsync();
            /*
            // if ($scope.sharedFileName.indexOf(".$enc") > -1) {
            _sURL = Constants.REDIRECT_URL +'#/share?surl=' + shareURL +'&utocken='+ authService.activeSession.encr_key
                +'&uname='+$cookies.get("cUsername")+ '&fileName=' +$scope.sharedFileName+'&csource='
                + $scope.selectedCloud;
            // }
            console.log("_sURL : ", _sURL);
            var _content = 'mailto: ?subject=File%20shared%20via%20Cloud-Fish&body='+ encodeURI(_sURL);
            window.location.href = _content;
            $scope.sharedFileName = "";
            */
        }

        $scope.shareURLModel = function(shareURL){
            $("#shareURLModel").modal("show");
            $scope.shareFileTF = shareURL;
            $scope.$evalAsync();
        };

        $scope.copyTFToClipBoard = function (tfName) {
            console.log(tfName);
            var copyTextarea = document.getElementsByName(tfName);
            copyTextarea[0].select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.log('Oops, unable to copy');
            }
        };

        $scope.copyToClipBoard = function(){
            var elem = document.getElementById("shareTF");
            var targetId = "_hiddenCopyText_";
            var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
            var origSelectionStart, origSelectionEnd;
            if (isInput) {
                // can just use the original source element for the selection and copy
                target = elem;
                origSelectionStart = elem.selectionStart;
                origSelectionEnd = elem.selectionEnd;
            } else {
                // must use a temporary form element for the selection and copy
                target = document.getElementById(targetId);
                if (!target) {
                    var target = document.createElement("textarea");
                    target.style.position = "absolute";
                    target.style.left = "-9999px";
                    target.style.top = "0";
                    target.id = targetId;
                    document.body.appendChild(target);
                }
                target.textContent = elem.textContent;
            }
            // select the content
            var currentFocus = document.activeElement;
            target.focus();
            target.setSelectionRange(0, target.value.length);

            // copy the selection
            var succeed;
            try {
                succeed = document.execCommand("copy");
            } catch(e) {
                succeed = false;
            }
            // restore original focus
            if (currentFocus && typeof currentFocus.focus === "function") {
                currentFocus.focus();
            }

            if (isInput) {
                // restore prior selection
                elem.setSelectionRange(origSelectionStart, origSelectionEnd);
            } else {
                // clear temporary content
                target.textContent = "";
            }
            $("#shareURLModel").modal("hide");
            return succeed;
        };

        $scope.copyTextToClipBoard = function(text){
            var elem = document.getElementById("urlToCopy");
            elem.value = text;
            var targetId = "_hiddenCopyText_";
            var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
            var origSelectionStart, origSelectionEnd;
            if (isInput) {
                // can just use the original source element for the selection and copy
                target = elem;
                origSelectionStart = elem.selectionStart;
                origSelectionEnd = elem.selectionEnd;
            } else {
                // must use a temporary form element for the selection and copy
                target = document.getElementById(targetId);
                if (!target) {
                    var target = document.createElement("textarea");
                    target.style.position = "absolute";
                    target.style.left = "-9999px";
                    target.style.top = "0";
                    target.id = targetId;
                    document.body.appendChild(target);
                }
                target.textContent = elem.textContent;
            }
            // select the content
            var currentFocus = document.activeElement;
            target.focus();
            target.setSelectionRange(0, target.value.length);

            // copy the selection
            var succeed;
            try {
                succeed = document.execCommand("copy");
            } catch(e) {
                succeed = false;
            }
            // restore original focus
            if (currentFocus && typeof currentFocus.focus === "function") {
                currentFocus.focus();
            }

            if (isInput) {
                // restore prior selection
                elem.setSelectionRange(origSelectionStart, origSelectionEnd);
            } else {
                // clear temporary content
                target.textContent = "";
            }
            $("#appStoreModel").modal("hide");
            $("#playStoreModel").modal("hide");
            return succeed;
        }

        $scope.sendMobileAppURLToEmmail = function(subject, content){
            $("#appStoreModel").modal("hide");
            $("#playStoreModel").modal("hide");
            utilsService.sendEmail($scope.cUsername, subject, content).then(function(success) {
                console.log("Email : ", success.data);
                swal("Thanks!", "An email has been sent to you!", "success");
            },function(error){
                console.log("Email : ", error.data);
            });
        }



        /*
         *   Clouds Download File Method
         *  @Param  : File or File ID of Cloud file
         *  @Param  : file name of Cloud file
         *  @Result : Download file
         */
        $scope.menuDownloadFile = function(fileId, fileName){
            $scope.isLoad = true;
            $scope.$apply();
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            dropboxService.downloadFile(dropboxToken, _cfile.path_lower);
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    dropboxService.downloadFile(dropboxToken, fileId);
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
				console.log('menu-download');
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            googleDriveService.downloadFile(_cfile);
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
					let file = $scope.fileList.find(f => f.path_lower === fileId || f.id === fileId);
					console.log($scope.fileList, fileId);
					if (file) {
						googleDriveService.downloadFile(file);
					} else {
						console.error("File object not found for ID", fileId);
					}
                    // googleDriveService.downloadFile(file);
                }
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            boxService.downloadFile( boxDotNetToken, _cfile.id, _cfile.name);
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    boxService.downloadFile( boxDotNetToken, fileId, fileName);
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            var _cfile = $scope.selectedArray[i];
                            oneDriveService.downloadFile(oneDriveToken, _cfile.id, _cfile.name);
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }
                }else {
                    oneDriveService.downloadFile(oneDriveToken, fileId, fileName);
                }
            }
        };


        /*
         *   Clouds Encrypt / Decrypt File Method
         *  @Param  : File or File ID of Cloud file
         *  @Result : Encrypt / Decrypt File and Update List View
         */
        $scope.encryptDecrypt = function(fileId, fileName){
			// debugger;
            if ($scope.isEncDecInProgress === true) {
                $scope.isLoad = true;
            } else {
                $scope.isEncDecInProgress = true;
                const _index = $scope.fileList.findIndex((f) => (f.id == fileId || f.path_lower == fileId));
                console.log(_index);
                if ($scope.fileList[_index] && $scope.fileList[_index].title) {
                    $scope.fileList[_index].title = $scope.fileList[_index].title.indexOf('.$enc') > -1 ?
                        $scope.fileList[_index].title.replace(".$enc", "") : $scope.fileList[_index].title + ".$enc";
                }

                if ($scope.fileList[_index] && $scope.fileList[_index].name) {
                    $scope.fileList[_index].name = $scope.fileList[_index].name.indexOf('.$enc') > -1 ?
                        $scope.fileList[_index].name.replace(".$enc", "") : $scope.fileList[_index].name + ".$enc";
                }
                $scope.$evalAsync();
            }


            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                if(dropboxToken !== undefined && dropboxToken.length > 10) {
                    if ($scope.isSelected == false) {
                        if (confirm("Batch operation will take time. Do you want to continue ?")) {
                            var _cfile = $scope.selectedArray.pop();
                            dropboxService.encryptDecryptSynchronized(dropboxToken, _cfile.path_lower, dbCFId);
                        }
                    }else {
                        dropboxService.encryptDecrypt(dropboxToken, fileId, dbCFId);
                    }
                }
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                if ($scope.isSelected == false) {
                    if (confirm("Batch operation will take time. Do you want to continue ?")) {
                        var _cfile = $scope.selectedArray.pop();
                        googleDriveService.encryptDecryptSynchronized(_cfile.id, gdCFId);
                    }
                }else {
                    googleDriveService.encryptDecrypt(fileId, gdCFId);
					// Quick fix: refresh list after short delay so updated file ID is available
					setTimeout(function () {
						$scope.$emit('updateGDListView', {
							data: {
								items: $scope.googleDriveFilesArray
							}
						});
					}, 1500); // You can adjust delay if needed
                }
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 10) {
                    if ($scope.isSelected == false) {
                        if (confirm("Batch operation will take time. Do you want to continue ?")) {
                            var _cfile = $scope.selectedArray.pop();
                            boxService.encryptDecryptSynchronized(boxDotNetToken, _cfile.id, _cfile.name, bnCFId);
                        }
                    }else {
                        boxService.encryptDecrypt(boxDotNetToken, fileId, fileName, bnCFId);
                    }
                }
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 10) {
                    if ($scope.isSelected == false) {
                        if (confirm("Batch operation will take time. Do you want to continue ?")) {
                            var _cfile = $scope.selectedArray.pop();
                            oneDriveService.encryptDecryptSynchronized(oneDriveToken, _cfile.id, _cfile.name, odCFId);
                        }
                    }else {
                        oneDriveService.encryptDecrypt(oneDriveToken, fileId, fileName, odCFId);
                    }
                }
            }
        };

        $scope.moveToOtherClouds = function (fileId, fileName) {
            $scope.sharedFileName = fileName;
            $scope.curSelectedFileId = fileId;
        };

        $scope.moveToDropBox = function () {
            $("#dragPanalModel").modal("hide");
            if ($scope.isSelected == false) {
                if (confirm("Batch operation will take time. Do you want to continue ?")) {
                    $scope.downloadForDropBox();
                }
            }else {
                $scope.downloadForDropBox();
            }
        };

        $scope.downloadForDropBox = function () {
            if ($scope.selectedCloud != CLOUDS.DROP_BOX) {
                if(dropboxToken != undefined && dropboxToken.length > 0) {
                    $scope.isLoad = true;
                    $scope.$evalAsync();
                    if ($scope.isSelected == false) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            /*$scope.isLoad = true;
                            $scope.$evalAsync();*/
                            var _cfile = $scope.selectedArray[i];
                            var _id = _cfile.id;
                            var _fname = _cfile.name !== undefined ? _cfile.name : _cfile.title;
                            $scope.cDraggedFileName = _fname;
                            if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                                googleDriveService.dowloadBlob(_id, _fname, CLOUDS.DROP_BOX);
                            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                                boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.DROP_BOX);
                            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                                oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.DROP_BOX);
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }else {
                        /*$scope.isLoad = true;
                        $scope.$evalAsync();*/
                        var _id = $scope.curSelectedFileId;
                        var _fname = $scope.sharedFileName;
                        $scope.cDraggedFileName = _fname;
                        if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                            googleDriveService.dowloadBlob(_id, _fname, CLOUDS.DROP_BOX);
                        }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                            boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.DROP_BOX);
                        }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                            oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.DROP_BOX);
                        }
                    }
                }else{
                    $scope.loginDB();
                }
            }
        };

        $scope.moveToGoogleDrive = function () {
            $("#dragPanalModel").modal("hide");
            if ($scope.isSelected == false) {
                if (confirm("Batch operation will take time. Do you want to continue ?")) {
                    $scope.downloadForGoogleDrive();
                }
            }else {
                $scope.downloadForGoogleDrive();
            }
        };
        $scope.downloadForGoogleDrive = function () {
            if ($scope.selectedCloud != CLOUDS.GOOGLE_DRIVE) {
                $scope.isLoad = true;
                $scope.$evalAsync();
                if ($scope.isSelected == false) {
                    for (var i = 0; i < $scope.selectedArray.length; i++) {
                        /*$scope.isLoad = true;
                        $scope.$evalAsync();*/
                        var _cfile = $scope.selectedArray[i];
                        var _id = _cfile.id;
                        var _fname = _cfile.name !== undefined ? _cfile.name : _cfile.title;
                        $scope.cDraggedFileName = _fname;
                        if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                            dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                        }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                            boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                        }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                            oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                        }
                    }
                    $scope.selectedArray = [];
                    $scope.isSelected = true;
                }else {
                    /*$scope.isLoad = true;
                    $scope.$evalAsync();*/
                    var _id = $scope.curSelectedFileId;
                    var _fname = $scope.sharedFileName;
                    $scope.cDraggedFileName = _fname;
                    if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                        dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                    }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                        boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                    }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                        oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.GOOGLE_DRIVE);
                    }
                }
            }
        };
        $scope.moveToBox = function () {
            $("#dragPanalModel").modal("hide");
            if ($scope.isSelected == false) {
                if (confirm("Batch operation will take time. Do you want to continue ?")) {
                    $scope.downloadForBox();
                }
            }else {
                $scope.downloadForBox();
            }
        };
        $scope.downloadForBox = function () {
            if ($scope.selectedCloud != CLOUDS.BOX_NET) {
                if(boxDotNetToken !== undefined && boxDotNetToken.length > 0) {
                    $scope.isLoad = true;
                    $scope.$evalAsync();
                    if ($scope.isSelected == false) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            /*$scope.isLoad = true;
                            $scope.$evalAsync();*/
                            var _cfile = $scope.selectedArray[i];
                            var _id = _cfile.id;
                            var _fname = _cfile.name !== undefined ? _cfile.name : _cfile.title;
                            $scope.cDraggedFileName = _fname;
                            if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                                googleDriveService.dowloadBlob(_id, _fname, CLOUDS.BOX_NET);
                            }else if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                                dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.BOX_NET);
                            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                                oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.BOX_NET);
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }else {
                        /*$scope.isLoad = true;
                        $scope.$evalAsync();*/
                        var _id = $scope.curSelectedFileId;
                        var _fname = $scope.sharedFileName;
                        $scope.cDraggedFileName = _fname;
                        if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                            googleDriveService.dowloadBlob(_id, _fname, CLOUDS.BOX_NET);
                        }else if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                            dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.BOX_NET);
                        }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                            oneDriveService.dowloadBlob(oneDriveToken, _id, _fname, CLOUDS.BOX_NET);
                        }
                    }
                }else{
                    $scope.loginBN();
                }
            }
        };
        $scope.moveToOneDrive = function () {
            $("#dragPanalModel").modal("hide");
            if ($scope.isSelected == false) {
                if (confirm("Batch operation will take time. Do you want to continue ?")) {
                    $scope.downloadForOneDrive();
                }
            }else {
                $scope.downloadForOneDrive();
            }
        };
        $scope.downloadForOneDrive = function () {
            if ($scope.selectedCloud != CLOUDS.ONE_DRIVE) {
                if(oneDriveToken !== undefined && oneDriveToken.length > 0) {
                    $scope.isLoad = true;
                    $scope.$evalAsync();
                    if ($scope.isSelected == false) {
                        for (var i = 0; i < $scope.selectedArray.length; i++) {
                            /*$scope.isLoad = true;
                            $scope.$evalAsync();*/
                            var _cfile = $scope.selectedArray[i];
                            var _id = _cfile.id;
                            var _fname = _cfile.name !== undefined ? _cfile.name : _cfile.title;
                            $scope.cDraggedFileName = _fname;
                            if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                                googleDriveService.dowloadBlob( _id, _fname, CLOUDS.ONE_DRIVE);
                            }else if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                                dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.ONE_DRIVE);
                            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                                boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.ONE_DRIVE);
                            }
                        }
                        $scope.selectedArray = [];
                        $scope.isSelected = true;
                    }else {
                        /*$scope.isLoad = true;
                        $scope.$evalAsync();*/
                        var _id = $scope.curSelectedFileId;
                        var _fname = $scope.sharedFileName;
                        $scope.cDraggedFileName = _fname;
                        if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                            googleDriveService.dowloadBlob( _id, _fname, CLOUDS.ONE_DRIVE);
                        }else if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                            dropboxService.dowloadBlob(dropboxToken, _id, _fname, CLOUDS.ONE_DRIVE);
                        }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                            boxService.dowloadBlob(boxDotNetToken, _id, _fname, CLOUDS.ONE_DRIVE);
                        }
                    }
                }else{
                    $scope.loginOD();
                }
            }
        };

        $scope.onAllFileSelectionChanged = function (chkBox) {
            console.log(chkBox);
        };
		
		$scope.toggleSelectAll = function () {
		  console.log("toggleSelectAll called. selectAll (from ng-model):", $scope.selectAll);

		  if (!$scope.fileList) {
			console.log("Error: fileList is undefined or empty");
			return;
		  }

		  if ($scope.selectAll) {
			// When check-all is true, mark every file as selected.
			angular.forEach($scope.fileList, function(file, index) {
			  file.selected = true;
			  console.log("Setting file at index", index, "selected:", file.selected, file);
			});
			// Update selectedArray to include all files
			$scope.selectedArray = $scope.fileList.slice();
			console.log("After select all, selectedArray:", $scope.selectedArray);
		  } else {
			// When unchecked, unselect all files.
			angular.forEach($scope.fileList, function(file, index) {
			  file.selected = false;
			  console.log("Setting file at index", index, "selected:", file.selected, file);
			});
			$scope.selectedArray = [];
			console.log("After deselect all, selectedArray is empty");
		  }

		  console.log("toggleSelectAll finished. Current selectedArray length:", $scope.selectedArray.length);
		};
		
		$scope.onFileSelectionChanged = function(chkBox, file) {
		  // Since the checkbox is bound via ng-model to file.selected,
		  // simply check the current state and update the selectedArray.
		  if (file.selected) {
			// If the file is now selected, push it into the array (if not already there)
			if (utilsService.getObjectIndex(file, $scope.selectedArray) === -1) {
			  $scope.selectedArray.push(file);
			}
		  } else {
			// If the file is unchecked, remove it from the selected array
			var index = utilsService.getObjectIndex(file, $scope.selectedArray);
			if (index !== -1) {
			  $scope.selectedArray.splice(index, 1);
			}
		  }

		  // Update the isSelected flag based on whether any files are selected.
		  $scope.isSelected = ($scope.selectedArray.length === 0);
			
			// Update select all flag
			$scope.selectAll = ($scope.fileList.length > 0 && $scope.fileList.length == $scope.selectedArray.length);
		};

        /*$scope.onFileSelectionChanged = function(chkBox, file){
            var _index = utilsService.getObjectIndex(file, $scope.selectedArray);
            if (_index == -1) {
                $scope.selectedArray.push(file);
            }else {
                $scope.selectedArray.splice(_index, 1);
            }
            if ($scope.selectedArray.length > 0) {
                $scope.isSelected = false;
            }else {
                $scope.isSelected = true;
            }
        };*/
		

        /*
         *   Clouds Encrypt / Decrypt File Method Callback
         *  @Param  : No param reqquired
         *  @Result : Encrypt / Decrypt File and Update List View
         */
        $scope.$on('encryptDecryptSynchronizedCallback', function(event, data) {
            var _cfile = $scope.selectedArray.pop();
            if (_cfile !== undefined) {
                if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    dropboxService.encryptDecryptSynchronized(dropboxToken, _cfile.path_lower, dbCFId);
                }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.encryptDecryptSynchronized(_cfile.id, gdCFId);
                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    boxService.encryptDecryptSynchronized(boxDotNetToken, _cfile.id, _cfile.name, bnCFId);
                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    oneDriveService.encryptDecryptSynchronized(oneDriveToken, _cfile.id, _cfile.name, odCFId);
                }
            }else {
                $scope.selectedArray = [];
                $scope.isSelected = true;
                $scope.refreshDir();
            }
        });


        $scope.goToSettingsPage = function(){
            $rootScope.$broadcast('showErrorAlert', {data: "Settings page is under construction....!!"});
        };

        /****************************************************************
         *               Clouds Login and fetch and Update List View     *
         *               Methods
         *               Dropbox, Google Drive, Box and OneDrive
         *****************************************************************/
		
		$scope.loginDBProcess = function(){
			utilsService.updateSelectedCloud(CLOUDS.DROP_BOX);
            $scope.selectedCloud = CLOUDS.DROP_BOX;
            $scope.isLoad = true;
            $scope.fileList = [];
            $scope.isCloudSessionActive = false;
            dropboxToken = utilsService.getDropBoxToken();
            if(dropboxToken !== undefined && dropboxToken.length > 0) {
                dbCFId = "/";
                if (authService.activeSession.audit_level > 0) {
                    utilsService.postAudit("LOGIN", "", "", $scope.selectedCloud);
                }
                $scope.fetchAndUpdateDropBoxList();
            }else{
                dropboxService.login();
            }
            $scope.dirBackStack = [];
            $scope.updateTabUI();
		};

        // Login to Dropbox
        $scope.loginDB = function(){
			$("#loginDBModal").modal("show");
			$("#loginDBModal").one("hidden.bs.modal", function() {
				 $scope.loginDBProcess();
			});
            
        };

        // Show List of All Dropbox Files
        $scope.fetchAndUpdateDropBoxList = function() {
            $scope.isLoad = true;
            $scope.updateTabUI();
            $scope.doEmptySelectedArray();
            // Call Dropbox Service for List of files
            dropboxService.listfiles(dropboxToken, dbCFId).then(function(success) {
                $scope.fileList = [];
                $scope.isCloudSessionActive = true;
                if(dbCFId === '/'){
                    $scope.fileList.push({
                        "fileIcon": "images/fileIcons/FOLDER.png",
                        "thumb_exists": false,
                        "path_lower": "/shared_folders",
                        "is_dir": true,
                        "title": "Files Shared with Me",
                        "icon": "folder",
                        ".tag": "folder",
                        "read_only": false,
                        "modifier": null,
                        "bytes": 0,
                        "modified": "Mon, 21 Nov 2016 03:49:53 +0000",
                        "size": "0 bytes",
                        "root": "dropbox",
                        "revision": 428
                    });
                }
                angular.forEach(success.data.entries, function(value, key) {
                    value.title = value.name ? value.name : value.path_lower.split('/').pop();
                    value.path_lower = value.path_lower ? value.path_lower : "/"+value.name;
                    value.fileIcon = $scope.getFileIcon(value.title, value['.tag'] === 'folder');
                    if (value['.tag'] !== 'folder') {
                        if (value.client_modified) {
                            value.client_modified = utilsService.formatDateTime(value.client_modified);
                        }
                        if (value.time_invited) {
                            value.client_modified = utilsService.formatDateTime(value.time_invited);
                        }
                        value.size = value.size ? utilsService.bytesToSize(value.size) : "O kbs";
                    }
                    $scope.fileList.push(value);
                });
                $scope.fileList = $scope.fileList.sort(function(a, b){
                    return a.title.localeCompare(b.title);
                });
                $scope.fileList = $scope.fileList.sort(function(a, b){
                    return (a['.tag'] == 'folder' ? -1 : 1);
                });
                $scope.isLoad = false;
                $scope.addContextMenu();
                $scope.addDragDownloadListener();
				$scope.selectAll = false;
            }, function(error) {
                $scope.isLoad = false;
                $scope.isCloudSessionActive = true;
            });
        };

        //DropBox Encrypted file Update method
        $scope.$on('updateDBListView', function(event, data) {
            $scope.isLoad = false;
            $("#uploadModal").modal("hide");
            $("#uploadModalEncrypted").modal("hide");
            $scope.fetchAndUpdateDropBoxList();
            if ($scope.isRTEmail == true){
                // $scope.isRTEmail = false;
                $scope.sharedFileName = JSON.parse(data.data.responseText).name;;
                $scope.curSelectedFileId = JSON.parse(data.data.responseText).path_display;
                $scope.shareFile($scope.curSelectedFileId, $scope.sharedFileName);
                // $("#shareViaEmail").modal("show");
            }
        });
		
		$scope.loginGDProcess = function(){
			gdCFId = "root";
            utilsService.updateSelectedCloud(CLOUDS.GOOGLE_DRIVE);
            $scope.selectedCloud = CLOUDS.GOOGLE_DRIVE;
            $scope.fileList = [];
            $scope.isCloudSessionActive = false;
            if (authService.activeSession.audit_level > 0) {
                utilsService.postAudit("LOGIN", "", "", $scope.selectedCloud);
            }
            googleDriveService.login();
            $scope.dirBackStack = [];
            $scope.updateTabUI();
			$scope.selectAll = false;
		};

        //Google Drive Methods
        $scope.loginGD = function(init){
			if(!init) {
				if (!$scope.isGDModalShown) {
					$("#loginGDModal").modal("show");

					$("#loginGDModal").one("hidden.bs.modal", function() {
						localStorage.setItem('isGDModalShown', 'true'); // Persist the state in localStorage
						$scope.isGDModalShown = true;
						$scope.$apply();
						$scope.loginGDProcess();
					});
				} else {
					$scope.loginGDProcess();
				}
			}
        };

        $scope.$on('updateGDListView', function(event, data) {
            $scope.updateTabUI();
            $scope.doEmptySelectedArray();
            $scope.fileList = [];
            $scope.isCloudSessionActive = true;
            //TODO: filter and Map Google Drive Files
            $scope.fileList = [];
            var files = data.data.items;
			console.log('Test->',data);
            if(files != undefined)
                files.reverse();
            $scope.googleDriveFilesArray = files.slice();
            files = files.map(function(_file){
                _file.modifiedDate = utilsService.formatDateTime(_file.modifiedDate);
                if (_file.mimeType != 'application/vnd.google-apps.folder')
                    _file.fileSize = utilsService.bytesToSize(_file.fileSize);
                return _file;
            });
            $scope.fileList = files.filter(function (_item) {
                console.log(_item?.originalFilename);
                 return (_item.parents.length > 0 && _item.parents[0].isRoot && !_item.labels.trashed);
               // if(gdCFId == "root"){
                 //   if(_item.parents.length > 0 && _item.parents[0].isRoot ) return true;
                 //}else if(_item.parents.length > 0 && _item.parents[0].id == gdCFId ) return true;
                // else return false;
            }).map(function (_item) {
               if(_item.mimeType == 'application/vnd.google-apps.folder'){
                 _item.fileIcon = "images/fileIcons/FOLDER.png";
               }else{
                  _item.fileIcon = _item.iconLink;
               }
               return _item;
            });
			console.log( $scope.fileList)
            if(gdCFId === "root"){
                $scope.fileList.push({
                    "kind": "drive#file",
                    "id": "sharedFolderID",
                    "title": "Files Shared with Me",
                    "mimeType": "application/vnd.google-apps.folder",
                    "fileIcon": "images/fileIcons/FOLDER.png",
                    "labels":{
                        "trashed": false,
                        "hidden" : false
                    },
                    "parents": [
                        {
                            "id": "root",
                            "isRoot": true
                        }
                    ]
                });
                $scope.googleDriveFilesArray.push({
                    "kind": "drive#file",
                    "id": "sharedFolderID",
                    "title": "Files Shared with Me",
                    "mimeType": "application/vnd.google-apps.folder",
                    "fileIcon": "images/fileIcons/FOLDER.png",
                    "labels":{
                        "trashed": false,
                        "hidden" : false
                    },
                    "parents": [
                        {
                            "id": "root",
                            "isRoot": true
                        }
                    ]
                });
            }
            $scope.fileList = $scope.fileList.sort(function(a, b){
                return a.title.localeCompare(b.title);
            });
            $scope.fileList = $scope.fileList.sort(function(a, b){
                return (a.mimeType == 'application/vnd.google-apps.folder' ? -1 : 1);
            });
            $scope.$apply();
            $scope.isLoad = false;
            $scope.addContextMenu();
            $scope.addDragDownloadListener();

           /* files.reverse();
            if (files && files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    file.fileIcon = $scope.getFileIcon(file.title, false);
                    $scope.fileList.push(file);
                }
                $scope.$apply();
                $scope.isLoad = false;
                $scope.addContextMenu();
                $scope.addDragDownloadListener();
            } else {
                console.log("GD", "No files found ... !!!");
            }*/

            $("#myModal").modal("hide");
            $("#uploadModalEncrypted").modal("hide");
            $("#uploadModal").modal("hide");
            $scope.isLoad = false;
            $scope.$apply();
        });
		
		$scope.processBNLogin = function(){
			utilsService.updateSelectedCloud(CLOUDS.BOX_NET);
            $scope.selectedCloud = CLOUDS.BOX_NET;
            $scope.fileList = [];
            $scope.isCloudSessionActive = false;
            boxDotNetToken = utilsService.getBoxDotNetToken();
            if(boxDotNetToken !== undefined && boxDotNetToken.length > 0) {
                bnCFId = "0";
                if (authService.activeSession.audit_level > 0) {
                    utilsService.postAudit("LOGIN", "", "", $scope.selectedCloud);
                }
                $scope.fetchAndUpdateBoxList();
            }else{
                boxService.login();
            }
            $scope.dirBackStack = [];
            $scope.updateTabUI();
		};

        // Login to Box.Net
        $scope.loginBN = function(){
			$("#loginBNModal").modal("show");
			$("#loginBNModal").one("hidden.bs.modal", function() {
				 $scope.processBNLogin();
			});
        };

        // Show List of All Box.Net Files
        $scope.fetchAndUpdateBoxList = function() {
            $scope.isLoad = true;
            $scope.updateTabUI();
            $scope.doEmptySelectedArray();
            // Call Box.Net Service for List of files
            boxService.listfiles(boxDotNetToken, bnCFId).then(function(success) {
                $scope.fileList = [];
                $scope.isCloudSessionActive = true;
                angular.forEach(success.data.entries, function(value, key) {
                    if (value.type == "file") {
                        value.fileIcon = $scope.getFileIcon(value.name, false);
                    }else{
                        if (value.name == 'Requested File Dir') {
                            $scope.requestedFileDirId = value.id;
                        }
                        value.fileIcon = "images/fileIcons/FOLDER.png";
                    }
                    $scope.fileList.push(value);
                });
                $scope.fileList = $scope.fileList.sort(function(a, b){
                    return a.name.localeCompare(b.name);
                });
                $scope.fileList = $scope.fileList.sort(function(a, b){
                    return (a.type == "file" ? 1 : -1);
                });
                $scope.isLoad = false;
                $scope.addContextMenu();
                $scope.addDragDownloadListener();
				$scope.selectAll = false;
            }, function(error) {
                $scope.isLoad = false;
                $scope.isCloudSessionActive = true;
            });
        };

        //Box.Net Encrypted file Update method
        $scope.$on('updateBNListView', function(event, data) {
            $scope.isLoad = false;
            $("#uploadModal").modal("hide");
            $("#uploadModalEncrypted").modal("hide");
            $scope.fetchAndUpdateBoxList();
            if ($scope.isRTEmail == true){
                // $scope.isRTEmail = false;
                $scope.sharedFileName = JSON.parse(data.data.responseText).entries[0].name;
                $scope.curSelectedFileId = JSON.parse(data.data.responseText).entries[0].id;

                $scope.shareFile($scope.curSelectedFileId, $scope.sharedFileName);
                // $("#shareViaEmail").modal("show");
            }
        });
		
		
		$scope.processODLogin = function(){
			utilsService.updateSelectedCloud(CLOUDS.ONE_DRIVE);
            $scope.selectedCloud = CLOUDS.ONE_DRIVE;
            oneDriveToken = utilsService.getOneDriveToken();
            $scope.fileList = [];
            $scope.isCloudSessionActive = false;
            if(oneDriveToken !== undefined && oneDriveToken.length > 0) {
                odCFId = "0";
                if (authService.activeSession.audit_level > 0) {
                    utilsService.postAudit("LOGIN", "", "", $scope.selectedCloud);
                }
                $scope.fetchAndUpdateOneDriveList();
            }else{
                oneDriveService.login();
            }
            $scope.dirBackStack = [];
            $scope.updateTabUI();
		};


        // Login to OneDrive
        $scope.loginOD = function(){
			$("#loginODModal").modal("show");
			$("#loginODModal").one("hidden.bs.modal", function() {
				 $scope.processODLogin();
			});
        };
		

        // Show List of OneDrive Files
        $scope.fetchAndUpdateOneDriveList = function() {
            $scope.isLoad = true;
            $scope.updateTabUI();
            $scope.doEmptySelectedArray();
            // Call Dropbox Service for List of files
            odCFId = odCFId === undefined ? "0" : odCFId;
            oneDriveService.listfiles(oneDriveToken, odCFId).then(function(success) {
                $scope.fileList = [];
                $scope.isCloudSessionActive = true;
                if (odCFId === "0" || $scope.dirBackStack.length == 0){
                    $scope.fileList.push({
                        "id": "sharedWithMe",
                        "name": "Files Shared with Me",
                        "createdDateTime": "",
                        "lastModifiedDateTime": "",
                        "size": 0,
                        "parentReference": { "driveId": "0", "id": "root", "path": "/drive/root" },
                        "folder": { },
                        "fileIcon": "images/fileIcons/FOLDER.png"
                    });
                }
                if (success.data.value.length > 0) {
                    odCFId = success.data.value[0].parentReference.id;
                    utilsService.setODRootFolderID(odCFId);
                }
                angular.forEach(success.data.value, function(value, key) {
                    if (value.file) {
                        value.fileIcon = $scope.getFileIcon(value.name, false);
                        value.size = utilsService.bytesToSize(value.size);
                    }else{
                        if (value.name == 'Requested File Dir') {
                            $scope.requestedFileDirId = value.id;
                        }
                        if (value.size) {
                            value.size = utilsService.bytesToSize(value.size);
                        }
                        value.fileIcon = "images/fileIcons/FOLDER.png";
                    }
                    value.lastModifiedDateTime = utilsService.formatDateTime(value.lastModifiedDateTime);
                    $scope.fileList.push(value);
                });
                $scope.fileList = $scope.fileList.sort(function(a, b){
                    return a.name.localeCompare(b.name);
                });
                $scope.fileList = $scope.fileList.sort(function(a, b){
                    return (a.file ? 1 : -1);
                });
                $scope.isLoad = false;
                $scope.addContextMenu();
                $scope.addDragDownloadListener();
				$scope.selectAll = false;
            }, function(error) {
                $scope.isLoad = false;
                $scope.isCloudSessionActive = true;
            });
        };

        //OneDrive Encrypted file Update method
        $scope.$on('updateODListView', function(event, data) {
            $scope.isLoad = false;
            $("#uploadModal").modal("hide");
            $("#uploadModalEncrypted").modal("hide");
            $scope.fetchAndUpdateOneDriveList();
        });

        //Show Error Alert method
        $scope.$on('showErrorAlert', function(event, data) {
            $scope.isLoad = false;
            $scope.isEncDecInProgress = false;
            $("#error_alert").html('<div class="alert alert-error"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error! </strong>'+ ' ' + data.data +'</div>');
            // Auto-dismiss error alerts after 5 seconds
            window.setTimeout(function() { $(".alert-error").alert('close'); }, 5000);
        });

        //Show Success Alert method
        $scope.$on('showSuccessAlert', function(event, data) {
            $scope.isLoad = false;
            $scope.isEncDecInProgress = false;
            $("#error_alert").html('<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Success! </strong>'+ ' ' + data.data +'</div>');
            // Auto-dismiss success alerts after 3 seconds
            window.setTimeout(function() { $(".alert-success").alert('close'); }, 3000);
        });

        /*
        * Local Server callbacks
        *
        * */
        $scope.loadMyDoc = function(){
            console.log('loadMyDoc');
            localServerService
                .getFileDir('/')
                .then((response) => {
                    console.log(JSON.stringify(response, null, 2));
                })
        };

        /*
        * Open on file Context Menu clicked
        * */
        $scope.onContextMenuOpen = function () {
            console.log("onContextMenuOpen");
        };

        //Show Error Alert method
        $scope.$on('hideLoadingButton', function(event, data) {
            $scope.isLoad = false;
            // $scope.$apply();
            if ($scope.isRTEmail == true){
                // console.log("data : ", data);
                // $scope.isRTEmail = false;
                $scope.sharedFileName = data.data.title;
                $scope.curSelectedFileId = data.data.id;
                $scope.shareFile($scope.curSelectedFileId, $scope.sharedFileName);
                // $("#shareViaEmail").modal("show");
            }
        });

        $scope.getFileIcon = function(title, is_dir){
            if (is_dir == true) {
                return "images/fileIcons/FOLDER.png";
            }else{
                var _ext = title.split('.').pop();
                return "images/fileIcons/" + _ext.toUpperCase() + ".png";
            }
        };

        $scope.addDragDownloadListener = function(){
             var _fileTDs = document.getElementsByClassName("dtdf");
             console.log("Heresss");
             console.log("_fileTDs : ", _fileTDs);
             if (_fileTDs && _fileTDs.length > 0) {
              for (var i = 0; i < _fileTDs.length; i++) {
                 var f = _fileTDs[i];
                 f.addEventListener("dragstart",function(evt){
             			evt.dataTransfer.setData("DownloadURL","application/pdf:HTML5CheatSheet.pdf:http://www.thecssninja.com/demo/gmail_dragout/html5-cheat-sheet.pdf");
                   console.log("evt.dataTransfer : ", evt.dataTransfer);
             		},false);
               }
             }

        };

        $scope.addContextMenu = function(){
            $timeout(function () {
                $("#cloudContentTable td").contextMenu({
                    menuSelector: "#contextMenu",
                    menuSelected: function (invokedOn, selectedMenu) {
                        var _cfId = invokedOn.attr('cfid');
                        var _cfName = invokedOn.parent().children().children().text().split(/[ ,]+/)[0];
                        if (_cfName.length == 0) {
                            _cfName = invokedOn.parent().children().text();
                        }
                        var _option = selectedMenu.text();
                        if (_option == "Rename") {
                            $scope.setFileName(invokedOn.text(), _cfId);
                        }else if (_option == "Delete") {
                            $scope.deleteFile(_cfId, _cfName)
                        }else if (_option == "Email") {
                            // $("#shareViaEmail").modal("show");
                            $scope.shareFile(_cfId, _cfName);
                        }else if (_option == "Encrypt / Decrypt"){
                            $scope.encryptDecrypt(_cfId, _cfName);
                        }else if (_option == "Download"){
                            $scope.menuDownloadFile(_cfId, _cfName);
                        }else if (_option == "Share"){
                             // $scope.advanceShareFile(_cfId, _cfName);
                            $scope.shareFile(_cfId, _cfName);
                        }else if (_option == "Advance Share"){
                            $scope.openAdvanceShareDialog(_cfId, _cfName);
                        }else if(_option == "Move"){
                            $scope.moveToOtherClouds(_cfId, _cfName);
                        }
                    }
                });

                if ($scope.isPageLoad) {
                    $scope.isPageLoad = false;
                    $('#cloudContentTable').DataTable({
                        paging:   false,
                        searching: false,
                        info:     false,
                        autoWidth : false,
                        "sDom" : "Rlfrtip",
                        columns: [
                            { orderable: false },
                            null,
                            null,
                            null
                        ]
                    });
                }

                $("#cloudContentTable tbody tr").draggable({
                    appendTo:"body",
                    helper: function(){
                        return $(this).children('td').slice(1, 2).clone();
                    }
                });

            }, 1000);
        };
		
		$scope.updateTabUI = function(cTab){
            if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                $("#dbTabBtn").attr("src","images/dropbox_selected.png").addClass("active");
                $("#gdTabBtn").attr("src","images/googledrive.png").removeClass("active");
                $("#bnTabBtn").attr("src","images/box.png").removeClass("active");
                $("#odTabBtn").attr("src","images/OneDrive.png").removeClass("active");
            }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                $("#dbTabBtn").attr("src","images/dropbox.png").removeClass("active");
                $("#gdTabBtn").attr("src","images/googledrive_selected.png").addClass("active");
                $("#bnTabBtn").attr("src","images/box.png").removeClass("active");
                $("#odTabBtn").attr("src","images/OneDrive.png").removeClass("active");
            }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                $("#dbTabBtn").attr("src","images/dropbox.png").removeClass("active");
                $("#gdTabBtn").attr("src","images/googledrive.png").removeClass("active");
                $("#bnTabBtn").attr("src","images/box_selected.png").addClass("active");
                $("#odTabBtn").attr("src","images/OneDrive.png").removeClass("active");
            }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                $("#dbTabBtn").attr("src","images/dropbox.png").removeClass("active");
                $("#gdTabBtn").attr("src","images/googledrive.png").removeClass("active");
                $("#bnTabBtn").attr("src","images/box.png").removeClass("active");
                $("#odTabBtn").attr("src","images/OneDrive_selected.png").addClass("active");
            }
        };

        $scope.doEmptySelectedArray = function(){
            $scope.isSelected = true;
            $scope.selectedArray = [];
        }

        $scope.dontShowNTClicked = function(event){
            $scope.isPopUpShowCB = !$scope.isPopUpShowCB;
            utilsService.setLocalStorage("isPopUpShow", $scope.isPopUpShowCB);
        };

        setupDrawingCanvas = function () {
            var sketch = document.querySelector('#sketch');
            var canvas = document.querySelector('#canvas');
            var tmp_canvas = document.createElement('canvas');
            $('#paint-modal').css('visibility', 'hidden').show();

            canvas.width = 670;
            canvas.height = 320;

            $('#paint-modal').css('visibility', 'visible').hide();
            tmp_canvas.width = canvas.width;
            tmp_canvas.height = canvas.height;

            var undo_canvas = [];
            var undo_canvas_len = 7;
            for (var i=0; i<undo_canvas_len; ++i) {
                var ucan = document.createElement('canvas');
                ucan.width = canvas.width;
                ucan.height = canvas.height;
                var uctx = ucan.getContext('2d');
                undo_canvas.push({'ucan':ucan, 'uctx':uctx, 'redoable':false});
            }

            var undo_canvas_top = 0;

            var ctx = canvas.getContext('2d');
            var tmp_ctx = tmp_canvas.getContext('2d');
            tmp_canvas.id = 'tmp_canvas';
            sketch.appendChild(tmp_canvas);

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            var mouse = {x: 0, y: 0};
            var start_mouse = {x:0, y:0};
            var eraser_width = 10;
            var fontSize = '14px';

            // Pencil Points
            var ppts = [];

            var chosen_size = 2; // by default
            /* Drawing on Paint App */
            tmp_ctx.lineWidth = 3;
            tmp_ctx.lineJoin = 'round';
            tmp_ctx.lineCap = 'round';
            tmp_ctx.strokeStyle = 'black';
            tmp_ctx.fillStyle = 'black';

            // paint functions
            var paint_pencil = function(e) {

                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                //console.log(mouse.x + " "+mouse.y);
                // Saving all the points in an array
                ppts.push({x: mouse.x, y: mouse.y});

                if (ppts.length < 3) {
                    var b = ppts[0];
                    tmp_ctx.beginPath();
                    //ctx.moveTo(b.x, b.y);
                    //ctx.lineTo(b.x+50, b.y+50);
                    tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
                    tmp_ctx.fill();
                    tmp_ctx.closePath();
                    return;
                }

                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                tmp_ctx.beginPath();
                tmp_ctx.moveTo(ppts[0].x, ppts[0].y);

                for (var i = 0; i < ppts.length; i++)
                    tmp_ctx.lineTo(ppts[i].x, ppts[i].y);

                tmp_ctx.stroke();

            };

            var paint_line = function(e) {

                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                tmp_ctx.beginPath();
                tmp_ctx.moveTo(start_mouse.x, start_mouse.y);
                tmp_ctx.lineTo(mouse.x, mouse.y);
                tmp_ctx.stroke();
                tmp_ctx.closePath();
            }

            var paint_square = function(e) {
                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                tmp_ctx.beginPath();
                tmp_ctx.moveTo(start_mouse.x, start_mouse.y);

                var x = Math.min(mouse.x, start_mouse.x);
                var y = Math.min(mouse.y, start_mouse.y);
                var width = Math.abs(mouse.x - start_mouse.x);
                var height = Math.abs(mouse.y - start_mouse.y);
                tmp_ctx.strokeRect(x, y, width, height);
                tmp_ctx.closePath();
            }

            var paint_circle = function(e) {
                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                var x = (mouse.x + start_mouse.x) / 2;
                var y = (mouse.y + start_mouse.y) / 2;

                //var radius = Math.max(Math.abs(mouse.x - start_mouse.x), Math.abs(mouse.y - start_mouse.y)) / 2;
                var a = mouse.x - start_mouse.x;
                var b = mouse.y - start_mouse.y;
                var r = Math.sqrt(a*a + b*b);

                tmp_ctx.beginPath();
                //tmp_ctx.arc(x, y, radius, 0, Math.PI*2, false);
                tmp_ctx.arc(start_mouse.x, start_mouse.y, r, 0, 2*Math.PI);
                // tmp_ctx.arc(x, y, 5, 0, Math.PI*2, false);
                tmp_ctx.stroke();
                tmp_ctx.closePath();
            }

            var paint_ellipse = function(e) {
                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                var x = start_mouse.x;
                var y = start_mouse.y;
                var w = (mouse.x - x);
                var h = (mouse.y - y);

                tmp_ctx.save(); // save state
                tmp_ctx.beginPath();

                tmp_ctx.translate(x, y);
                tmp_ctx.scale(w/2, h/2);
                tmp_ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);

                tmp_ctx.restore(); // restore to original state
                tmp_ctx.stroke();
                tmp_ctx.closePath();

            }

            var move_eraser = function(e){
                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                var tmp_lw = tmp_ctx.lineWidth;
                var tmp_ss = tmp_ctx.strokeStyle;
                tmp_ctx.lineWidth = 1;
                tmp_ctx.strokeStyle = 'black';
                tmp_ctx.beginPath();
                tmp_ctx.strokeRect(mouse.x, mouse.y, eraser_width, eraser_width);
                tmp_ctx.stroke();
                tmp_ctx.closePath();
                // restore linewidth
                tmp_ctx.lineWidth = tmp_lw;
                tmp_ctx.strokeStyle = tmp_ss;
            }

            var paint_text = function(e) {
                // Tmp canvas is always cleared up before drawing.
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

                var x = Math.min(mouse.x, start_mouse.x);
                var y = Math.min(mouse.y, start_mouse.y);
                var width = Math.abs(mouse.x - start_mouse.x);
                var height = Math.abs(mouse.y - start_mouse.y);

                textarea.style.left = x + 'px';
                textarea.style.top = y + 'px';
                textarea.style.width = width + 'px';
                textarea.style.height = height + 'px';

                textarea.style.display = 'block';
            }

            var paint_eraser = function(e) {
                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                // erase from the main ctx
                ctx.clearRect(mouse.x, mouse.y, eraser_width, eraser_width);
            }


            // Choose tool
            tool = 'pencil';
            tools_func = {'pencil':paint_pencil, 'line':paint_line, 'square':paint_square,
                'circle':paint_circle, 'ellipse':paint_ellipse, 'eraser':paint_eraser,
                'text':paint_text};

            $('#paint-panel').on('click', function(event){
                // remove the mouse down eventlistener if any
                tmp_canvas.removeEventListener('mousemove', tools_func[tool], false);

                var target = event.target,
                    tagName = target.tagName.toLowerCase();

                if(target && tagName != 'button'){
                    target = target.parentNode;
                    tagName = target.tagName.toLowerCase();
                }

                if(target && tagName === 'button'){
                    tool = $(target).data('divbtn');

                    if (tool === 'eraser') {
                        tmp_canvas.addEventListener('mousemove', move_eraser, false);
                        $(tmp_canvas).css('cursor', 'none');
                    }
                    else {
                        tmp_canvas.removeEventListener('mousemove', move_eraser, false);
                        $(tmp_canvas).css('cursor', 'crosshair');
                        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                    }
                }
            });

            // Change color
            $('#color-panel').on('click', function(event){
                // remove the mouse down eventlistener if any
                tmp_canvas.removeEventListener('mousemove', tools_func[tool], false);

                var target = event.target,
                    tagName = target.tagName.toLowerCase();

                if(target && tagName != 'button'){
                    target = target.parentNode;
                    tagName = target.tagName.toLowerCase();
                }

                if(target && tagName === 'button'){
                    tmp_ctx.strokeStyle =  $(target).data('color');
                    tmp_ctx.fillStyle =  $(target).data('color');
                }
            });



            // Mouse-Down
            tmp_canvas.addEventListener('mousedown', function(e) {

                mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
                mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
                start_mouse.x = mouse.x;
                start_mouse.y = mouse.y;
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                if (tool === 'pencil') {
                    tmp_canvas.addEventListener('mousemove', paint_pencil, false);
                    ppts.push({x: mouse.x, y: mouse.y});
                    paint_pencil(e);
                }

                if (tool === 'line') {
                    tmp_canvas.addEventListener('mousemove', paint_line, false);
                }

                if (tool === 'square') {
                    tmp_canvas.addEventListener('mousemove', paint_square, false);
                }

                if (tool === 'circle') {
                    tmp_canvas.addEventListener('mousemove', paint_circle, false);
                    // Mark the center

                    tmp_ctx.beginPath();
                    //ctx.moveTo(b.x, b.y);
                    //ctx.lineTo(b.x+50, b.y+50);
                    tmp_ctx.arc(start_mouse.x, start_mouse.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
                    tmp_ctx.fill();
                    tmp_ctx.closePath();
                    // copy to real canvas
                    ctx.drawImage(tmp_canvas, 0, 0);
                }

                if (tool === 'ellipse') {
                    tmp_canvas.addEventListener('mousemove', paint_ellipse, false);
                }

                if (tool === 'text') {
                    tmp_canvas.addEventListener('mousemove', paint_text, false);
                    textarea.style.display = 'none'; // important to hide when clicked outside
                }

                if (tool === 'eraser') {
                    tmp_canvas.addEventListener('mousemove', paint_eraser, false);
                    // erase from the main ctx
                    ctx.clearRect(mouse.x, mouse.y, eraser_width, eraser_width);
                }

                if (tool === 'fill') {
                    var replacement_color = hex_to_color(tmp_ctx.strokeStyle);
                    //console.log(tmp_ctx.strokeStyle);
                    var red_component = {'red':255, 'lime':0, 'blue':0, 'orange':255, 'yellow':255, 'magenta':255,
                        'cyan':0, 'purple':128, 'brown':165, 'gray':128, 'lavender':230,
                        'white':255, 'black':0};
                    var green_component = {'red':0, 'lime':255, 'blue':0, 'orange':165, 'yellow':255, 'magenta':0,
                        'cyan':255, 'purple':0, 'brown':42, 'gray':128, 'lavender':230,
                        'white':255, 'black':0};
                    var blue_component = {'red':0, 'lime':0, 'blue':255, 'orange':0, 'yellow':0, 'magenta':255,
                        'cyan':255, 'purple':128, 'brown':42, 'gray':128, 'lavender':250,
                        'white':255, 'black':0};

                    var replace_r = red_component[replacement_color];
                    var replace_g = green_component[replacement_color];
                    var replace_b = blue_component[replacement_color];

                    var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    var pix = imgd.data;
                    // pix is row-wise straightened array
                    var pos = 4 * (canvas.width * mouse.y + mouse.x);
                    var target_color = map_to_color(pix[pos],pix[pos+1],pix[pos+2],pix[pos+3]);

                    // start the flood fill algorithm
                    if (replacement_color !== target_color) {
                        var Q = [pos];
                        while (Q.length > 0) {
                            pos = Q.shift();
                            if (map_to_color(pix[pos],pix[pos+1],pix[pos+2],pix[pos+3]) !== target_color)
                                continue; // color is already changed

                            var left = find_left_most_similar_pixel(pix, pos, target_color);
                            var right = find_right_most_similar_pixel(pix, pos, target_color);
                            // replace color
                            //console.log('right: '+ (right/4)%canvas.width + ' '+ Math.floor(right/(4*canvas.width))  );
                            //console.log(j+'. '+(right-left));
                            for (var i=left; i<=right; i=i+4) {
                                pix[i] = replace_r;
                                pix[i+1] = replace_g;
                                pix[i+2] = replace_b;
                                pix[i+3] = 255; // not transparent

                                var top = i - 4*canvas.width;
                                var down = i + 4*canvas.width;

                                if (top >= 0 && map_to_color(pix[top], pix[top+1], pix[top+2], pix[top+3]) === target_color)
                                    Q.push(top);

                                if (down < pix.length && map_to_color(pix[down], pix[down+1],pix[down+2],pix[down+3]) === target_color)
                                    Q.push(down);
                            }

                        }

                        // Draw the ImageData at the given (x,y) coordinates.
                        ctx.putImageData(imgd, 0, 0);

                    }


                }

            }, false);

            // for filling
            var find_left_most_similar_pixel = function(pix, pos, target_color) {
                var y = Math.floor(pos/(4*canvas.width));
                var left = pos;
                var end = y * canvas.width * 4;
                while (end < left) {
                    if (map_to_color(pix[left-4],pix[left-3],pix[left-2],pix[left-1]) === target_color)
                        left = left - 4;
                    else
                        break;
                }
                return left;
            }

            var find_right_most_similar_pixel = function(pix, pos, target_color) {
                var y = Math.floor(pos/(4*canvas.width));
                var right = pos;
                var end = (y+1) * canvas.width * 4 - 4;
                while (end > right) {
                    if (map_to_color(pix[right+4],pix[right+5],pix[right+6],pix[right+7]) === target_color)
                        right = right + 4;
                    else
                        break;
                }
                return right;
            }

            var hex_to_color = function(hex) {
                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                var r = parseInt(result[1], 16),
                    g = parseInt(result[2], 16),
                    b = parseInt(result[3], 16);

                return map_to_color(r, g, b, 255);
            }

            var map_to_color = function(r,g,b,a) {
                if (a === 0)
                    return 'white';
                else {
                    if (r===255 && g===0 && b===0)
                        return 'red';
                    if (r===0 && g===255 && b===0)
                        return 'lime';
                    if (r===0 && g===0 && b===255)
                        return 'blue';
                    if (r===255 && g===255 && b===0)
                        return 'yellow';
                    if (r===255 && g===0 && b===255)
                        return 'magenta';
                    if (r===0 && g===255 && b===255)
                        return 'cyan';
                    if (r===255 && g===165 && b===0)
                        return 'orange';
                    if (r===128 && g===0 && b===128)
                        return 'purple';
                    if (r===128 && g===128 && b===128)
                        return 'gray';
                    if (r===0 && g===0 && b===0)
                        return 'black';
                    if (r===230 && g===230 && b===250)
                        return 'lavender';
                    if (r===165 && g===42 && b===42)
                        return 'brown';
                }

                return 'white';
            }

            // text-tool
            var textarea = document.createElement('textarea');
            textarea.id = 'text_tool';
            sketch.appendChild(textarea);


            textarea.addEventListener('mouseup', function(e) {
                tmp_canvas.removeEventListener('mousemove', paint_text, false);
            }, false);

            // set the color
            textarea.addEventListener('mousedown', function(e){
                textarea.style.color = tmp_ctx.strokeStyle;
                textarea.style['font-size'] = fontSize;
            }, false);


            textarea.addEventListener('blur', function(e) {
                var lines = textarea.value.split('\n');
                var ta_comp_style = getComputedStyle(textarea);
                var fs = ta_comp_style.getPropertyValue('font-size');

                var ff = ta_comp_style.getPropertyValue('font-family');

                tmp_ctx.font = fs + ' ' + ff;
                tmp_ctx.textBaseline = 'hanging';

                for (var n = 0; n < lines.length; n++) {
                    var line = lines[n];

                    tmp_ctx.fillText(
                        line,
                        parseInt(textarea.style.left),
                        parseInt(textarea.style.top) + n*parseInt(fs)
                    );
                }

                // Writing down to real canvas now
                ctx.drawImage(tmp_canvas, 0, 0);
                textarea.style.display = 'none';
                textarea.value = '';
                // Clearing tmp canvas
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                // keep the image in the undo_canvas
                undo_canvas_top = next_undo_canvas(undo_canvas_top);
                var uctx = undo_canvas[undo_canvas_top]['uctx'];
                uctx.clearRect(0, 0, canvas.width, canvas.height);
                uctx.drawImage(canvas, 0, 0);
                undo_canvas[undo_canvas_top]['redoable'] = false;
            });

            tmp_canvas.addEventListener('mouseup', function() {
                tmp_canvas.removeEventListener('mousemove', tools_func[tool], false);

                // Writing down to real canvas now
                // text-tool is managed when textarea.blur() event
                if (tool !='text') {
                    ctx.drawImage(tmp_canvas, 0, 0);
                    // keep the image in the undo_canvas
                    undo_canvas_top = next_undo_canvas(undo_canvas_top);
                    var uctx = undo_canvas[undo_canvas_top]['uctx'];
                    uctx.clearRect(0, 0, canvas.width, canvas.height);
                    uctx.drawImage(canvas, 0, 0);
                    undo_canvas[undo_canvas_top]['redoable'] = false;
                }


                // Clearing tmp canvas
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

                // Emptying up Pencil Points
                ppts = [];
            }, false);

            var next_undo_canvas = function(top) {
                if (top === undo_canvas_len-1)
                    return 0;
                else
                    return top+1;
            }

            var prev_undo_canvas = function(top) {
                if (top === 0)
                    return undo_canvas_len-1;
                else
                    return  top-1;
            }

            // clear paint area
            $('#paint-clear').click(function(){
                ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                // keep the image in the undo_canvas
                undo_canvas_top = next_undo_canvas(undo_canvas_top);
                var uctx = undo_canvas[undo_canvas_top]['uctx'];
                uctx.clearRect(0, 0, canvas.width, canvas.height);
                uctx.drawImage(canvas, 0, 0);
                undo_canvas[undo_canvas_top]['redoable'] = false;
            });


            // Change Size
            $('#choose-size .radio-group').on('click', function(){
                var s = $('input[name=size]:checked', '#choose-size').val();
                if (s==='1') {
                    tmp_ctx.lineWidth = 1;
                    eraser_width = 5;
                    fontSize = '10px';
                }
                if (s==='2') {
                    tmp_ctx.lineWidth = 3;
                    eraser_width = 10;
                    fontSize = '14px';
                }
                if (s==='3') {
                    tmp_ctx.lineWidth = 6;
                    eraser_width = 15;
                    fontSize = '18px';
                }
                if (s==='4') {
                    tmp_ctx.lineWidth = 10;
                    eraser_width = 20;
                    fontSize = '22px';
                }
            });

            // undo-redo tools
            $('#undo-tool').on('click', function(){
                var prev = prev_undo_canvas(undo_canvas_top);
                if (!undo_canvas[prev].redoable) {
                    console.log(undo_canvas_top+' prev='+prev);
                    var ucan = undo_canvas[prev]['ucan'];
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(ucan, 0, 0);
                    undo_canvas[undo_canvas_top].redoable = true;
                    undo_canvas_top = prev;
                }
            });

            $('#redo-tool').on('click', function(){
                var next = next_undo_canvas(undo_canvas_top);
                if (undo_canvas[next].redoable) {
                    console.log(undo_canvas_top);
                    var ucan = undo_canvas[next]['ucan'];
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(ucan, 0, 0);
                    undo_canvas[next].redoable = false;
                    undo_canvas_top = next;
                }
            });
        };

        $scope.toggleRecording = function (e) {
            if ($scope.recordingStatus == 0){
                $scope.recordingStatus++;
                // start recording
                if (!audioRecorder)
                    return;
                audioRecorder.clear();
                audioRecorder.record();
                // $( "#record" ).addClass( "recording" );
                document.getElementById("record").innerText = 'Stop Recording';
            }else{
                $scope.recordingStatus++;
                // stop recording
                audioRecorder.stop();
                $( "#record" ).removeClass( "recording" );
            }
        };
		
		$scope.openAIModal = function(file, directquery = false, type = null){
			// debugger
			$scope.clearAIResponse();
			$scope.aiSelectedFile = file;
			$scope.aiDirectResponse = directquery;
			$("#aiModal").modal("show");
			if($scope.aiDirectResponse)
			{
				$complianceQ = "Check if there is any ";
				if($scope.HIPAA && $scope.GDPR && $scope.PCI)
					$complianceQ += "HIPAA, GDPR or	PCI";
				else if($scope.HIPAA && $scope.GDPR && !$scope.PCI)
					$complianceQ += "HIPAA or GDPR";
				else if($scope.HIPAA && !$scope.GDPR && $scope.PCI)
					$complianceQ += "HIPAA or PCI";
				else if(!$scope.HIPAA && $scope.GDPR && $scope.PCI)
					$complianceQ += "GDPR or PCI";
				else if($scope.HIPAA && !$scope.GDPR && !$scope.PCI)
					$complianceQ += "HIPAA";
				else if(!$scope.HIPAA && $scope.GDPR && !$scope.PCI)
					$complianceQ += "GDPR";
				else if(!$scope.HIPAA && !$scope.GDPR && $scope.PCI)
					$complianceQ += "PCI";
				$complianceQ += " compliance violation violation in this doc";
				
				if($scope.dataLeakProtection)
					$securityQ = "Check if there is any sensitive PII information or data leak in this document";
				$scope.queTA = type == "c" ? $complianceQ : $securityQ;
				$scope.getAIResponse();
			}
			
		}
		
		$scope.closeAIModal = function(){
			utilsService.stopAIRequest();
			$("#aiModal").modal("hide");
		}
		
		$scope.clearAIResponse = function(){
			$rootScope.pdfUrl = null;
			$rootScope.aiResText = null;
			$rootScope.aiGenFName = "";
			$scope.queTA = null;
		}
		
		$scope.getAIResponse = function() {
			$rootScope.isAILoad = true;
			if ($scope.selectedCloud == CLOUDS.DROP_BOX) {
                    dropboxService.getAIResponse(dropboxToken, $scope.aiSelectedFile.path_lower, $scope.queTA);
                }else if ($scope.selectedCloud == CLOUDS.GOOGLE_DRIVE) {
                    googleDriveService.getAIResponse($scope.aiSelectedFile.id, $scope.queTA);
                }else if ($scope.selectedCloud == CLOUDS.BOX_NET) {
                    boxService.downloadFile( boxDotNetToken, $scope.aiSelectedFile.id, $scope.aiSelectedFile.name, $scope.queTA);
                }else if ($scope.selectedCloud == CLOUDS.ONE_DRIVE) {
                    oneDriveService.getAIResponse(oneDriveToken, $scope.aiSelectedFile.id, $scope.aiSelectedFile.name, $scope.queTA);
                }
		}
		
		$scope.saveAIResponseFile = function() {
			$http.get($rootScope.pdfUrl, {responseType: "arraybuffer"})
				.then(function(res){
				var ext = $rootScope.pdfUrl.substring($rootScope.pdfUrl.lastIndexOf('.')) ?? ".pdf";
				var aiGenFExt= utilsService.extCatalog[ext];
				$scope.myFile = new File([res.data],$rootScope.aiGenFName + ext,{type: aiGenFExt});
				$scope.isUploadEncrypted = true;
				$scope.uploadModalEncrypted();
				$("#aiModal").modal("hide");
				swal("", $rootScope.aiGenFName + " uploaded successfully!", "success");
			}).catch(function(error){
				console.log("Error : ", error);
					$rootScope.isAILoad = false;
				var msg = error && error.detail ? JSON.stringify(error.detail) : "Something wrong while getting data from file url.";
				swal("Please try again!", msg, "error");
			});
			//$scope.myFile = new File([$rootScope.aiResBlob],$rootScope.aiGenFName,{type: $rootScope.aiGenFExt});
			//$scope.isUploadEncrypted = true;
			//$scope.uploadModalEncrypted();
			//$("#aiModal").modal("hide");
			//swal("", $rootScope.aiGenFName + " uploaded successfully!", "success");
		}
		
		$scope.openPdf = function() {
			if ($rootScope.pdfUrl) {
				window.open($rootScope.pdfUrl, '_blank');
			}
		};

        function gotStream(stream) {
            inputPoint = audioContext.createGain();

            // Create an AudioNode from the stream.
            realAudioInput = audioContext.createMediaStreamSource(stream);
            audioInput = realAudioInput;
            audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 2048;
            inputPoint.connect( analyserNode );

            audioRecorder = new Recorder( inputPoint );

            zeroGain = audioContext.createGain();
            zeroGain.gain.value = 0.0;
            inputPoint.connect( zeroGain );
            zeroGain.connect( audioContext.destination );
            updateAnalysers();
        }

        function toggleMono() {
            if (audioInput != realAudioInput) {
                audioInput.disconnect();
                realAudioInput.disconnect();
                audioInput = realAudioInput;
            } else {
                realAudioInput.disconnect();
                audioInput = convertToMono( realAudioInput );
            }

            audioInput.connect(inputPoint);
        }

        function updateAnalysers(time) {
            if (!analyserContext) {
                var canvas = document.getElementById("analyser");
                canvasWidth = canvas.width;
                canvasHeight = canvas.height;
                analyserContext = canvas.getContext('2d');
            }

            // analyzer draw code here
            {
                var SPACING = 3;
                var BAR_WIDTH = 1;
                var numBars = Math.round(canvasWidth / SPACING);
                var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

                analyserNode.getByteFrequencyData(freqByteData);

                analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
                analyserContext.fillStyle = '#F6D565';
                analyserContext.lineCap = 'round';
                var multiplier = analyserNode.frequencyBinCount / numBars;

                // Draw rectangle for each frequency bin.
                for (var i = 0; i < numBars; ++i) {
                    var magnitude = 0;
                    var offset = Math.floor( i * multiplier );
                    // gotta sum/average the block, or we miss narrow-bandwidth spikes
                    for (var j = 0; j< multiplier; j++)
                        magnitude += freqByteData[offset + j];
                    magnitude = magnitude / multiplier;
                    var magnitude2 = freqByteData[i * multiplier];
                    analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
                    analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
                }
            }

            rafID = window.requestAnimationFrame( updateAnalysers );
        }

        function convertToMono( input ) {
            var splitter = audioContext.createChannelSplitter(2);
            var merger = audioContext.createChannelMerger(2);

            input.connect( splitter );
            splitter.connect( merger, 0, 0 );
            splitter.connect( merger, 0, 1 );
            return merger;
        }


        function chooseLogo()
        {
            
            if ($scope.companyID == 25)
                $scope.logoURL = "https://mycloudfish.com/images/comp_id_25.png";

            else{
                $scope.logoURL = "images/Veekrypt-Logo.jpeg";
            }
        }


        init();
    };

    cloudsController.$inject = ['$scope', '$state', 'dropboxService', 'googleDriveService', 'boxService', 'oneDriveService', 'authService', 'utilsService', 'localServerService', 'Constants', '$location','$stateParams', '$cookies', '$http', '$timeout', '$rootScope', '$sce'];

    angular.module('authApp').controller('cloudsController', cloudsController);

}());
