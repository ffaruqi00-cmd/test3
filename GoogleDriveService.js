/**
 *  @Author xshanarain 18/06/2016
 *  Google Drive service for call the Google Drive REST API apis.
 */

(function () {

    var googleDriveService = function ($http, $rootScope, authService, utilsService, Constants, $interval) {

        var factory = {};

        factory.gBlobObj = {};
        factory.isBlobUpload = false;
        factory.folderId = '';
        factory.isRequestedFile = false;
        factory.key = '';

        factory.dowloadBlob = function (gdFId, fileName, upCloud) {
            var _path = '/drive/v2/files/' + gdFId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
                    var dlUrl = resp.downloadUrl;
                    var finalDlUrl = dlUrl.split("&gd=true");
                    var gAccessToken = gapi.auth.getToken().access_token;
                    var fName = resp.title.slice(0, -4);
                    console.log("----G111"+fName);
                    var fMimeType = resp.mimeType;

                    var res = $http({
                        method: 'GET',
                        url: dlUrl,
                        headers: {'Authorization': 'Bearer ' + gAccessToken},
                        responseType: "blob"
                    }).success(function (data, status, headers, config) {
                        if (data !== undefined) {
                            if (upCloud == 'Dropbox') {
                                $rootScope.$broadcast('uploadBlobToDropBox', {data: data});
                            } else if (upCloud == 'Box') {
                                $rootScope.$broadcast('uploadBlobToBoxDotNet', {data: data});
                            } else if (upCloud == 'OneDrive') {
                                $rootScope.$broadcast('uploadBlobToOneDrive', {data: data});
                            }
                        }
                    }).error(function (error, status, header, config) {
                        console.log("Error : ", error);
                    });
                });
            });
        };
		
		factory.base64ToBlob = function (base64, mimeType) {
			const binary = atob(base64); // Safe now
			const len = binary.length;
			const bytes = new Uint8Array(len);
			for (let i = 0; i < len; i++) {
				bytes[i] = binary.charCodeAt(i);
			}
			return new Blob([bytes], { type: mimeType });
		};
		
		
 	
		factory.createAndOpenFile =  async function (fileName, mimeType){
			// debugger;
			try {
    let blob;

    // Create valid empty file based on MIME type
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { Document, Packer, Paragraph } = docx;
      const doc = new Document({
        sections: [{
          children: [new Paragraph("")]
        }]
      });
      blob = await Packer.toBlob(doc);

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([[]]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      blob = new Blob([out], { type: mimeType });

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const pptx = new PptxGenJS();
      pptx.addSlide(); // empty slide
      blob = await pptx.write('blob');

    } else {
      alert('Unsupported MIME type.');
      return;
    }

    // Convert Blob to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const accessToken = gapi.auth.getToken()?.access_token;
    if (!accessToken) {
      alert('Google API not authenticated');
      return;
    }

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    const metadata = {
      title: fileName,
      mimeType: mimeType
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + mimeType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      base64Data +
      close_delim;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.setRequestHeader('Content-Type', 'multipart/related; boundary="' + boundary + '"');

    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 201) {
        const file = JSON.parse(xhr.responseText);
        console.log('File created:', file);
        if (file.alternateLink) {
			// debugger
          window.open(file.alternateLink, '_blank');
			if (factory.listFiles) factory.listFiles(); 
			
			// Optional refresh
        }
      } else {
        console.error('Failed to create file:', xhr.responseText);
      }
    };

    xhr.onerror = function () {
      console.error('Network error during upload.');
    };

    xhr.send(multipartRequestBody);
  } catch (err) {
    console.error('Error creating and uploading file:', err);
  }
		};
		
		factory.createAndOpenFile = function (fileName, mimeType) {
  return new Promise(function (resolve, reject) {
    let createBlobPromise;

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { Document, Packer, Paragraph } = docx;
      const doc = new Document({
        sections: [{ children: [new Paragraph("")] }]
      });
      createBlobPromise = Packer.toBlob(doc);

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      createBlobPromise = new Promise(function (res) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([out], { type: mimeType });
        res(blob);
      });

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const pptx = new PptxGenJS();
      pptx.addSlide();
      createBlobPromise = pptx.write('blob');

    } else {
      alert('Unsupported MIME type.');
      return reject('Unsupported MIME type');
    }

    createBlobPromise.then(function (blob) {
      const reader = new FileReader();
      reader.onloadend = function () {
        const base64Data = reader.result.split(',')[1];

        const accessToken = gapi.auth.getToken()?.access_token;
        if (!accessToken) {
          alert('Google API not authenticated');
          return reject('No access token');
        }

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const metadata = {
          title: fileName,
          mimeType: mimeType
        };

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + mimeType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n' +
          base64Data +
          close_delim;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.setRequestHeader('Content-Type', 'multipart/related; boundary="' + boundary + '"');

        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 201) {
            const file = JSON.parse(xhr.responseText);
            console.log('File created:', file);

            if (file.alternateLink) {
              window.open(file.alternateLink, '_blank');
            }

            if (factory.listFiles) factory.listFiles();

            resolve(file); // ✅ return file object
          } else {
            console.error('Failed to create file:', xhr.responseText);
            reject(xhr.responseText);
          }
        };

        xhr.onerror = function () {
          console.error('Network error during upload.');
          reject('Network error');
        };

        xhr.send(multipartRequestBody);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }).catch(function (err) {
      console.error('Error creating blob:', err);
      reject(err);
    });
  });
};
		
		factory.createGoogleDoc = function (docName, mimeType) {
			
			const fileMetadata = {
                title: docName,
                mimeType: mimeType
                // No 'parents' means it goes to root
            };

            const request = gapi.client.request({
                path: '/drive/v2/files',
                method: 'POST',
                body: fileMetadata
            });

            request.execute(function (file) {
                console.log('Created new doc in root:', file);
                window.open(file.alternateLink, '_blank'); // Open in new tab
                if (factory.listFiles) factory.listFiles(); // Optional refresh
            });
		};
        /*
         *  Google Drive File Download method
         * @Param : Google Drive File ID
         */
		factory.downloadFile = function (file, isFileView, folderId) {
            
        var gdFId = file.id;
        isFileView = typeof isFileView !== 'undefined' ? isFileView : null;
        console.log("isFileView:", isFileView, file, isFileView, folderId);

        var _path = '/drive/v2/files/' + gdFId;

        gapi.client.load('drive', 'v2', function () {
            var request = gapi.client.request({
                path: _path,
                method: 'GET'
            });

        request.execute(function (resp) {
            var isEncFile = false;
            var dlUrl = resp.downloadUrl;
            // debugger
            if (!dlUrl) {
                if (resp.mimeType === 'application/vnd.google-apps.document') {
                    // Export as Word (.docx)
                    dlUrl = resp.exportLinks['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                    fName = resp.title + '.docx';
                }
                else if (resp.mimeType === 'application/vnd.google-apps.spreadsheet') {
                    // Export as Word (.docx)
                    dlUrl = resp.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
                    fName = resp.title + '.xlsx';
                }
                else if (resp.mimeType === 'application/vnd.google-apps.presentation') {
                    // Export as Word (.docx)
                    dlUrl = resp.exportLinks['application/vnd.openxmlformats-officedocument.presentationml.presentation'];
                    fName = resp.title + '.pptx';
                }
                else
                {
                    console.log("No download URL available. Possibly a Google Docs-native file.");
                    return;
                }
            }

            // Google Drive viewer URL if isFileView is true
        

            // Proceed with downloading
            dlUrl = dlUrl.replace('content.google', 'www.google');
            var finalDlUrl = dlUrl.split("&gd=true");

            if (resp.fileExtension && resp.fileExtension.indexOf("$enc") > -1) {
                isEncFile = true;
            }

            var gAccessToken = gapi.auth.getToken().access_token;
            var fName = resp.title.replaceAll(".$enc", "");
            var fFullName = resp.title;
            var fMimeType = resp.mimeType;
            var fExt = utilsService.getExtention(fName);

            $http({
                method: 'GET',
                url: dlUrl,
                headers: { 'Authorization': 'Bearer ' + gAccessToken },
                responseType: "blob"
            }).success(function (data, status, headers, config) {
                if (data !== undefined) {
                    if (isEncFile) {
						// Check the flag before decrypting
						var shouldDecrypt = utilsService.getLocalStorage("decryptFilesWhileDownloading", false);

						if (shouldDecrypt) {
							utilsService
								.decryptFileObject(data, authService.activeSession.encr_key, fExt)
								.then(function (decBlob) {
								console.log('data',decBlob)

									 if (isFileView === 'FileView') {
									  //var viewerUrl = 'https://drive.google.com/open?id=' + gdFId;

										 const fileMS = new File([decBlob], fName, { type: fExt });
										 factory.uploadFile(fileMS, folderId, file);
									} else {
										 saveAs(decBlob, fName);
									}
									$rootScope.$broadcast('hideLoadingButton', { data: "Operation Done" });
								})
								.catch(function (err) {
									$rootScope.$broadcast('showErrorAlert', { data: err.message });
								});
						} else {
							// If not decrypting, just show the error message
							  // $rootScope.$broadcast('showErrorAlert', { data: "Cannot view encrypted files when auto-decryption is disabled. Please enable 'Decrypt files while downloading' from settings." });
							 // $rootScope.$broadcast('hideLoadingButton', { data: "Operation Done" });
							if (isFileView === 'FileView') {
								factory.openFileInWS(file,folderId,false,file.id);
								$rootScope.$broadcast('hideLoadingButton', { data: "Operation Done" });
							} else {
								saveAs(data, resp.title);  // data is the file content you received
								$rootScope.$broadcast('hideLoadingButton', { data: "Operation Done" });
							}
						}
                    } else {
                        if (isFileView === 'FileView') {
                            factory.openFileInWS(file,folderId,false,file.id);
                            $rootScope.$broadcast('hideLoadingButton', { data: "Operation Done" });
                        } else {
							saveAs(data, fName);  // data is the file content you received
							$rootScope.$broadcast('hideLoadingButton', { data: "Operation Done" });
                         // saveAs(decBlob, fName);
                        }
                    }
                }
            }).error(function (error, status, header, config) {
                console.log("Error:", error);
            });
        });
    });
};

		
        factory.downloadFileOLD = function (gdFId, isFileView) {
			
			    isFileView = typeof isFileView !== 'undefined' ? isFileView : null;
console.log(isFileView);
            var _path = '/drive/v2/files/' + gdFId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
                    //var dlUrl = resp.exportLinks[Object.keys(resp.exportLinks)[0]];  //this is the url extracted from the request
                    var isEncFile = false;
                    var dlUrl = resp.downloadUrl;
                    dlUrl = dlUrl.replace('content.google','www.google');
                    var finalDlUrl = dlUrl.split("&gd=true");
                    if (resp.fileExtension.indexOf("$enc") > -1) {
                            isEncFile  = true;
                    }
                    var gAccessToken = gapi.auth.getToken().access_token;
                    var fName = resp.title.slice(0, -4);
                    console.log("----G222"+fName);
                    var fFullName = resp.title;
                    var fMimeType = resp.mimeType;
                    var fExt = utilsService.getExtention(fName);
                    var res = $http({
                        method: 'GET',
                        url: dlUrl,
                        headers: {'Authorization': 'Bearer ' + gAccessToken},
                        responseType: "blob"
                    }).success(function (data, status, headers, config) {
                        if (data !== undefined) {

                            if(isEncFile){
                            utilsService
                                .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                .then(function (decBlob) {
                                    saveAs(decBlob, fName);
                                    $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                                })
                                .catch(function (err) {
                                    $rootScope.$broadcast('showErrorAlert', {data: err.message});
                                });
                            } else{
                                saveAs(data, fFullName);
                            }
                        }
                    }).error(function (error, status, header, config) {
                        console.log("Error : ", error);
                    });
                    // } else {
                    //     $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                    //     var anchor = angular.element('<a/>');
                    //     anchor.css({display: 'none'}); // Make sure it's not visible
                    //     angular.element(document.body).append(anchor); // Attach to document
                    //     anchor.attr({
                    //         href: finalDlUrl,
                    //         target: '_blank',
                    //         download: ''
                    //     })[0].click();
                    //     anchor.remove();
                    // }
                });
            });
        }
		
		factory.getAIResponse = function (gdFId, prompt) {
            var _path = '/drive/v2/files/' + gdFId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
					// debugger;
                    //var dlUrl = resp.exportLinks[Object.keys(resp.exportLinks)[0]];  //this is the url extracted from the request
                    var isEncFile = false;
                    var dlUrl = resp.downloadUrl;
                    dlUrl = dlUrl.replace('content.google','www.google');
                    var finalDlUrl = dlUrl.split("&gd=true");
                    if (resp.fileExtension.indexOf("$enc") > -1) {
                            isEncFile  = true;
                    }
                    var gAccessToken = gapi.auth.getToken().access_token;
                    var fName = resp.title.replace(".$enc", "");
                    console.log("----G222"+fName);
                    var fFullName = resp.title;
                    var fMimeType = resp.mimeType;
                    var fExt = utilsService.getExtention(fName);
                    var res = $http({
                        method: 'GET',
                        url: dlUrl,
                        headers: {'Authorization': 'Bearer ' + gAccessToken},
                        responseType: "blob"
                    }).success(function (data, status, headers, config) {
                        if (data !== undefined) {
                            if(isEncFile){
                            utilsService
                                .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                .then(function (decBlob) {
                                    utilsService.getResponseFromAIApi(decBlob,fName,fExt,prompt);
                                    $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                                })
                                .catch(function (err) {
                                    $rootScope.$broadcast('showErrorAlert', {data: err.message});
								$rootScope.isAILoad = false;
                                });
                            } else{
                                utilsService.getResponseFromAIApi(data,fName,fExt,prompt);
                            }
                        }
                    }).error(function (error, status, header, config) {
                        console.log("Error : ", error);
						$rootScope.isAILoad = false;
                    });
                });
            });
        }

        factory.uploadBlobFiles = function (blob, fileName) {
            factory.gBlobObj.blob = blob;
            factory.gBlobObj.fileName = fileName+".$enc";
            factory.isBlobUpload = true;
            factory.login();
        }

        /*
         *  Google Drive File Upload method
         * @Param : File Object
         */
        factory.uploadFile = function (fileData, folderId, oldFile) {
            console.log('uploadFile called');
            console.log('gapi available:', typeof gapi !== 'undefined');
            console.log('gapi.client available:', typeof gapi.client !== 'undefined');
            
            // Check if Google API is loaded
            if (typeof gapi === 'undefined') {
                console.error('Google API (gapi) not loaded');
                $rootScope.$broadcast('showErrorAlert', { data: 'Google Drive API not loaded. Please refresh the page and try again.' });
                return;
            }
            
            if (typeof gapi.client === 'undefined') {
                console.error('Google API client not loaded');
                $rootScope.$broadcast('showErrorAlert', { data: 'Google Drive API client not loaded. Please refresh the page and try again.' });
                return;
            }
            
            // Check if user is authenticated
            var token = gapi.auth.getToken();
            if (!token) {
                console.error('User not authenticated with Google Drive');
                $rootScope.$broadcast('showErrorAlert', { data: 'Please authenticate with Google Drive first.' });
                return;
            }
            console.log('User authenticated, token available:', !!token);
            
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            var gdFileReader = new FileReader();
            gdFileReader.addEventListener("load", function (event) {
                var contentType = fileData.type || 'application/octet-stream';
                var metadata = {
                    'title': fileData.name,
                    'mimeType': fileData.type,
                    'parents': [{'id':folderId}] //parents: [{ id: folderId }]
                };

                var base64Data = btoa(gdFileReader.result);
                var multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64Data +
                    close_delim;
				
				var path = '/upload/drive/v2/files';
				var method = 'POST';

				if (oldFile) {
					// Use PUT to update the existing file instead of creating a new one
					path = '/upload/drive/v2/files/' + oldFile.id;
					method = 'PUT';
				}
                var request = gapi.client.request({
                    'path': path,
                    'method': method,
                    'params': {'uploadType': 'multipart'},
                    'headers': {
                        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    }, 'body': multipartRequestBody
                });

                request.execute(function (file) {
                    if (file && file.error) {
                        console.error('Google Drive API error:', file.error);
                        $rootScope.$broadcast('showErrorAlert', { data: 'Failed to upload file: ' + (file.error.message || 'Unknown error') });
                        return;
                    }
                    
                    if(oldFile){
                        //factory.deleteFile(oldFile.id);
						setTimeout(() => {
							factory.openFileInWS(file, folderId, true, oldFile.id);
						}, 1000); // Wait for 4 seconds before trying to preview
                        //factory.openFileInWS(file,folderId,true, oldFile.id);
                    }else {
                        factory.listFiles();
                    }
                });

            });
            gdFileReader.readAsBinaryString(fileData);
        };
		$rootScope.openedTabs = [];
		$rootScope.inProgressArr = [];
		factory.openFileInWS = function(file, folderId, encryptFile,oldFileId){
			var gdFId = file.id;
			var viewerUrl = 'https://drive.google.com/file/d/' + gdFId + '/preview';
						switch(file.mimeType){
							case 'application/vnd.google-apps.document':
							case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
							case 'application/msword':
								viewerUrl = 'https://docs.google.com/document/d/' + gdFId + '/edit';
								break;
							case 'application/vnd.google-apps.spreadsheet':
							case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
							case 'application/vnd.ms-excel':
								viewerUrl = 'https://docs.google.com/spreadsheets/d/' + gdFId + '/edit';
								break;
							case 'application/vnd.google-apps.presentation':
							case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
							case 'application/vnd.ms-powerpoint':
								viewerUrl = 'https://docs.google.com/presentation/d/' + gdFId + '/edit';
								break;
						}
						$rootScope.inProgressArr.push(oldFileId);
    		const tab = window.open(viewerUrl, '_blank');
			$rootScope.openedTabs.push({ tab, fileId: file.id, folderId:folderId, encryptFile:encryptFile,oldFileId:oldFileId  });
		}
		
		$interval(function () {
				for (let i = $rootScope.openedTabs.length - 1; i >= 0; i--) {
					const tabEntry = $rootScope.openedTabs[i];
					if (tabEntry.tab.closed) {
						if(tabEntry.encryptFile){
							factory.onTabClosed(tabEntry.fileId, tabEntry.folderId);
						}
						$rootScope.inProgressArr = $rootScope.inProgressArr.filter(function(x){return x !== tabEntry.oldFileId});
						$rootScope.openedTabs = $rootScope.openedTabs.filter(function(x){ return !(x.fileId == tabEntry.fileId && x.folderId == tabEntry.folderId)})
					}
				}
			}, 2000); // every 2 seconds

			factory.onTabClosed = function (fileId, folderId) {
				// debugger;
				// Perform necessary action (e.g., update UI or status)
				factory.encryptDecrypt(fileId, folderId);
			};
		
        /*
         *  Google Drive File Upload method
         * @Param : File Object
         */
        factory.uploadFilesAndFolder = function (fileData, folderId) {
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            var gdFileReader = new FileReader();
            gdFileReader.addEventListener("load", function (event) {
                var contentType = fileData.type || 'application/octet-stream';
                var metadata = {
                    'title': fileData.name,
                    'mimeType': fileData.type,
                    'parents': [{'id':folderId}]
                };

                var base64Data = btoa(gdFileReader.result);
                var multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64Data +
                    close_delim;

                // Use XMLHttpRequest instead of gapi.client.request for cancellable uploads
                var xhr = new XMLHttpRequest();
                var accessToken = gapi.auth.getToken().access_token;
                
                xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                xhr.setRequestHeader('Content-Type', 'multipart/mixed; boundary="' + boundary + '"');

                // Store the xhr object for potential cancellation
                if (typeof $rootScope.ongoingUploadRequests === 'undefined') {
                    $rootScope.ongoingUploadRequests = [];
                }
                $rootScope.ongoingUploadRequests.push(xhr);

                xhr.onload = function () {
                    // Remove from ongoing requests when completed
                    var index = $rootScope.ongoingUploadRequests.indexOf(xhr);
                    if (index > -1) {
                        $rootScope.ongoingUploadRequests.splice(index, 1);
                    }

                    if (xhr.status === 200 || xhr.status === 201) {
                        var file = JSON.parse(xhr.responseText);
                        $rootScope.$broadcast('uploadedFileOfMFnF', {
                            data: file
                        });
                    } else {
                        console.error('Upload failed:', xhr.responseText);
                        $rootScope.$broadcast('showErrorAlert', { data: 'Upload failed: ' + xhr.responseText });
                    }
                };

                xhr.onerror = function () {
                    // Remove from ongoing requests when error occurs
                    var index = $rootScope.ongoingUploadRequests.indexOf(xhr);
                    if (index > -1) {
                        $rootScope.ongoingUploadRequests.splice(index, 1);
                    }
                    console.error('Network error during upload.');
                    $rootScope.$broadcast('showErrorAlert', { data: 'Network error during upload.' });
                };

                xhr.send(multipartRequestBody);
            });
            gdFileReader.readAsBinaryString(fileData);
        };

        factory.uploadFilesAndFolderEncrypted = function (fileData, folderId) {
			var gAccessToken = gapi.auth.getToken().access_token;
            utilsService
                .encyprtFileObject(fileData, authService.activeSession.encr_key)
                .then(function (blob) {
                    var gdFileReader = new FileReader();
                    gdFileReader.addEventListener("load", function (event) {
                        var base64DataOP = btoa(gdFileReader.result);
                        const boundary = '-------314159265358979323846';
                        const delimiter = "\r\n--" + boundary + "\r\n";
                        const close_delim = "\r\n--" + boundary + "--";
                        var contentType = fileData.type || 'application/octet-stream';
                        var metadata = {
                            'title': fileData.name + ".$enc",
                            'mimeType': fileData.type,
                            'parents': [{'id':folderId}]
                        };
                        var multipartRequestBody =
                            delimiter +
                            'Content-Type: application/json\r\n\r\n' +
                            JSON.stringify(metadata) +
                            delimiter +
                            'Content-Type: ' + contentType + '\r\n' +
                            'Content-Transfer-Encoding: base64\r\n' +
                            '\r\n' +
                            base64DataOP +
                            close_delim;

                        // Use XMLHttpRequest instead of gapi.client.request for cancellable uploads
                        var xhr = new XMLHttpRequest();
                        
                        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
                        xhr.setRequestHeader('Authorization', 'Bearer ' + gAccessToken);
                        xhr.setRequestHeader('Content-Type', 'multipart/mixed; boundary="' + boundary + '"');
                    
                        // Store the xhr object for potential cancellation
                        if (typeof $rootScope.ongoingUploadRequests === 'undefined') {
                            $rootScope.ongoingUploadRequests = [];
                        }
                        $rootScope.ongoingUploadRequests.push(xhr);

                        xhr.onload = function () {
                            // Remove from ongoing requests when completed
                            var index = $rootScope.ongoingUploadRequests.indexOf(xhr);
                            if (index > -1) {
                                $rootScope.ongoingUploadRequests.splice(index, 1);
                            }

                            if (xhr.status === 200 || xhr.status === 201) {
                                var file = JSON.parse(xhr.responseText);
                                $rootScope.$broadcast('uploadedFileOfMFnF', {
                                    data: file
                                });
                            } else {
                                console.error('Upload failed:', xhr.responseText);
                                $rootScope.$broadcast('showErrorAlert', { data: 'Upload failed: ' + xhr.responseText });
                            }
                        };

                        xhr.onerror = function () {
                            // Remove from ongoing requests when error occurs
                            var index = $rootScope.ongoingUploadRequests.indexOf(xhr);
                            if (index > -1) {
                                $rootScope.ongoingUploadRequests.splice(index, 1);
                            }
                            console.error('Network error during upload.');
                            $rootScope.$broadcast('showErrorAlert', { data: 'Network error during upload.' });
                        };

                        xhr.send(multipartRequestBody);
                    });
                    gdFileReader.readAsBinaryString(blob);
                })
                .catch(function (err) {
                    $rootScope.$broadcast('showErrorAlert', {data: err});
                });
        };

        /*
         *  Google Drive File Upload method (Encrypted)
         * @Param : File Object
         */
        factory.uploadFileEncrypted = function (fileData, folderId) {
            utilsService
                .encyprtFileObject(fileData, authService.activeSession.encr_key)
                .then(function (blob) {
                    var gdFileReader = new FileReader();
                    gdFileReader.addEventListener("load", function (event) {
                        var base64DataOP = btoa(gdFileReader.result);
                        const boundary = '-------314159265358979323846';
                        const delimiter = "\r\n--" + boundary + "\r\n";
                        const close_delim = "\r\n--" + boundary + "--";
                        var contentType = fileData.type || 'application/octet-stream';
                        var metadata = {
                            'title': fileData.name + ".$enc",
                            'mimeType': fileData.type,
                            'parents': [{'id':folderId}]
                        };
                        var multipartRequestBody =
                            delimiter +
                            'Content-Type: application/json\r\n\r\n' +
                            JSON.stringify(metadata) +
                            delimiter +
                            'Content-Type: ' + contentType + '\r\n' +
                            'Content-Transfer-Encoding: base64\r\n' +
                            '\r\n' +
                            base64DataOP +
                            close_delim;

                        var request = gapi.client.request({
                            'path': '/upload/drive/v2/files',
                            'method': 'POST',
                            'params': {'uploadType': 'multipart'},
                            'headers': {
                                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                            },
                            'body': multipartRequestBody
                        });

                        request.execute(function (file) {
                            factory.listFiles();
                        });

                    });
                    gdFileReader.readAsBinaryString(blob);
                })
                .catch(function (err) {
                    $rootScope.$broadcast('showErrorAlert', {data: err});
                });
        };

        /*
         *  Google Drive File Rename method
         *  @Param : File ID
         *  @Param : New file name
         *  @Param : Google Drive File Extention
         */
        factory.createFolder = function (folderName, folderId) {

            var fileMetadata = {
                'title' : folderName,
                'mimeType' : 'application/vnd.google-apps.folder',
                'parents': [{'id':folderId}]
            };

            var request = gapi.client.request({
                'path': '/drive/v2/files',
                'method': 'POST',
                'body': JSON.stringify(fileMetadata)
            });

            request.execute(function (resp) {
                factory.listFiles();
            });
        };

        factory.createRequestedFileDirFolder = function () {

            var fileMetadata = {
                'title' : 'Requested File Dir',
                'mimeType' : 'application/vnd.google-apps.folder',
                'parents': [{'id':'root'}]
            };

            var request = gapi.client.request({
                'path': '/drive/v2/files',
                'method': 'POST',
                'body': JSON.stringify(fileMetadata)
            });

            request.execute(function (resp) {
                $rootScope.$broadcast('createdRequestedFilDir', {
                    data: resp
                });
            });
        };

        /*
         *  Google Drive File Rename method
         *  @Param : File ID
         *  @Param : New file name
         *  @Param : Google Drive File Extention
         */
        factory.createFolderWithCallback = function (folderName, folderId) {

            var fileMetadata = {
                'title' : folderName,
                'mimeType' : 'application/vnd.google-apps.folder',
                'parents': [{'id':folderId}]
            };

            var request = gapi.client.request({
                'path': '/drive/v2/files',
                'method': 'POST',
                'body': JSON.stringify(fileMetadata)
            });

            request.execute(function (resp) {
                $rootScope.$broadcast('googleDriveCreatedFolder', {data: resp});
            });
        }

        /*
         *  Google Drive File Rename method
         *  @Param : File ID
         *  @Param : New file name
         *  @Param : Google Drive File Extention
         */
        factory.renameFiles = function (gdFileId, newName, fileExtention) {

            if (!utilsService.endsWith(newName, fileExtention)) {
                newName = newName + "." + fileExtention;
            }

            var body = {'title': newName};
            var request = gapi.client.drive.files.patch({
                'fileId': gdFileId,
                'resource': body
            });

            request.execute(function (resp) {
                factory.listFiles();
            });
        }

        /*
         *  Google Drive File Delete method
         * @Param : Google Drive File ID
         */
        factory.deleteFile = function (gdFId, doRefresh) {
            var request = gapi.client.drive.files.delete({
                'fileId': gdFId
            });
            request.execute(function (resp) {
                if (doRefresh == true) {
                    factory.listFiles();
                }
            });
        }

        factory.uploadBlobAndDeleteFile = function (blob, fileName, fMimeType, gdFId, folderId, isSync) {
            var gdFileReader = new FileReader();
            gdFileReader.addEventListener("load", function (event) {
                var base64DataOP = btoa(gdFileReader.result);
                const boundary = '-------314159265358979323846';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";
                var contentType = fMimeType || 'application/octet-stream';
                var metadata = {
                    'title': fileName,
                    'mimeType': contentType,
                    'parents': [{'id':folderId}]
                };
                var multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64DataOP +
                    close_delim;

                var request = gapi.client.request({
                    'path': '/upload/drive/v2/files',
                    'method': 'POST',
                    'params': {'uploadType': 'multipart'},
                    'headers': {
                        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    },
                    'body': multipartRequestBody
                });

                request.execute(function (file) {
                    if (isSync) {
                        var request = gapi.client.drive.files.delete({
                            'fileId': gdFId
                        });
                        request.execute(function (resp) {
                            $rootScope.$broadcast('encryptDecryptSynchronizedCallback', {
                                data: resp
                            });
                        });
                    } else {
                        var request = gapi.client.drive.files.delete({
                            'fileId': gdFId
                        });
                        request.execute(function (resp) {
                            factory.listFiles();
                        });
                    }
                });

            });
            gdFileReader.readAsBinaryString(blob);
        };

        factory.encryptDecrypt = function (gdFId, folderId) {
			// debugger;
            var _path = '/drive/v2/files/' + gdFId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
                    // Check if this is a folder
                    if (resp.mimeType === 'application/vnd.google-apps.folder') {
                        // Handle folder encryption/decryption
                        factory.encryptDecryptFolder(gdFId, resp.title);
                        return;
                    }
                    
                    //var dlUrl = resp.exportLinks[Object.keys(resp.exportLinks)[0]];  //this is the url extracted from the request
					// debugger
                    var dlUrl = resp.downloadUrl;
					if (!dlUrl && resp.exportLinks) {
						// Pick a suitable export format based on the file type
						if (resp.mimeType === 'application/vnd.google-apps.spreadsheet') {
							dlUrl = resp.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; // .xlsx
						} else if (resp.mimeType === 'application/vnd.google-apps.document') {
							dlUrl = resp.exportLinks['application/vnd.openxmlformats-officedocument.wordprocessingml.document']; // .docx
						} else {
							console.error("Unsupported Google-native format:", resp.mimeType);
							return;
						}
					}
                    var finalDlUrl = dlUrl.split("&gd=true");

                    var gAccessToken = gapi.auth.getToken().access_token;
                    var fName = resp.title;
                    var fMimeType = resp.mimeType;
                    var fExt = utilsService.getExtention(fName.replace(".$enc", ""));

                    var res = $http({
                        method: 'GET',
                        url: dlUrl,
                        // url: "https://www.googleapis.com/drive/v3/files/"+resp.id+"?alt=media",
                        headers: {'Authorization': 'Bearer ' + gAccessToken},
                        responseType: "blob"
                    }).success(function (data, status, headers, config) {
                        if (data !== undefined) {
                            //if (resp.fileExtension.indexOf(".$enc") > -1) {
							if (fName.indexOf(".$enc") > -1) {
                                var cFName = fName.replace(".$enc", "");
                                utilsService
                                    .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, gdFId, folderId, false);
                                    })
                                    .catch(function () {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            } else {
                                var cFName = fName + ".$enc";
                                utilsService
                                    .encyprtFileObject(data, authService.activeSession.encr_key)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, gdFId, folderId, false);
                                    })
                                    .catch(function () {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            }
                        }
                    }).error(function (error, status, header, config) {
                        console.log("Error : ", error);
                    });
                });
            });
        };

        // Helper function to list files in a specific folder
        factory.listFilesInFolder = function(folderId, callback) {
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.drive.files.list({
                    'maxResults': 1000,
                    'q': "'" + folderId + "' in parents and trashed=false"
                });
                
                request.execute(function (resp) {
                    if (resp && resp.error) {
                        console.error('Error listing files in folder:', resp.error);
                        $rootScope.$broadcast('showErrorAlert', { data: 'Failed to list files in folder: ' + (resp.error.message || 'Unknown error') });
                        return;
                    }
                    
                    if (callback && typeof callback === 'function') {
                        callback(resp.items || []);
                    }
                });
            });
        };

        // Function to recursively encrypt/decrypt all files in a folder
        factory.encryptDecryptFolder = function(folderId, folderName) {
            console.log('Starting folder encryption/decryption for:', folderName);
            
            factory.listFilesInFolder(folderId, function(files) {
                if (!files || files.length === 0) {
                    console.log('No files found in folder:', folderName);
                    $rootScope.$broadcast('showErrorAlert', { data: 'No files found in folder: ' + folderName });
                    return;
                }
                
                console.log('Found', files.length, 'files in folder:', folderName);
                
                // Process each file in the folder
                var processedCount = 0;
                var totalFiles = files.length;
                var errorCount = 0;
                
                files.forEach(function(file) {
                    // Skip subfolders for now (can be extended later if needed)
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                        console.log('Skipping subfolder:', file.title);
                        processedCount++;
                        return;
                    }
                    
                    // Process the file
                    factory.encryptDecryptFileInFolder(file, folderId, function(success) {
                        processedCount++;
                        if (!success) {
                            errorCount++;
                        }
                        console.log('Processed', processedCount, 'of', totalFiles, 'files');
                        
                        if (processedCount === totalFiles) {
                            console.log('Completed folder encryption/decryption for:', folderName);
                            if (errorCount === 0) {
                                $rootScope.$broadcast('showSuccessAlert', { data: 'Successfully processed ' + totalFiles + ' files in folder: ' + folderName });
                            } else {
                                $rootScope.$broadcast('showErrorAlert', { data: 'Completed processing ' + totalFiles + ' files in folder: ' + folderName + ' with ' + errorCount + ' errors' });
                            }
                        }
                    });
                });
            });
        };

        // Helper function to encrypt/decrypt a single file within a folder
        factory.encryptDecryptFileInFolder = function(file, parentFolderId, callback) {
            var dlUrl = file.downloadUrl;
            if (!dlUrl && file.exportLinks) {
                // Pick a suitable export format based on the file type
                if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
                    dlUrl = file.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; // .xlsx
                } else if (file.mimeType === 'application/vnd.google-apps.document') {
                    dlUrl = file.exportLinks['application/vnd.openxmlformats-officedocument.wordprocessingml.document']; // .docx
                } else {
                    console.error("Unsupported Google-native format:", file.mimeType);
                    if (callback) callback(false);
                    return;
                }
            }
            
            if (!dlUrl) {
                console.error("No download URL available for file:", file.title);
                if (callback) callback(false);
                return;
            }

            var gAccessToken = gapi.auth.getToken().access_token;
            var fName = file.title;
            var fMimeType = file.mimeType;
            var fExt = utilsService.getExtention(fName.replace(".$enc", ""));

            var res = $http({
                method: 'GET',
                url: dlUrl,
                headers: {'Authorization': 'Bearer ' + gAccessToken},
                responseType: "blob"
            }).success(function (data, status, headers, config) {
                if (data !== undefined) {
                    if (fName.indexOf(".$enc") > -1) {
                        var cFName = fName.replace(".$enc", "");
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, file.id, parentFolderId, false);
                                if (callback) callback(true);
                            })
                            .catch(function (err) {
                                console.error('Error decrypting file:', fName, err);
                                $rootScope.$broadcast('showErrorAlert', {data: 'Error decrypting file: ' + fName});
                                if (callback) callback(false);
                            });
                    } else {
                        var cFName = fName + ".$enc";
                        utilsService
                            .encyprtFileObject(data, authService.activeSession.encr_key)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, file.id, parentFolderId, false);
                                if (callback) callback(true);
                            })
                            .catch(function (err) {
                                console.error('Error encrypting file:', fName, err);
                                $rootScope.$broadcast('showErrorAlert', {data: 'Error encrypting file: ' + fName});
                                if (callback) callback(false);
                            });
                    }
                } else {
                    if (callback) callback(false);
                }
            }).error(function (error, status, header, config) {
                console.error("Error downloading file:", fName, error);
                if (callback) callback(false);
            });
        };
		
         factory.decryptAndGetShareURL = function (gdFId, folderId) {
            var _path = '/drive/v2/files/' + gdFId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
                    //var dlUrl = resp.exportLinks[Object.keys(resp.exportLinks)[0]];  //this is the url extracted from the request
                    var dlUrl = resp.downloadUrl;
                    var finalDlUrl = dlUrl.split("&gd=true");

                    var gAccessToken = gapi.auth.getToken().access_token;
                    var fName = resp.title;
                    var fMimeType = resp.mimeType;
                    var fExt = utilsService.getExtention(fName.replace(".$enc", ""));
                    var res = $http({
                        method: 'GET',
                        url: dlUrl,
                        // url: "https://www.googleapis.com/drive/v3/files/"+resp.id+"?alt=media",
                        headers: { 'Authorization': 'Bearer ' + gAccessToken },
                        responseType: "blob"
                    }).success(function (data, status, headers, config) {
                        if (data !== undefined) {
                            utilsService
                                .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                .then(function (blob) {
                                    var gdFileReader = new FileReader();
                                    gdFileReader.addEventListener("load", function (event) {
                                        var base64DataOP = btoa(gdFileReader.result);
                                        const boundary = '-------314159265358979323846';
                                        const delimiter = "\r\n--" + boundary + "\r\n";
                                        const close_delim = "\r\n--" + boundary + "--";
                                        var contentType = fMimeType || 'application/octet-stream';
                                        var cFName = fName.replace(".$enc", "");
                                        var metadata = {
                                            'title': cFName,
                                            'mimeType': fMimeType,
                                            'parents': [{ 'id': folderId }]
                                            // [{'id': typeof folderId !== 'undefined' ? folderId : 'root'}]
                                        };
                                        var multipartRequestBody =
                                            delimiter +
                                            'Content-Type: application/json\r\n\r\n' +
                                            JSON.stringify(metadata) +
                                            delimiter +
                                            'Content-Type: ' + contentType + '\r\n' +
                                            'Content-Transfer-Encoding: base64\r\n' +
                                            '\r\n' +
                                            base64DataOP +
                                            close_delim;

                                        var request = gapi.client.request({
                                            'path': '/upload/drive/v2/files',
                                            'method': 'POST',
                                            'params': { 'uploadType': 'multipart' },
                                            'headers': {
                                                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                                            },
                                            'body': multipartRequestBody
                                        });

                                        request.execute(function (file) {
                                            var body = {
                                                'value': '',
                                                'type': 'anyone',
                                                'role': 'reader',
                                                'withLink': true
                                            };
                                            var request = gapi.client.drive.permissions.insert({
                                                'fileId': file.id,
                                                'resource': body
                                            });
                                            request.execute(function (resp) {
                                                $rootScope.$broadcast('googleDriveShareViewEmailFileLink', {data: resp});
                                            });
                                        });

                                    });
                                    gdFileReader.readAsBinaryString(blob);
                                })
                                .catch(function (err) {
                                    $rootScope.$broadcast('showErrorAlert', { data: err });
                                });
                        }
                    }).error(function (error, status, header, config) {
                        console.log("Error : ", error);
                    });
                });
            });
        };
		
		 /**
         * Decrypts an encrypted file from Google Drive, uploads the decrypted file to a 'Shared' folder,
         * and broadcasts an event with the shareable link for email sharing.
         * @param {string} gdFId - The Google Drive file ID of the encrypted file.
         */
        factory.decryptAndShareToSharedFolder = function (gdFId) {
            // Helper to find or create the 'Shared' folder
            function getOrCreateSharedFolder(callback) {
                var request = gapi.client.drive.files.list({
                    'q': "mimeType='application/vnd.google-apps.folder' and trashed=false and title='Shared' and 'root' in parents"
                });
                request.execute(function (resp) {
                    if (resp.items && resp.items.length > 0) {
                        callback(resp.items[0].id);
                    } else {
                        var fileMetadata = {
                            'title': 'Shared',
                            'mimeType': 'application/vnd.google-apps.folder',
                            'parents': [{ 'id': 'root' }]
                        };
                        var createRequest = gapi.client.request({
                            'path': '/drive/v2/files',
                            'method': 'POST',
                            'body': JSON.stringify(fileMetadata)
                        });
                        createRequest.execute(function (folder) {
                            callback(folder.id);
                        });
                    }
                });
            }

            getOrCreateSharedFolder(function(sharedFolderId) {
                var _path = '/drive/v2/files/' + gdFId;
                gapi.client.load('drive', 'v2', function () {
                    var request = gapi.client.request({
                        path: _path,
                        method: 'GET'
                    });
                    request.execute(function (resp) {
                        var dlUrl = resp.downloadUrl;
                        var gAccessToken = gapi.auth.getToken().access_token;
                        var fName = resp.title;
                        var fMimeType = resp.mimeType;
                        var fExt = utilsService.getExtention(fName.replace(".$enc", ""));
                        var res = $http({
                            method: 'GET',
                            url: dlUrl,
                            headers: { 'Authorization': 'Bearer ' + gAccessToken },
                            responseType: "blob"
                        }).success(function (data, status, headers, config) {
                            if (data !== undefined) {
                                utilsService
                                    .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                    .then(function (blob) {
                                        var gdFileReader = new FileReader();
                                        gdFileReader.addEventListener("load", function (event) {
                                            var base64DataOP = btoa(gdFileReader.result);
                                            const boundary = '-------314159265358979323846';
                                            const delimiter = "\r\n--" + boundary + "\r\n";
                                            const close_delim = "\r\n--" + boundary + "--";
                                            var contentType = fMimeType || 'application/octet-stream';
                                            var cFName = fName.replace(".$enc", "");
                                            var metadata = {
                                                'title': cFName,
                                                'mimeType': fMimeType,
                                                'parents': [{ 'id': sharedFolderId }]
                                            };
                                            var multipartRequestBody =
                                                delimiter +
                                                'Content-Type: application/json\r\n\r\n' +
                                                JSON.stringify(metadata) +
                                                delimiter +
                                                'Content-Type: ' + contentType + '\r\n' +
                                                'Content-Transfer-Encoding: base64\r\n' +
                                                '\r\n' +
                                                base64DataOP +
                                                close_delim;

                                            var uploadRequest = gapi.client.request({
                                                'path': '/upload/drive/v2/files',
                                                'method': 'POST',
                                                'params': { 'uploadType': 'multipart' },
                                                'headers': {
                                                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                                                },
                                                'body': multipartRequestBody
                                            });

                                            uploadRequest.execute(function (file) {
                                                var body = {
                                                    'value': '',
                                                    'type': 'anyone',
                                                    'role': 'reader',
                                                    'withLink': true
                                                };
                                                var permRequest = gapi.client.drive.permissions.insert({
                                                    'fileId': file.id,
                                                    'resource': body
                                                });
                                                permRequest.execute(function (resp) {
													// Construct the shareable link for the new file
													var shareUrl = 'https://drive.google.com/file/d/' + file.id + '/view?usp=sharing';
													$rootScope.$broadcast('googleDriveShareFileLinkViaEmail', {
														data: {
															fileId: file.id,
															shareUrl: shareUrl,
															fileName: file.title // or file.name
														}
													});
                                                });
                                            });

                                        });
                                        gdFileReader.readAsBinaryString(blob);
                                    })
                                    .catch(function (err) {
                                        $rootScope.$broadcast('showErrorAlert', { data: err });
                                    });
                            }
                        }).error(function (error, status, header, config) {
                            console.log("Error : ", error);
                        });
                    });
                });
            });
        };
		
        factory.encryptDecryptSynchronized = function (gdFId, folderId) {
            var _path = '/drive/v2/files/' + gdFId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
                    // Check if this is a folder
                    if (resp.mimeType === 'application/vnd.google-apps.folder') {
                        // Handle folder encryption/decryption with synchronized callback
                        factory.encryptDecryptFolderSynchronized(gdFId, resp.title);
                        return;
                    }
                    
                    //var dlUrl = resp.exportLinks[Object.keys(resp.exportLinks)[0]];  //this is the url extracted from the request
                    var dlUrl = resp.downloadUrl;
                    var finalDlUrl = dlUrl.split("&gd=true");

                    var gAccessToken = gapi.auth.getToken().access_token;
                    var fName = resp.title;
                    var fMimeType = resp.mimeType;
                    var fExt = utilsService.getExtention(fName.replace(".$enc", ""));
                    var res = $http({
                        method: 'GET',
                        url: dlUrl,
                        // url: "https://www.googleapis.com/drive/v3/files/"+resp.id+"?alt=media",
                        headers: {'Authorization': 'Bearer ' + gAccessToken},
                        responseType: "blob"
                    }).success(function (data, status, headers, config) {
                        if (data !== undefined) {
                            if (fName.indexOf(".$enc") > -1) {
                                var cFName = fName.replace(".$enc", "");
                                utilsService
                                    .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, gdFId, folderId, true);
                                    })
                                    .catch(function () {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            } else {
                                var cFName = fName + ".$enc";
                                utilsService
                                    .encyprtFileObject(data, authService.activeSession.encr_key)
                                    .then(function (blob) {
                                        factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, gdFId, folderId, true);
                                    })
                                    .catch(function () {
                                        $rootScope.$broadcast('showErrorAlert', {data: err});
                                    });
                            }
                        }
                    }).error(function (error, status, header, config) {
                        console.log("Error : ", error);
                    });
                });
            });
        };

        // Function to recursively encrypt/decrypt all files in a folder with synchronized callback
        factory.encryptDecryptFolderSynchronized = function(folderId, folderName) {
            console.log('Starting synchronized folder encryption/decryption for:', folderName);
            
            factory.listFilesInFolder(folderId, function(files) {
                if (!files || files.length === 0) {
                    console.log('No files found in folder:', folderName);
                    $rootScope.$broadcast('encryptDecryptSynchronizedCallback', {
                        data: {
                            success: false,
                            message: 'No files found in folder: ' + folderName
                        }
                    });
                    return;
                }
                
                console.log('Found', files.length, 'files in folder:', folderName);
                
                // Process each file in the folder
                var processedCount = 0;
                var totalFiles = files.length;
                var successCount = 0;
                var errorCount = 0;
                
                files.forEach(function(file) {
                    // Skip subfolders for now (can be extended later if needed)
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                        console.log('Skipping subfolder:', file.title);
                        processedCount++;
                        return;
                    }
                    
                    // Process the file
                    factory.encryptDecryptFileInFolderSynchronized(file, folderId, function(success) {
                        processedCount++;
                        if (success) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                        
                        console.log('Processed', processedCount, 'of', totalFiles, 'files');
                        
                        if (processedCount === totalFiles) {
                            console.log('Completed synchronized folder encryption/decryption for:', folderName);
                            if (errorCount === 0) {
                                $rootScope.$broadcast('showSuccessAlert', { data: 'Successfully processed ' + totalFiles + ' files in folder: ' + folderName });
                            } else {
                                $rootScope.$broadcast('showErrorAlert', { data: 'Completed processing ' + totalFiles + ' files in folder: ' + folderName + ' with ' + errorCount + ' errors' });
                            }
                            $rootScope.$broadcast('encryptDecryptSynchronizedCallback', {
                                data: {
                                    success: errorCount === 0,
                                    message: 'Processed ' + totalFiles + ' files in folder: ' + folderName + 
                                             ' (Success: ' + successCount + ', Errors: ' + errorCount + ')'
                                }
                            });
                        }
                    });
                });
            });
        };

        // Helper function to encrypt/decrypt a single file within a folder (synchronized version)
        factory.encryptDecryptFileInFolderSynchronized = function(file, parentFolderId, callback) {
            var dlUrl = file.downloadUrl;
            if (!dlUrl && file.exportLinks) {
                // Pick a suitable export format based on the file type
                if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
                    dlUrl = file.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; // .xlsx
                } else if (file.mimeType === 'application/vnd.google-apps.document') {
                    dlUrl = file.exportLinks['application/vnd.openxmlformats-officedocument.wordprocessingml.document']; // .docx
                } else {
                    console.error("Unsupported Google-native format:", file.mimeType);
                    if (callback) callback(false);
                    return;
                }
            }
            
            if (!dlUrl) {
                console.error("No download URL available for file:", file.title);
                if (callback) callback(false);
                return;
            }

            var gAccessToken = gapi.auth.getToken().access_token;
            var fName = file.title;
            var fMimeType = file.mimeType;
            var fExt = utilsService.getExtention(fName.replace(".$enc", ""));

            var res = $http({
                method: 'GET',
                url: dlUrl,
                headers: {'Authorization': 'Bearer ' + gAccessToken},
                responseType: "blob"
            }).success(function (data, status, headers, config) {
                if (data !== undefined) {
                    if (fName.indexOf(".$enc") > -1) {
                        var cFName = fName.replace(".$enc", "");
                        utilsService
                            .decryptFileObject(data, authService.activeSession.encr_key, fExt)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, file.id, parentFolderId, true);
                                if (callback) callback(true);
                            })
                            .catch(function (err) {
                                console.error('Error decrypting file:', fName, err);
                                if (callback) callback(false);
                            });
                    } else {
                        var cFName = fName + ".$enc";
                        utilsService
                            .encyprtFileObject(data, authService.activeSession.encr_key)
                            .then(function (blob) {
                                factory.uploadBlobAndDeleteFile(blob, cFName, fMimeType, file.id, parentFolderId, true);
                                if (callback) callback(true);
                            })
                            .catch(function (err) {
                                console.error('Error encrypting file:', fName, err);
                                if (callback) callback(false);
                            });
                    }
                } else {
                    if (callback) callback(false);
                }
            }).error(function (error, status, header, config) {
                console.error("Error downloading file:", fName, error);
                if (callback) callback(false);
            });
        };


        /*
         *  Google Drive File Delete method
         * @Param : Google Drive File ID
         */
        factory.shareFile = function (gdFId) {
            var body = {
                'value': '',
                'type': 'anyone',
                'role': 'reader',
                'withLink':true
            };
            var request = gapi.client.drive.permissions.insert({
                'fileId': gdFId,
                'resource': body
            });
            request.execute(function (resp) {
                $rootScope.$broadcast('googleDriveShareFileListener', {data: resp});
            });
        }

        factory.shareFileAddMembers = function (gdFId, emailAddresses) {
            var emails = emailAddresses.replace(",", ";").split(";");
            emails.forEach(function (email) {
                var request = gapi.client.drive.permissions.insert({
                    'fileId': gdFId,
                    'resource': {
                        'type': 'user',
                        'role': 'writer',
                        'value': email.trim()
                    },
                    'fields': 'id'
                });
                request.execute(function (resp) {
                    console.log(resp);
                });
            });
        };

        factory.getListOfSharedMembers = function (gdFId, callback) {
            var request = gapi.client.drive.permissions.list({
                'fileId': gdFId
            });
            request.execute(function(resp) {
                callback(resp.items);
            });
        };

        factory.removeMemberFromSharedFile = function (gdFId, permissionId) {
            var request = gapi.client.drive.permissions.delete({
                'fileId': gdFId,
                'permissionId': permissionId
            });
            request.execute(function(resp) { console.log(JSON.stringify(resp)) });
        };

        /*
         *  Google Drive File Delete method
         * @Param : Google Drive File ID
         */
        factory.advanceShareFile = function (gdFId) {
            var body = {
                'value': '',
                'type': 'anyone',
                'role': 'reader',
                'withLink':true
            };
            var request = gapi.client.drive.permissions.insert({
                'fileId': gdFId,
                'resource': body
            });
            request.execute(function (resp) {
                $rootScope.$broadcast('googleDriveAdvanceShareFileListener', {data: resp});
            });
        }

        factory.advanceFileShare = function( fileId, fileName, username, sharerEmailAddress,
                                            sharerName, shareFrom, shareTo, notifyMe, canDownload, message){
            var _path = '/drive/v2/files/' + fileId;
            gapi.client.load('drive', 'v2', function () {
                var request = gapi.client.request({
                    path: _path,
                    method: 'GET'
                });
                request.execute(function (resp) {
                    var dlUrl = resp.downloadUrl;
                    var gAccessToken = gapi.auth.getToken().access_token;
                    var _token = 'Bearer '+gAccessToken;
                    var res = $http ({
                        method: 'POST',
                        url: Constants.PHP_LIBS_URL + "app/libs/advanceShare.php",
                        data: $.param({
                            token: _token,
                            dURL: dlUrl,
                            fileName: fileName,
                            filePath: fileId,
                            cloudName: 'googledrive',
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
                });
            });
        };


        /*
         *  Google Drive File Login method and callbacks
         */
        factory.login = function () {
            var token = gapi.auth.getToken();
            if (token) {
                // factory.loadDriveApi();
                if (factory.isBlobUpload == true) {
                    factory.loadDriveApi();
                } else
                    factory.listFiles();
            } else {
                var SCOPES = [Constants.GD_SCOPES];
			console.log('-------MS', SCOPES)
                gapi.auth.authorize({
                    'client_id': Constants.GD_CLIENT_ID,
                    'scope': SCOPES,
                    'immediate': false
                }, factory.handleAuthResult);
            }
        };

        factory.handleAuthResult = function (authResult) {
            var authorizeDiv = document.getElementById('authorize-div');
            if (authResult && !authResult.error) {
                utilsService.saveGoogleAuthObject("loggedIn");
                factory.loadDriveApi();
            } else {
                console.log("GD error", authResult.error);
            }
        };
		
		factory.uploadDocBlob = function (blob, fileName, mimeType, folderId) {
			// debugger;
			const boundary = '-------314159265358979323846';
			const delimiter = "\r\n--" + boundary + "\r\n";
			const close_delim = "\r\n--" + boundary + "--";

			const metadata = {
				title: fileName,
				mimeType: mimeType,
				parents: folderId ? [{ id: folderId }] : []
			};

			function arrayBufferToBase64(buffer) {
				let binary = '';
				const bytes = new Uint8Array(buffer);
				const len = bytes.byteLength;
				for (let i = 0; i < len; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				return btoa(binary);
			}

			const reader = new FileReader();
			reader.readAsArrayBuffer(blob);
			reader.onload = function (e) {
				const base64Data = arrayBufferToBase64(e.target.result);

				const multipartRequestBody =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(metadata) +
					delimiter +
					'Content-Type: ' + mimeType + '\r\n' +
					'Content-Transfer-Encoding: base64\r\n' +
					'\r\n' +
					base64Data +
					close_delim;

				const request = gapi.client.request({
					path: '/upload/drive/v2/files', // or v3 if you upgrade
					method: 'POST',
					params: { uploadType: 'multipart' },
					headers: {
						'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
					},
					body: multipartRequestBody
				});

				request.execute(function (file) {
					// debugger;
					if (file && !file.error) {
						console.log('Uploaded encrypted file:', file);
						if (factory.listFiles) factory.listFiles();
						//$rootScope.$broadcast('showSuccessToast', { data: "Encrypted file created successfully." });
					} else {
						console.error('Upload error:', file.error);
						//$rootScope.$broadcast('showErrorAlert', { data: file.error.message });
					}
				});
			};
		};
        factory.uploadRTBlobFiles = function(blob, fileName,folderId){
            gapi.client.load('drive', 'v2', function () {
                var fName = fileName;
                var fMimeType = utilsService.getExtention(fName);

                fr = new FileReader();
                fr.onload = function () {
                    var base64DataOP = fr.result.split("base64,")[1];
                    const boundary = '-------314159265358979323846';
                    const delimiter = "\r\n--" + boundary + "\r\n";
                    const close_delim = "\r\n--" + boundary + "--";

                    var contentType = fMimeType;
                    var metadata = {
                        'title': fileName,
                        'mimeType': fMimeType,
                        'parents': [{'id':folderId}]
                    };

                    var multipartRequestBody =
                        delimiter +
                        'Content-Type: application/json\r\n\r\n' +
                        JSON.stringify(metadata) +
                        delimiter +
                        'Content-Type: ' + contentType + '\r\n' +
                        'Content-Transfer-Encoding: base64\r\n' +
                        '\r\n' +
                        base64DataOP +
                        close_delim;

                    var request = gapi.client.request({
                        'path': '/upload/drive/v2/files',
                        'method': 'POST',
                        'params': {'uploadType': 'multipart'},
                        'headers': {
                            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                        },
                        'body': multipartRequestBody
                    });

                    request.execute(function (file) {
                        $rootScope.$broadcast('rtFileUploadedNowShare', {data: file});
                        factory.listFiles();
                    });
                };
                fr.readAsDataURL(blob);
            });
        };

        factory.loadDriveApi = function () {
            if (factory.isBlobUpload == false) {
                gapi.client.load('drive', 'v2', factory.listFiles);
            } else {
                factory.isBlobUpload = false;
                gapi.client.load('drive', 'v2', function () {
                    var fileName = factory.gBlobObj.fileName;
                    var blob = factory.gBlobObj.blob;
                    var fName = fileName;
                    if (fileName.indexOf(".$enc") > -1) {
                        fName = fileName.slice(0, -5);
                    }
                    var fMimeType = utilsService.getExtention(fName);

                    fr = new FileReader();
                    fr.onload = function () {
                        var base64DataOP = fr.result.split("base64,")[1];
                        const boundary = '-------314159265358979323846';
                        const delimiter = "\r\n--" + boundary + "\r\n";
                        const close_delim = "\r\n--" + boundary + "--";

                        var contentType = fMimeType;
                        var metadata = {
                            'title': fileName,
                            'mimeType': fMimeType,
                            'parents': [{'id': factory.folderId}]
                        };

                        var multipartRequestBody =
                            delimiter +
                            'Content-Type: application/json\r\n\r\n' +
                            JSON.stringify(metadata) +
                            delimiter +
                            'Content-Type: ' + contentType + '\r\n' +
                            'Content-Transfer-Encoding: base64\r\n' +
                            '\r\n' +
                            base64DataOP +
                            close_delim;

                        var request = gapi.client.request({
                            'path': '/upload/drive/v2/files',
                            'method': 'POST',
                            'params': {'uploadType': 'multipart'},
                            'headers': {
                                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                            },
                            'body': multipartRequestBody
                        });

                        request.execute(function (file) {
                            factory.gBlobObj = {};
                            $rootScope.$broadcast('hideLoadingButton', {data: "Operation Done"});
                            if(factory.isRequestedFile) {
                                factory.isRequestedFile = false;
                                utilsService.updateRequestedFilePushStatus(factory.key)
                                    .then(function (success) {
                                        toastr.success('A new file requested by you has been ' +
                                            'loaded to your Google Drive account',
                                            'Plase refresh!');
                                    }, function (error) {
                                        console.error(error);
                                    });
                            }
                        });
                    };
                    fr.readAsDataURL(blob);
                });
            }
        };

        factory.downloadFileFromCloudFish = function (fileName, folderId, key) {
            var dFUrl = Constants.PHP_LIBS_URL + 'app/libs/downloadLocalFile.php?fileName=' + fileName;
            fetch(dFUrl).then(function (res) {
                return res.blob();
            }).then(function (blob) {
                factory.isRequestedFile = true;
                factory.folderId = folderId;
                factory.uploadBlobFiles(blob, fileName);
                factory.key = key;
            }).catch(function(err) {
                return err;
            });
        };

        factory.syncRequestedFileFolder = function () {
            utilsService.getAllRequestFiles()
                .then(function (success) {
                    if (success.data) {
                        var files = JSON.parse(success.data);
                        files.filter(function (obj) {
                            return obj.req_cloud === 'GoogleDrive'
                        }).forEach(function (obj) {
                            factory.downloadFileFromCloudFish(obj.fileNmae, obj.parent_path, obj.file_key)
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

        /*
         *  Google Drive Fetch List metadata
         */
        factory.listFiles = function () {
            console.log('listFiles called');
            console.log('gapi available:', typeof gapi !== 'undefined');
            console.log('gapi.client available:', typeof gapi.client !== 'undefined');
            console.log('gapi.client.drive available:', typeof gapi.client.drive !== 'undefined');
            
            // Check if Google Drive API is loaded
            if (typeof gapi === 'undefined') {
                console.error('Google API (gapi) not loaded');
                $rootScope.$broadcast('showErrorAlert', { data: 'Google Drive API not loaded. Please refresh the page and try again.' });
                return;
            }
            
            if (typeof gapi.client === 'undefined') {
                console.error('Google API client not loaded');
                return;
            }
            
            if (typeof gapi.client.drive === 'undefined') {
                console.error('Google Drive API not loaded, attempting to load it...');
                gapi.client.load('drive', 'v2', function() {
                    console.log('Google Drive API loaded successfully, retrying listFiles');
                    factory.listFiles();
                }).catch(function(error) {
                    console.error('Failed to load Google Drive API:', error);
                    $rootScope.$broadcast('showErrorAlert', { data: 'Failed to load Google Drive API. Please refresh the page and try again.' });
                });
                return;
            }
            
            // Check if user is authenticated
            var token = gapi.auth.getToken();
            if (!token) {
                console.error('User not authenticated with Google Drive');
                $rootScope.$broadcast('showErrorAlert', { data: 'Please authenticate with Google Drive first.' });
                return;
            }
            
            var fileList = [];
            factory.isRequestedFile = false;
            factory.folderId = '';
            factory.key = '';
            var request = gapi.client.drive.files.list({
                'maxResults':4000,
                'orderBy': "modifiedDate",
                'q': "'me' in owners and trashed=false"
                // ,'folderId': "0ByR0k_ECdOxkeDFENFBLVjVDbnM"
            });

            request.execute(function (resp) {
                if (resp && resp.error) {
                    console.error('Google Drive API error:', resp.error);
                    $rootScope.$broadcast('showErrorAlert', { data: 'Failed to list files: ' + (resp.error.message || 'Unknown error') });
                    return;
                }
                
                setTimeout(function () {
                    factory.syncRequestedFileFolder();
                },1000);
                $rootScope.$broadcast('updateGDListView', {
                    data: resp
                });
            });
        };


        return factory;
    };

    googleDriveService.$inject = ['$http', '$rootScope', 'authService', 'utilsService', 'Constants', '$interval'];

    angular.module('authApp').factory('googleDriveService', googleDriveService);

}());
