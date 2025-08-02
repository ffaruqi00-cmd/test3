/**
 *  @Author xshanarain 18/06/2016
 *  Utils Methods for Support
 */

(function() {

    var utilsService = function($http, $rootScope, $sce, $cookies, $q) {
		console.log('utilsService loaded');

        var factory = {};

        factory.extCatalog = {};

        factory.endsWith = function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };

        factory.saveAppAuthObject = function(data) {
            $cookies.putObject("localAppAuthObject", data);
        };

        factory.getAppAuthObject = function() {
            return $cookies.getObject("localAppAuthObject");
        }

        factory.removeAppAuthObject = function() {
            $cookies.remove("localAppAuthObject");
        }

        factory.updateTrunOFEncryptionWithServer = function (turnOfEncryption) {
            if (turnOfEncryption == 1) {
                factory.setLocalStorage("isDE", false);
            }
            factory.setLocalStorage("turnOfEncryption", turnOfEncryption == 1);
        };
        
        factory.updateCloudVisibilityWithServer = function (clouds) {
            factory.setLocalStorage("isDB", clouds.charAt(0));
            factory.setLocalStorage("isGD", clouds.charAt(1));
            factory.setLocalStorage("isBN", clouds.charAt(2));
            factory.setLocalStorage("isOD", clouds.charAt(3));
            factory.setLocalStorage("isMCD", clouds.charAt(4));
        }

        factory.postAudit = function (fileOperation, fileName, filePath, cloud ) {
            setTimeout(function () {
                var userId = $cookies.get("cUsername");
                var now = new Date();
                var auditId = now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() +
                    now.getMinutes() + now.getSeconds() + now.getMilliseconds();
                var timeStamp = now.toISOString();
                var res = $http({
                    method: 'POST',
                    url: 'https://mycloudfish.com/device_tracking/index.php/api/user/addAuditHistory/format/json/',
                    data: $.param({
                        audit_id: auditId,
                        user_id: userId,
                        time_stamp: timeStamp,
                        device_type: 'WEB',
                        device_id_or_ip_address: clientIP,
                        operation_type: fileOperation,
                        file_path: fileName,
                        file_name: filePath,
                        file_system: cloud
                    }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).success(function(data, status, header, config) {
                    console.log(data);
                    return data;
                }).error(function(err, status, header, config) {
                    return err;
                });
                return res;
            }, 500)
        };

        factory.saveGoogleAuthObject = function(data) {
            $cookies.putObject("googleDriveAuthSession", data);
        };

        factory.getGoogleAuthObject = function() {
            return $cookies.getObject("googleDriveAuthSession");
        }

        factory.removeGoogleAuthObject = function() {
            $cookies.remove("googleDriveAuthSession");
        }

        factory.updateSelectedCloud = function(cloud) {
            $cookies.remove("currentSelectedCloud");
            $cookies.put("currentSelectedCloud", cloud);
        }

        factory.getSelectedCloud = function() {
            return $cookies.get("currentSelectedCloud") !== undefined ? $cookies.get("currentSelectedCloud") : '';
        }

        factory.saveDropBoxToken = function(token) {
            $cookies.put("dropboxToken", token);
        }

        factory.getDropBoxToken = function() {
            return $cookies.get("dropboxToken");
        }

        factory.removeDropBoxToken = function () {
            $cookies.remove("dropboxToken");
        };

        factory.saveBoxDotNetToken = function(token) {
            var expiresInSeconds = 3600;
            var expiration = new Date();
            expiration.setTime(expiration.getTime() + expiresInSeconds * 1000);
            $cookies.put("boxDotNetToken", token, {
                'expires': expiration
            });
        }

        factory.getBoxDotNetToken = function() {
            return $cookies.get("boxDotNetToken");
        }

        factory.removeBoxNetToken = function () {
            $cookies.remove("boxDotNetToken");
        };

        factory.saveOneDriveToken = function(token) {
            var expiresInSeconds = 3600;
            var expiration = new Date();
            expiration.setTime(expiration.getTime() + expiresInSeconds * 1000);
            $cookies.put("oneDriveToken", token, {
                'expires': expiration
            });

            var exp = new Date().getTime() + expiresInSeconds * 1000;
            $cookies.put("oneDriveTokenExpiration", exp);
        }

        factory.getOneDriveToken = function() {
            var exp = parseInt($cookies.get("oneDriveTokenExpiration"));
            var cur = new Date().getTime();
            if (cur > exp) {
							console.log("exp : ", exp);
							console.log("cur : ", cur);
              $cookies.remove("oneDriveToken");
            }
            return $cookies.get("oneDriveToken");
        }

        factory.removeOneDriveToken = function () {
            $cookies.remove("oneDriveToken");
        };

        factory.setJustLoggedIn = function() {
            $cookies.put("justLoggedIn", false);
        }

        factory.isJustLoggedIn = function() {
            return $cookies.get("justLoggedIn");
        }

        factory.getLocalServer1URL = function() {
            if ($cookies.get("cUsername") === 'styagi@ifuturecorporation.com')
                return 'localhost:2080';
            return $cookies.get("localServer1URL");
        }

        factory.getLoggedInUsername = function() {
            return $cookies.get("cUsername");
        }

        factory.setODRootFolderID = function(odCFID) {
            if ($cookies.get("oneDriveRootFolderID") == undefined) {
                $cookies.put("oneDriveRootFolderID", odCFID);
            }
        }

        factory.getODRootFolderID = function() {
            return $cookies.get("oneDriveRootFolderID");
        }

        factory.setLocalStorage = function(item, value) {
            if (value == true) {
                localStorage.setItem(item, "true");
            } else {
                localStorage.setItem(item, "false");
            }
        }

        factory.getLocalStorage = function(item, defaultValue = true) {
            var val = localStorage.getItem(item);
            if (!val || 0 === val.length) {
                return defaultValue;
            } else {
                if (val == "true") {
                    return true;
                } else {
                    return false;
                }
            }
        }

        factory.removeSession = function() {
            $cookies.remove("dropboxToken");
            $cookies.remove("appToken");
            $cookies.remove("localAppAuthObject");
            $cookies.remove("currentSelectedCloud");
            $cookies.remove("boxDotNetToken");
            $cookies.remove("oneDriveToken");
            $cookies.remove("googleDriveAuthSession");
            $cookies.remove("justLoggedIn");
            $cookies.remove("oneDriveRootFolderID");
            $cookies.remove("cUsername");
            $cookies.remove("localServer1URL");
        }

        factory.getURLParameterValue = function(name, url) {
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        };

        factory.extractURL = function(content) {
			console.log('this is content' + content);
            geturl = new RegExp(
                "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))", "g"
            );
            return content.match(geturl)[0].substr(1);
        };

        factory.createCORSRequest = function(method, url) {
            var xhr = new XMLHttpRequest();
            if ("withCredentials" in xhr) {
                // XHR for Chrome/Firefox/Opera/Safari.
                xhr.open(method, url, true);
            } else if (typeof XDomainRequest != "undefined") {
                // XDomainRequest for IE.
                xhr = new XDomainRequest();
                xhr.open(method, url);
            } else {
                // CORS not supported.
                xhr = null;
            }
            return xhr;
        };

        factory.b64toBlob = function(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {
                type: contentType
            });
            return blob;
        };

        factory.getObjectIndex = function(obj, list) {
            var i;
            for (i = 0; i < list.length; i++) {
                if (list[i] === obj) {
                    return i;
                }
            }
            return -1;
        };

        factory.loadExtention = function(exts, mime_type_string) {
            if (exts.indexOf(',') > -1) {
                exts.split(',').forEach(function(ext) {
                    ext = ext.trim();
                    factory.extCatalog[ext] = mime_type_string;
                    if (factory.extCatalog[ext] !== mime_type_string) {
                        result = false;
                    }
                });
            } else {
                factory.extCatalog[exts] = mime_type_string;
            }
        };

        factory.getExtention = function(fname) {
            var ext = 'UTF-8';
            if (fname.lastIndexOf('.') > 0) {
                ext = fname.substr(fname.lastIndexOf('.')).toLowerCase();
            } else {
                ext = fname;
            }
            if (ext === "") {
                ext = fname;
            }
            return factory.extCatalog[ext];
        };
		
		factory.getExtFromMimeType = function(type){
			for(let tp in factory.extCatalog){
			if(factory.extCatalog[tp] == type){
				return tp;
			}
			}
			return null;
		};

        factory.sendEmail = function(emailStr, subjectStr, contentStr) {
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/sendEmail/format/json/',
                data: $.param({
                    emails: emailStr,
                    subject: subjectStr,
                    content: contentStr
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        };

        factory.sendFileReques = function (username, encKey, accepter_name, email_address,
                                           comment, req_cloud, parent_path) {
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/add_file_request/format/json/',
                data: $.param({
                    username: username,
                    encKey: encKey,
                    accepter_name: accepter_name,
                    email_address: email_address,
                    comment: comment,
                    req_cloud: req_cloud,
                    parent_path: parent_path
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        };

        factory.getAllRequestFiles = function() {
            var uName = $cookies.get("cUsername");
            var _url = 'https://mycloudfish.com/device_tracking/index.php/api/user/getUploadedFiles/'+
            'format/json/?username='+uName;
            console.log("---debug---"+_url);
            var res = $http({
                method: 'GET',
                url: _url,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function(data, status, header, config) {
                console.log("---1111---"+data);
                return data;
            }).error(function(err, status, header, config) {
                console.log("---333---");
                console.log(err);
                return err;
            });
            return res;
        };

        factory.downloadFileFromCloudFish = function (fileName) {
            var dFUrl = 'https://mycloudfish.com/RequestedFileDir/'+fileName;
            console.log(dFUrl);
            var res = $http({
                method: 'GET',
                url: dFUrl,
                responseType :  "blob"
            }).success(function(data, status, headers, config) {
                return data;
            }).error(function(error, status, header, config) {
                console.log("Error : ", error);
            });
        };

        factory.downloadSharedFile = function (fileName, key, source) {
            var dFUrl = 'https://mycloudfish.com/app/libs/downloadShareFile.php?fileName=' + fileName
                + "&fileKey=" + key + "&fileSource=" + source;
            fetch(dFUrl).then(function (res) {
                return res.blob();
            }).catch(function(err) {
                return err;
            });
            /*
            .then(function (blob) {
                return blob;
            })
            */
        };

        factory.getUserKey = function (username) {
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/user_enc_key/format/json/',
                data: $.param({
                    username: username
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        };

        factory.getSharedFileDetails = function (username, fileName, fileKey, fileSource) {
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/share_file_details/format/json/',
                data: $.param({
                    username: username,
                    fileName: fileName,
                    fileKey: fileKey,
                    fileSource: fileSource
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        };

        factory.sendViewFileNotification = function (username, fileName, fileKey, fileSource, sName, sEmail, action) {
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/send_view_file_notification/format/json/',
                data: $.param({
                    username: username,
                    fileName: fileName,
                    fileKey: fileKey,
                    fileSource: fileSource,
                    sName: sName,
                    sEmail: sEmail,
                    action: action
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        };

        factory.updateRequestedFilePushStatus = function ( fileKey) {
            console.log("RD555");
            var username = $cookies.get("cUsername");
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/update_pushed_file_status/format/json/',
                data: $.param({
                    username: username,
                    fileKey: fileKey
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                console.log("RD666");
                return data;
            }).error(function(err, status, header, config) {
                console.log("RD777");
                return err;
            });
            return res;
        };

        factory.sendEmails = function(emailArrayStr, subjectStr, contentStr, fileName) {
            var res = $http({
                method: 'POST',
                url: 'https://mycloudfish.com/device_tracking/index.php/api/user/sendEmailsToArray/format/json/',
                data: $.param({
                    emails: emailArrayStr,
                    subject: subjectStr,
                    content: contentStr,
                    fileName:fileName
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status, header, config) {
                return data;
            }).error(function(err, status, header, config) {
                return err;
            });
            return res;
        };

        factory.binaryStringToBuffer = function(binstr) {
            var buf;
            if ('undefined' !== typeof Uint8Array) {
                buf = new Uint8Array(binstr.length);
            } else {
                buf = [];
            }
            Array.prototype.forEach.call(binstr, function (ch, i) {
                buf[i] = ch.charCodeAt(0);
            });
            return buf;
        };

        factory.encyprtFileObject = function(fileObj, encKey){
            return new Promise(function(resolve, reject){
                var keyBuf = factory.binaryStringToBuffer(encKey);
                var reader = new FileReader();
                reader.onload = function(e) {
                    var data = e.target.result;
                    var ivLen = (128 / 8);
                    var iv = new Uint8Array(ivLen);
                    crypto
                        .subtle
                        .importKey('raw', keyBuf, { 'name': 'AES-CBC' }, true, ['encrypt', 'decrypt'])
                        .then((key) => {
                        var algo = key.algorithm;
                    algo.iv = iv;
                    return crypto.subtle.encrypt(algo, key, data);
                })
                .then(encrypted => {
                        var blob = new Blob([new Uint8Array(encrypted)], {type: 'data:application/octet-stream'});
                    resolve(blob);
                })
                .catch((err) => reject(err));
                }
                reader.readAsArrayBuffer(fileObj);
            });
        };

        factory.decryptFileObject = function (fileObj, encKey, extention) {
            return new Promise(function(resolve, reject){
                var keyBuf = factory.binaryStringToBuffer(encKey);
                var reader = new FileReader();
                reader.onload = function(e) {
                    var data = e.target.result;
                    var ivLen = (128 / 8);
                    var iv = new Uint8Array(ivLen);
                    crypto
                        .subtle
                        .importKey('raw', keyBuf, { 'name': 'AES-CBC' }, true, ['encrypt', 'decrypt'])
                        .then((key) => {
                        var algo = key.algorithm;
                    algo.iv = iv;
                    return crypto.subtle.decrypt(algo, key, data);
                })
                .then(decrypted => {
                        var blob = new Blob([new Uint8Array(decrypted)], {type: extention});
                    resolve(blob);
                })
                .catch((err) => reject(err));
                }
                reader.readAsArrayBuffer(fileObj);
            });
        };

        factory.bytesToSize = function (bytes) {
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes == 0) return '0 Byte';
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        };

        factory.formatDateTime = function (dateTime) {
            var date = new Date(dateTime);
            var year = "" + date.getFullYear();
            var month = "" + (date.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
            var day = "" + date.getDate(); if (day.length == 1) { day = "0" + day; }
            var strDate = month+'/'+day+"/"+year;
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strDate + ' ' + strTime;
        };

        factory.loadExtention(".ez", "application/andrew-inset");
        factory.loadExtention(".aw", "application/applixware");
        factory.loadExtention(".atom", "application/atom+xml");
        factory.loadExtention(".atomcat", "application/atomcat+xml");
        factory.loadExtention(".atomsvc", "application/atomsvc+xml");
        factory.loadExtention(".ccxml", "application/ccxml+xml");
        factory.loadExtention(".cu", "application/cu-seeme");
        factory.loadExtention(".davmount", "application/davmount+xml");
        factory.loadExtention(".ecma", "application/ecmascript");
        factory.loadExtention(".emma", "application/emma+xml");
        factory.loadExtention(".epub", "application/epub+zip");
        factory.loadExtention(".pfr", "application/font-tdpfr");
        factory.loadExtention(".stk", "application/hyperstudio");
        factory.loadExtention(".jar", "application/java-archive");
        factory.loadExtention(".ser", "application/java-serialized-object");
        factory.loadExtention(".class", "application/java-vm");
        factory.loadExtention(".js", "application/javascript");
        factory.loadExtention(".json", "application/json");
        factory.loadExtention(".lostxml", "application/lost+xml");
        factory.loadExtention(".hqx", "application/mac-binhex40");
        factory.loadExtention(".cpt", "application/mac-compactpro");
        factory.loadExtention(".mrc", "application/marc");
        factory.loadExtention(".ma,.nb,.mb", "application/mathematica");
        factory.loadExtention(".mathml", "application/mathml+xml");
        factory.loadExtention(".mbox", "application/mbox");
        factory.loadExtention(".mscml", "application/mediaservercontrol+xml");
        factory.loadExtention(".mp4s", "application/mp4");
        factory.loadExtention(".doc,.dot", "application/msword");
        factory.loadExtention(".mxf", "application/mxf");
        factory.loadExtention(".oda", "application/oda");
        factory.loadExtention(".opf", "application/oebps-package+xml");
        factory.loadExtention(".ogx", "application/ogg");
        factory.loadExtention(".onetoc,.onetoc2,.onetmp,.onepkg", "application/onenote");
        factory.loadExtention(".xer", "application/patch-ops-error+xml");
        factory.loadExtention(".pdf", "application/pdf");
        factory.loadExtention(".pgp", "application/pgp-encrypted");
        factory.loadExtention(".asc,.sig", "application/pgp-signature");
        factory.loadExtention(".prf", "application/pics-rules");
        factory.loadExtention(".p10", "application/pkcs10");
        factory.loadExtention(".p7m,.p7c", "application/pkcs7-mime");
        factory.loadExtention(".p7s", "application/pkcs7-signature");
        factory.loadExtention(".cer", "application/pkix-cert");
        factory.loadExtention(".crl", "application/pkix-crl");
        factory.loadExtention(".pkipath", "application/pkix-pkipath");
        factory.loadExtention(".pki", "application/pkixcmp");
        factory.loadExtention(".pls", "application/pls+xml");
        factory.loadExtention(".ai,.eps,.ps", "application/postscript");
        factory.loadExtention(".cww", "application/prs.cww");
        factory.loadExtention(".rdf", "application/rdf+xml");
        factory.loadExtention(".rif", "application/reginfo+xml");
        factory.loadExtention(".rnc", "application/relax-ng-compact-syntax");
        factory.loadExtention(".rl", "application/resource-lists+xml");
        factory.loadExtention(".rld", "application/resource-lists-diff+xml");
        factory.loadExtention(".rs", "application/rls-services+xml");
        factory.loadExtention(".rsd", "application/rsd+xml");
        factory.loadExtention(".rss", "application/rss+xml");
        factory.loadExtention(".rtf", "application/rtf");
        factory.loadExtention(".sbml", "application/sbml+xml");
        factory.loadExtention(".scq", "application/scvp-cv-request");
        factory.loadExtention(".scs", "application/scvp-cv-response");
        factory.loadExtention(".spq", "application/scvp-vp-request");
        factory.loadExtention(".spp", "application/scvp-vp-response");
        factory.loadExtention(".sdp", "application/sdp");
        factory.loadExtention(".setpay", "application/set-payment-initiation");
        factory.loadExtention(".setreg", "application/set-registration-initiation");
        factory.loadExtention(".shf", "application/shf+xml");
        factory.loadExtention(".smi,.smil", "application/smil+xml");
        factory.loadExtention(".rq", "application/sparql-query");
        factory.loadExtention(".srx", "application/sparql-results+xml");
        factory.loadExtention(".gram", "application/srgs");
        factory.loadExtention(".grxml", "application/srgs+xml");
        factory.loadExtention(".ssml", "application/ssml+xml");
        factory.loadExtention(".plb", "application/vnd.3gpp.pic-bw-large");
        factory.loadExtention(".psb", "application/vnd.3gpp.pic-bw-small");
        factory.loadExtention(".pvb", "application/vnd.3gpp.pic-bw-var");
        factory.loadExtention(".tcap", "application/vnd.3gpp2.tcap");
        factory.loadExtention(".pwn", "application/vnd.3m.post-it-notes");
        factory.loadExtention(".aso", "application/vnd.accpac.simply.aso");
        factory.loadExtention(".imp", "application/vnd.accpac.simply.imp");
        factory.loadExtention(".acu", "application/vnd.acucobol");
        factory.loadExtention(".atc,.acutc", "application/vnd.acucorp");
        factory.loadExtention(".air", "application/vnd.adobe.air-application-installer-package+zip");
        factory.loadExtention(".xdp", "application/vnd.adobe.xdp+xml");
        factory.loadExtention(".xfdf", "application/vnd.adobe.xfdf");
        factory.loadExtention(".azf", "application/vnd.airzip.filesecure.azf");
        factory.loadExtention(".azs", "application/vnd.airzip.filesecure.azs");
        factory.loadExtention(".azw", "application/vnd.amazon.ebook");
        factory.loadExtention(".acc", "application/vnd.americandynamics.acc");
        factory.loadExtention(".ami", "application/vnd.amiga.ami");
        factory.loadExtention(".apk", "application/vnd.android.package-archive");
        factory.loadExtention(".cii", "application/vnd.anser-web-certificate-issue-initiation");
        factory.loadExtention(".fti", "application/vnd.anser-web-funds-transfer-initiation");
        factory.loadExtention(".atx", "application/vnd.antix.game-component");
        factory.loadExtention(".mpkg", "application/vnd.apple.installer+xml");
        factory.loadExtention(".swi", "application/vnd.arastra.swi");
        factory.loadExtention(".aep", "application/vnd.audiograph");
        factory.loadExtention(".mpm", "application/vnd.blueice.multipass");
        factory.loadExtention(".bmi", "application/vnd.bmi");
        factory.loadExtention(".rep", "application/vnd.businessobjects");
        factory.loadExtention(".cdxml", "application/vnd.chemdraw+xml");
        factory.loadExtention(".mmd", "application/vnd.chipnuts.karaoke-mmd");
        factory.loadExtention(".cdy", "application/vnd.cinderella");
        factory.loadExtention(".cla", "application/vnd.claymore");
        factory.loadExtention(".c4g,.c4d,.c4f,.c4p,.c4u", "application/vnd.clonk.c4group");
        factory.loadExtention(".csp", "application/vnd.commonspace");
        factory.loadExtention(".cdbcmsg", "application/vnd.contact.cmsg");
        factory.loadExtention(".cmc", "application/vnd.cosmocaller");
        factory.loadExtention(".clkx", "application/vnd.crick.clicker");
        factory.loadExtention(".clkk", "application/vnd.crick.clicker.keyboard");
        factory.loadExtention(".clkp", "application/vnd.crick.clicker.palette");
        factory.loadExtention(".clkt", "application/vnd.crick.clicker.template");
        factory.loadExtention(".clkw", "application/vnd.crick.clicker.wordbank");
        factory.loadExtention(".wbs", "application/vnd.criticaltools.wbs+xml");
        factory.loadExtention(".pml", "application/vnd.ctc-posml");
        factory.loadExtention(".ppd", "application/vnd.cups-ppd");
        factory.loadExtention(".car", "application/vnd.curl.car");
        factory.loadExtention(".pcurl", "application/vnd.curl.pcurl");
        factory.loadExtention(".rdz", "application/vnd.data-vision.rdz");
        factory.loadExtention(".fe_launch", "application/vnd.denovo.fcselayout-link");
        factory.loadExtention(".dna", "application/vnd.dna");
        factory.loadExtention(".mlp", "application/vnd.dolby.mlp");
        factory.loadExtention(".dpg", "application/vnd.dpgraph");
        factory.loadExtention(".dfac", "application/vnd.dreamfactory");
        factory.loadExtention(".geo", "application/vnd.dynageo");
        factory.loadExtention(".mag", "application/vnd.ecowin.chart");
        factory.loadExtention(".nml", "application/vnd.enliven");
        factory.loadExtention(".esf", "application/vnd.epson.esf");
        factory.loadExtention(".msf", "application/vnd.epson.msf");
        factory.loadExtention(".qam", "application/vnd.epson.quickanime");
        factory.loadExtention(".slt", "application/vnd.epson.salt");
        factory.loadExtention(".ssf", "application/vnd.epson.ssf");
        factory.loadExtention(".es3,.et3", "application/vnd.eszigno3+xml");
        factory.loadExtention(".ez2", "application/vnd.ezpix-album");
        factory.loadExtention(".ez3", "application/vnd.ezpix-package");
        factory.loadExtention(".fdf", "application/vnd.fdf");
        factory.loadExtention(".mseed", "application/vnd.fdsn.mseed");
        factory.loadExtention(".seed,.dataless", "application/vnd.fdsn.seed");
        factory.loadExtention(".gph", "application/vnd.flographit");
        factory.loadExtention(".ftc", "application/vnd.fluxtime.clip");
        factory.loadExtention(".fm,.frame,.maker,.book", "application/vnd.framemaker");
        factory.loadExtention(".fnc", "application/vnd.frogans.fnc");
        factory.loadExtention(".ltf", "application/vnd.frogans.ltf");
        factory.loadExtention(".fsc", "application/vnd.fsc.weblaunch");
        factory.loadExtention(".oas", "application/vnd.fujitsu.oasys");
        factory.loadExtention(".oa2", "application/vnd.fujitsu.oasys2");
        factory.loadExtention(".oa3", "application/vnd.fujitsu.oasys3");
        factory.loadExtention(".fg5", "application/vnd.fujitsu.oasysgp");
        factory.loadExtention(".bh2", "application/vnd.fujitsu.oasysprs");
        factory.loadExtention(".ddd", "application/vnd.fujixerox.ddd");
        factory.loadExtention(".xdw", "application/vnd.fujixerox.docuworks");
        factory.loadExtention(".xbd", "application/vnd.fujixerox.docuworks.binder");
        factory.loadExtention(".fzs", "application/vnd.fuzzysheet");
        factory.loadExtention(".txd", "application/vnd.genomatix.tuxedo");
        factory.loadExtention(".ggb", "application/vnd.geogebra.file");
        factory.loadExtention(".ggt", "application/vnd.geogebra.tool");
        factory.loadExtention(".gex,.gre", "application/vnd.geometry-explorer");
        factory.loadExtention(".gmx", "application/vnd.gmx");
        factory.loadExtention(".kml", "application/vnd.google-earth.kml+xml");
        factory.loadExtention(".kmz", "application/vnd.google-earth.kmz");
        factory.loadExtention(".gqf,.gqs", "application/vnd.grafeq");
        factory.loadExtention(".gac", "application/vnd.groove-account");
        factory.loadExtention(".ghf", "application/vnd.groove-help");
        factory.loadExtention(".gim", "application/vnd.groove-identity-message");
        factory.loadExtention(".grv", "application/vnd.groove-injector");
        factory.loadExtention(".gtm", "application/vnd.groove-tool-message");
        factory.loadExtention(".tpl", "application/vnd.groove-tool-template");
        factory.loadExtention(".vcg", "application/vnd.groove-vcard");
        factory.loadExtention(".zmm", "application/vnd.handheld-entertainment+xml");
        factory.loadExtention(".hbci", "application/vnd.hbci");
        factory.loadExtention(".les", "application/vnd.hhe.lesson-player");
        factory.loadExtention(".hpgl", "application/vnd.hp-hpgl");
        factory.loadExtention(".hpid", "application/vnd.hp-hpid");
        factory.loadExtention(".hps", "application/vnd.hp-hps");
        factory.loadExtention(".jlt", "application/vnd.hp-jlyt");
        factory.loadExtention(".pcl", "application/vnd.hp-pcl");
        factory.loadExtention(".pclxl", "application/vnd.hp-pclxl");
        factory.loadExtention(".sfd-hdstx", "application/vnd.hydrostatix.sof-data");
        factory.loadExtention(".x3d", "application/vnd.hzn-3d-crossword");
        factory.loadExtention(".mpy", "application/vnd.ibm.minipay");
        factory.loadExtention(".afp,.listafp,.list3820", "application/vnd.ibm.modcap");
        factory.loadExtention(".irm", "application/vnd.ibm.rights-management");
        factory.loadExtention(".sc", "application/vnd.ibm.secure-container");
        factory.loadExtention(".icc,.icm", "application/vnd.iccprofile");
        factory.loadExtention(".igl", "application/vnd.igloader");
        factory.loadExtention(".ivp", "application/vnd.immervision-ivp");
        factory.loadExtention(".ivu", "application/vnd.immervision-ivu");
        factory.loadExtention(".xpw,.xpx", "application/vnd.intercon.formnet");
        factory.loadExtention(".qbo", "application/vnd.intu.qbo");
        factory.loadExtention(".qfx", "application/vnd.intu.qfx");
        factory.loadExtention(".rcprofile", "application/vnd.ipunplugged.rcprofile");
        factory.loadExtention(".irp", "application/vnd.irepository.package+xml");
        factory.loadExtention(".xpr", "application/vnd.is-xpr");
        factory.loadExtention(".jam", "application/vnd.jam");
        factory.loadExtention(".rms", "application/vnd.jcp.javame.midlet-rms");
        factory.loadExtention(".jisp", "application/vnd.jisp");
        factory.loadExtention(".joda", "application/vnd.joost.joda-archive");
        factory.loadExtention(".ktz,.ktr", "application/vnd.kahootz");
        factory.loadExtention(".karbon", "application/vnd.kde.karbon");
        factory.loadExtention(".chrt", "application/vnd.kde.kchart");
        factory.loadExtention(".kfo", "application/vnd.kde.kformula");
        factory.loadExtention(".flw", "application/vnd.kde.kivio");
        factory.loadExtention(".kon", "application/vnd.kde.kontour");
        factory.loadExtention(".kpr,.kpt", "application/vnd.kde.kpresenter");
        factory.loadExtention(".ksp", "application/vnd.kde.kspread");
        factory.loadExtention(".kwd,.kwt", "application/vnd.kde.kword");
        factory.loadExtention(".htke", "application/vnd.kenameaapp");
        factory.loadExtention(".kia", "application/vnd.kidspiration");
        factory.loadExtention(".kne,.knp", "application/vnd.kinar");
        factory.loadExtention(".skp,.skd,.skt,.skm", "application/vnd.koan");
        factory.loadExtention(".sse", "application/vnd.kodak-descriptor");
        factory.loadExtention(".lbd", "application/vnd.llamagraphics.life-balance.desktop");
        factory.loadExtention(".lbe", "application/vnd.llamagraphics.life-balance.exchange+xml");
        factory.loadExtention(".123", "application/vnd.lotus-1-2-3");
        factory.loadExtention(".apr", "application/vnd.lotus-approach");
        factory.loadExtention(".pre", "application/vnd.lotus-freelance");
        factory.loadExtention(".nsf", "application/vnd.lotus-notes");
        factory.loadExtention(".org", "application/vnd.lotus-organizer");
        factory.loadExtention(".scm", "application/vnd.lotus-screencam");
        factory.loadExtention(".lwp", "application/vnd.lotus-wordpro");
        factory.loadExtention(".portpkg", "application/vnd.macports.portpkg");
        factory.loadExtention(".mcd", "application/vnd.mcd");
        factory.loadExtention(".mc1", "application/vnd.medcalcdata");
        factory.loadExtention(".cdkey", "application/vnd.mediastation.cdkey");
        factory.loadExtention(".mwf", "application/vnd.mfer");
        factory.loadExtention(".mfm", "application/vnd.mfmp");
        factory.loadExtention(".flo", "application/vnd.micrografx.flo");
        factory.loadExtention(".igx", "application/vnd.micrografx.igx");
        factory.loadExtention(".mif", "application/vnd.mif");
        factory.loadExtention(".daf", "application/vnd.mobius.daf");
        factory.loadExtention(".dis", "application/vnd.mobius.dis");
        factory.loadExtention(".mbk", "application/vnd.mobius.mbk");
        factory.loadExtention(".mqy", "application/vnd.mobius.mqy");
        factory.loadExtention(".msl", "application/vnd.mobius.msl");
        factory.loadExtention(".plc", "application/vnd.mobius.plc");
        factory.loadExtention(".txf", "application/vnd.mobius.txf");
        factory.loadExtention(".mpn", "application/vnd.mophun.application");
        factory.loadExtention(".mpc", "application/vnd.mophun.certificate");
        factory.loadExtention(".xul", "application/vnd.mozilla.xul+xml");
        factory.loadExtention(".cil", "application/vnd.ms-artgalry");
        factory.loadExtention(".cab", "application/vnd.ms-cab-compressed");
        factory.loadExtention(".xls,.xlm,.xla,.xlc,.xlt,.xlw", "application/vnd.ms-excel");
        factory.loadExtention(".xlam", "application/vnd.ms-excel.addin.macroenabled.12");
        factory.loadExtention(".xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12");
        factory.loadExtention(".xlsm", "application/vnd.ms-excel.sheet.macroenabled.12");
        factory.loadExtention(".xltm", "application/vnd.ms-excel.template.macroenabled.12");
        factory.loadExtention(".eot", "application/vnd.ms-fontobject");
        factory.loadExtention(".chm", "application/vnd.ms-htmlhelp");
        factory.loadExtention(".ims", "application/vnd.ms-ims");
        factory.loadExtention(".lrm", "application/vnd.ms-lrm");
        factory.loadExtention(".cat", "application/vnd.ms-pki.seccat");
        factory.loadExtention(".stl", "application/vnd.ms-pki.stl");
        factory.loadExtention(".ppt,.pps,.pot", "application/vnd.ms-powerpoint");
        factory.loadExtention(".ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12");
        factory.loadExtention(".pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12");
        factory.loadExtention(".sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12");
        factory.loadExtention(".ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12");
        factory.loadExtention(".potm", "application/vnd.ms-powerpoint.template.macroenabled.12");
        factory.loadExtention(".mpp,.mpt", "application/vnd.ms-project");
        factory.loadExtention(".docm", "application/vnd.ms-word.document.macroenabled.12");
        factory.loadExtention(".dotm", "application/vnd.ms-word.template.macroenabled.12");
        factory.loadExtention(".wps,.wks,.wcm,.wdb", "application/vnd.ms-works");
        factory.loadExtention(".wpl", "application/vnd.ms-wpl");
        factory.loadExtention(".xps", "application/vnd.ms-xpsdocument");
        factory.loadExtention(".mseq", "application/vnd.mseq");
        factory.loadExtention(".mus", "application/vnd.musician");
        factory.loadExtention(".msty", "application/vnd.muvee.style");
        factory.loadExtention(".nlu", "application/vnd.neurolanguage.nlu");
        factory.loadExtention(".nnd", "application/vnd.noblenet-directory");
        factory.loadExtention(".nns", "application/vnd.noblenet-sealer");
        factory.loadExtention(".nnw", "application/vnd.noblenet-web");
        factory.loadExtention(".ngdat", "application/vnd.nokia.n-gage.data");
        factory.loadExtention(".n-gage", "application/vnd.nokia.n-gage.symbian.install");
        factory.loadExtention(".rpst", "application/vnd.nokia.radio-preset");
        factory.loadExtention(".rpss", "application/vnd.nokia.radio-presets");
        factory.loadExtention(".edm", "application/vnd.novadigm.edm");
        factory.loadExtention(".edx", "application/vnd.novadigm.edx");
        factory.loadExtention(".ext", "application/vnd.novadigm.ext");
        factory.loadExtention(".odc", "application/vnd.oasis.opendocument.chart");
        factory.loadExtention(".otc", "application/vnd.oasis.opendocument.chart-template");
        factory.loadExtention(".odb", "application/vnd.oasis.opendocument.database");
        factory.loadExtention(".odf", "application/vnd.oasis.opendocument.formula");
        factory.loadExtention(".odft", "application/vnd.oasis.opendocument.formula-template");
        factory.loadExtention(".odg", "application/vnd.oasis.opendocument.graphics");
        factory.loadExtention(".otg", "application/vnd.oasis.opendocument.graphics-template");
        factory.loadExtention(".odi", "application/vnd.oasis.opendocument.image");
        factory.loadExtention(".oti", "application/vnd.oasis.opendocument.image-template");
        factory.loadExtention(".odp", "application/vnd.oasis.opendocument.presentation");
        factory.loadExtention(".ods", "application/vnd.oasis.opendocument.spreadsheet");
        factory.loadExtention(".ots", "application/vnd.oasis.opendocument.spreadsheet-template");
        factory.loadExtention(".odt", "application/vnd.oasis.opendocument.text");
        factory.loadExtention(".otm", "application/vnd.oasis.opendocument.text-master");
        factory.loadExtention(".ott", "application/vnd.oasis.opendocument.text-template");
        factory.loadExtention(".oth", "application/vnd.oasis.opendocument.text-web");
        factory.loadExtention(".xo", "application/vnd.olpc-sugar");
        factory.loadExtention(".dd2", "application/vnd.oma.dd2+xml");
        factory.loadExtention(".oxt", "application/vnd.openofficeorg.extension");
        factory.loadExtention(".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
        factory.loadExtention(".sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide");
        factory.loadExtention(".ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow");
        factory.loadExtention(".potx", "application/vnd.openxmlformats-officedocument.presentationml.template");
        factory.loadExtention(".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        factory.loadExtention(".xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template");
        factory.loadExtention(".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        factory.loadExtention(".dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template");
        factory.loadExtention(".dp", "application/vnd.osgi.dp");
        factory.loadExtention(".pdb,.pqa,.oprc", "application/vnd.palm");
        factory.loadExtention(".str", "application/vnd.pg.format");
        factory.loadExtention(".ei6", "application/vnd.pg.osasli");
        factory.loadExtention(".efif", "application/vnd.picsel");
        factory.loadExtention(".plf", "application/vnd.pocketlearn");
        factory.loadExtention(".pbd", "application/vnd.powerbuilder6");
        factory.loadExtention(".box", "application/vnd.previewsystems.box");
        factory.loadExtention(".mgz", "application/vnd.proteus.magazine");
        factory.loadExtention(".qps", "application/vnd.publishare-delta-tree");
        factory.loadExtention(".ptid", "application/vnd.pvi.ptid1");
        factory.loadExtention(".qxd,.qxt,.qwd,.qwt,.qxl,.qxb", "application/vnd.quark.quarkxpress");
        factory.loadExtention(".mxl", "application/vnd.recordare.musicxml");
        factory.loadExtention(".musicxml", "application/vnd.recordare.musicxml+xml");
        factory.loadExtention(".cod", "application/vnd.rim.cod");
        factory.loadExtention(".rm", "application/vnd.rn-realmedia");
        factory.loadExtention(".link66", "application/vnd.route66.link66+xml");
        factory.loadExtention(".see", "application/vnd.seemail");
        factory.loadExtention(".sema", "application/vnd.sema");
        factory.loadExtention(".semd", "application/vnd.semd");
        factory.loadExtention(".semf", "application/vnd.semf");
        factory.loadExtention(".ifm", "application/vnd.shana.informed.formdata");
        factory.loadExtention(".itp", "application/vnd.shana.informed.formtemplate");
        factory.loadExtention(".iif", "application/vnd.shana.informed.interchange");
        factory.loadExtention(".ipk", "application/vnd.shana.informed.package");
        factory.loadExtention(".twd,.twds", "application/vnd.simtech-mindmapper");
        factory.loadExtention(".mmf", "application/vnd.smaf");
        factory.loadExtention(".teacher", "application/vnd.smart.teacher");
        factory.loadExtention(".sdkm,.sdkd", "application/vnd.solent.sdkm+xml");
        factory.loadExtention(".dxp", "application/vnd.spotfire.dxp");
        factory.loadExtention(".sfs", "application/vnd.spotfire.sfs");
        factory.loadExtention(".sdc", "application/vnd.stardivision.calc");
        factory.loadExtention(".sda", "application/vnd.stardivision.draw");
        factory.loadExtention(".sdd", "application/vnd.stardivision.impress");
        factory.loadExtention(".smf", "application/vnd.stardivision.math");
        factory.loadExtention(".sdw", "application/vnd.stardivision.writer");
        factory.loadExtention(".vor", "application/vnd.stardivision.writer");
        factory.loadExtention(".sgl", "application/vnd.stardivision.writer-global");
        factory.loadExtention(".sxc", "application/vnd.sun.xml.calc");
        factory.loadExtention(".stc", "application/vnd.sun.xml.calc.template");
        factory.loadExtention(".sxd", "application/vnd.sun.xml.draw");
        factory.loadExtention(".std", "application/vnd.sun.xml.draw.template");
        factory.loadExtention(".sxi", "application/vnd.sun.xml.impress");
        factory.loadExtention(".sti", "application/vnd.sun.xml.impress.template");
        factory.loadExtention(".sxm", "application/vnd.sun.xml.math");
        factory.loadExtention(".sxw", "application/vnd.sun.xml.writer");
        factory.loadExtention(".sxg", "application/vnd.sun.xml.writer.global");
        factory.loadExtention(".stw", "application/vnd.sun.xml.writer.template");
        factory.loadExtention(".sus,.susp", "application/vnd.sus-calendar");
        factory.loadExtention(".svd", "application/vnd.svd");
        factory.loadExtention(".sis,.sisx", "application/vnd.symbian.install");
        factory.loadExtention(".xsm", "application/vnd.syncml+xml");
        factory.loadExtention(".bdm", "application/vnd.syncml.dm+wbxml");
        factory.loadExtention(".xdm", "application/vnd.syncml.dm+xml");
        factory.loadExtention(".tao", "application/vnd.tao.intent-module-archive");
        factory.loadExtention(".tmo", "application/vnd.tmobile-livetv");
        factory.loadExtention(".tpt", "application/vnd.trid.tpt");
        factory.loadExtention(".mxs", "application/vnd.triscape.mxs");
        factory.loadExtention(".tra", "application/vnd.trueapp");
        factory.loadExtention(".ufd,.ufdl", "application/vnd.ufdl");
        factory.loadExtention(".utz", "application/vnd.uiq.theme");
        factory.loadExtention(".umj", "application/vnd.umajin");
        factory.loadExtention(".unityweb", "application/vnd.unity");
        factory.loadExtention(".uoml", "application/vnd.uoml+xml");
        factory.loadExtention(".vcx", "application/vnd.vcx");
        factory.loadExtention(".vsd,.vst,.vss,.vsw", "application/vnd.visio");
        factory.loadExtention(".vis", "application/vnd.visionary");
        factory.loadExtention(".vsf", "application/vnd.vsf");
        factory.loadExtention(".wbxml", "application/vnd.wap.wbxml");
        factory.loadExtention(".wmlc", "application/vnd.wap.wmlc");
        factory.loadExtention(".wmlsc", "application/vnd.wap.wmlscriptc");
        factory.loadExtention(".wtb", "application/vnd.webturbo");
        factory.loadExtention(".wpd", "application/vnd.wordperfect");
        factory.loadExtention(".wqd", "application/vnd.wqd");
        factory.loadExtention(".stf", "application/vnd.wt.stf");
        factory.loadExtention(".xar", "application/vnd.xara");
        factory.loadExtention(".xfdl", "application/vnd.xfdl");
        factory.loadExtention(".hvd", "application/vnd.yamaha.hv-dic");
        factory.loadExtention(".hvs", "application/vnd.yamaha.hv-script");
        factory.loadExtention(".hvp", "application/vnd.yamaha.hv-voice");
        factory.loadExtention(".osf", "application/vnd.yamaha.openscoreformat");
        factory.loadExtention(".osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml");
        factory.loadExtention(".saf", "application/vnd.yamaha.smaf-audio");
        factory.loadExtention(".spf", "application/vnd.yamaha.smaf-phrase");
        factory.loadExtention(".cmp", "application/vnd.yellowriver-custom-menu");
        factory.loadExtention(".zir,.zirz", "application/vnd.zul");
        factory.loadExtention(".zaz", "application/vnd.zzazz.deck+xml");
        factory.loadExtention(".vxml", "application/voicexml+xml");
        factory.loadExtention(".hlp", "application/winhlp");
        factory.loadExtention(".wsdl", "application/wsdl+xml");
        factory.loadExtention(".wspolicy", "application/wspolicy+xml");
        factory.loadExtention(".abw", "application/x-abiword");
        factory.loadExtention(".ace", "application/x-ace-compressed");
        factory.loadExtention(".aab,.x32,.u32,.vox", "application/x-authorware-bin");
        factory.loadExtention(".aam", "application/x-authorware-map");
        factory.loadExtention(".aas", "application/x-authorware-seg");
        factory.loadExtention(".bcpio", "application/x-bcpio");
        factory.loadExtention(".torrent", "application/x-bittorrent");
        factory.loadExtention(".bz", "application/x-bzip");
        factory.loadExtention(".bz2,.boz", "application/x-bzip2");
        factory.loadExtention(".vcd", "application/x-cdlink");
        factory.loadExtention(".chat", "application/x-chat");
        factory.loadExtention(".pgn", "application/x-chess-pgn");
        factory.loadExtention(".cpio", "application/x-cpio");
        factory.loadExtention(".csh", "application/x-csh");
        factory.loadExtention(".deb,.udeb", "application/x-debian-package");
        factory.loadExtention(".dir,.dcr,.dxr,.cst,.cct,.cxt,.w3d,.fgd,.swa", "application/x-director");
        factory.loadExtention(".wad", "application/x-doom");
        factory.loadExtention(".ncx", "application/x-dtbncx+xml");
        factory.loadExtention(".dtb", "application/x-dtbook+xml");
        factory.loadExtention(".res", "application/x-dtbresource+xml");
        factory.loadExtention(".dvi", "application/x-dvi");
        factory.loadExtention(".bdf", "application/x-font-bdf");
        factory.loadExtention(".gsf", "application/x-font-ghostscript");
        factory.loadExtention(".psf", "application/x-font-linux-psf");
        factory.loadExtention(".otf", "application/x-font-otf");
        factory.loadExtention(".pcf", "application/x-font-pcf");
        factory.loadExtention(".snf", "application/x-font-snf");
        factory.loadExtention(".ttf,.ttc", "application/x-font-ttf");
        factory.loadExtention(".woff", "application/font-woff");
        factory.loadExtention(".pfa,.pfb,.pfm,.afm", "application/x-font-type1");
        factory.loadExtention(".spl", "application/x-futuresplash");
        factory.loadExtention(".gnumeric", "application/x-gnumeric");
        factory.loadExtention(".gtar", "application/x-gtar");
        factory.loadExtention(".hdf", "application/x-hdf");
        factory.loadExtention(".jnlp", "application/x-java-jnlp-file");
        factory.loadExtention(".latex", "application/x-latex");
        factory.loadExtention(".prc,.mobi", "application/x-mobipocket-ebook");
        factory.loadExtention(".application", "application/x-ms-application");
        factory.loadExtention(".wmd", "application/x-ms-wmd");
        factory.loadExtention(".wmz", "application/x-ms-wmz");
        factory.loadExtention(".xbap", "application/x-ms-xbap");
        factory.loadExtention(".mdb", "application/x-msaccess");
        factory.loadExtention(".obd", "application/x-msbinder");
        factory.loadExtention(".crd", "application/x-mscardfile");
        factory.loadExtention(".clp", "application/x-msclip");
        factory.loadExtention(".exe,.dll,.com,.bat,.msi", "application/x-msdownload");
        factory.loadExtention(".mvb,.m13,.m14", "application/x-msmediaview");
        factory.loadExtention(".wmf", "application/x-msmetafile");
        factory.loadExtention(".mny", "application/x-msmoney");
        factory.loadExtention(".pub", "application/x-mspublisher");
        factory.loadExtention(".scd", "application/x-msschedule");
        factory.loadExtention(".trm", "application/x-msterminal");
        factory.loadExtention(".wri", "application/x-mswrite");
        factory.loadExtention(".nc,.cdf", "application/x-netcdf");
        factory.loadExtention(".p12,.pfx", "application/x-pkcs12");
        factory.loadExtention(".p7b,.spc", "application/x-pkcs7-certificates");
        factory.loadExtention(".p7r", "application/x-pkcs7-certreqresp");
        factory.loadExtention(".rar", "application/x-rar-compressed");
        factory.loadExtention(".sh", "application/x-sh");
        factory.loadExtention(".shar", "application/x-shar");
        factory.loadExtention(".swf", "application/x-shockwave-flash");
        factory.loadExtention(".xap", "application/x-silverlight-app");
        factory.loadExtention(".sit", "application/x-stuffit");
        factory.loadExtention(".sitx", "application/x-stuffitx");
        factory.loadExtention(".sv4cpio", "application/x-sv4cpio");
        factory.loadExtention(".sv4crc", "application/x-sv4crc");
        factory.loadExtention(".tar", "application/x-tar");
        factory.loadExtention(".tcl", "application/x-tcl");
        factory.loadExtention(".tex", "application/x-tex");
        factory.loadExtention(".tfm", "application/x-tex-tfm");
        factory.loadExtention(".texinfo,.texi", "application/x-texinfo");
        factory.loadExtention(".ustar", "application/x-ustar");
        factory.loadExtention(".src", "application/x-wais-source");
        factory.loadExtention(".der,.crt", "application/x-x509-ca-cert");
        factory.loadExtention(".fig", "application/x-xfig");
        factory.loadExtention(".xpi", "application/x-xpinstall");
        factory.loadExtention(".xenc", "application/xenc+xml");
        factory.loadExtention(".xhtml,.xht", "application/xhtml+xml");
        factory.loadExtention(".xml,.xsl", "application/xml");
        factory.loadExtention(".dtd", "application/xml-dtd");
        factory.loadExtention(".xop", "application/xop+xml");
        factory.loadExtention(".xslt", "application/xslt+xml");
        factory.loadExtention(".xspf", "application/xspf+xml");
        factory.loadExtention(".mxml,.xhvml,.xvml,.xvm", "application/xv+xml");
        factory.loadExtention(".zip", "application/zip");
        factory.loadExtention(".adp", "audio/adpcm");
        factory.loadExtention(".au,.snd", "audio/basic");
        factory.loadExtention(".mid,.midi,.kar,.rmi", "audio/midi");
        factory.loadExtention(".mp4a", "audio/mp4");
        factory.loadExtention(".m4a,.m4p", "audio/mp4a-latm");
        factory.loadExtention(".mpga,.mp2,.mp2a,.mp3,.m2a,.m3a", "audio/mpeg");
        factory.loadExtention(".oga,.ogg,.spx", "audio/ogg");
        factory.loadExtention(".eol", "audio/vnd.digital-winds");
        factory.loadExtention(".dts", "audio/vnd.dts");
        factory.loadExtention(".dtshd", "audio/vnd.dts.hd");
        factory.loadExtention(".lvp", "audio/vnd.lucent.voice");
        factory.loadExtention(".pya", "audio/vnd.ms-playready.media.pya");
        factory.loadExtention(".ecelp4800", "audio/vnd.nuera.ecelp4800");
        factory.loadExtention(".ecelp7470", "audio/vnd.nuera.ecelp7470");
        factory.loadExtention(".ecelp9600", "audio/vnd.nuera.ecelp9600");
        factory.loadExtention(".aac", "audio/x-aac");
        factory.loadExtention(".aif,.aiff,.aifc", "audio/x-aiff");
        factory.loadExtention(".m3u", "audio/x-mpegurl");
        factory.loadExtention(".wax", "audio/x-ms-wax");
        factory.loadExtention(".wma", "audio/x-ms-wma");
        factory.loadExtention(".ram,.ra", "audio/x-pn-realaudio");
        factory.loadExtention(".rmp", "audio/x-pn-realaudio-plugin");
        factory.loadExtention(".wav", "audio/x-wav");
        factory.loadExtention(".cdx", "chemical/x-cdx");
        factory.loadExtention(".cif", "chemical/x-cif");
        factory.loadExtention(".cmdf", "chemical/x-cmdf");
        factory.loadExtention(".cml", "chemical/x-cml");
        factory.loadExtention(".csml", "chemical/x-csml");
        factory.loadExtention(".xyz", "chemical/x-xyz");
        factory.loadExtention(".bmp", "image/bmp");
        factory.loadExtention(".cgm", "image/cgm");
        factory.loadExtention(".g3", "image/g3fax");
        factory.loadExtention(".gif", "image/gif");
        factory.loadExtention(".ief", "image/ief");
        factory.loadExtention(".jp2", "image/jp2");
        factory.loadExtention(".jpeg,.jpg,.jpe", "image/jpeg");
        factory.loadExtention(".pict,.pic,.pct", "image/pict");
        factory.loadExtention(".png", "image/png");
        factory.loadExtention(".btif", "image/prs.btif");
        factory.loadExtention(".svg,.svgz", "image/svg+xml");
        factory.loadExtention(".tiff,.tif", "image/tiff");
        factory.loadExtention(".psd", "image/vnd.adobe.photoshop");
        factory.loadExtention(".djvu,.djv", "image/vnd.djvu");
        factory.loadExtention(".dwg", "image/vnd.dwg");
        factory.loadExtention(".dxf", "image/vnd.dxf");
        factory.loadExtention(".fbs", "image/vnd.fastbidsheet");
        factory.loadExtention(".fpx", "image/vnd.fpx");
        factory.loadExtention(".fst", "image/vnd.fst");
        factory.loadExtention(".mmr", "image/vnd.fujixerox.edmics-mmr");
        factory.loadExtention(".rlc", "image/vnd.fujixerox.edmics-rlc");
        factory.loadExtention(".mdi", "image/vnd.ms-modi");
        factory.loadExtention(".npx", "image/vnd.net-fpx");
        factory.loadExtention(".wbmp", "image/vnd.wap.wbmp");
        factory.loadExtention(".xif", "image/vnd.xiff");
        factory.loadExtention(".ras", "image/x-cmu-raster");
        factory.loadExtention(".cmx", "image/x-cmx");
        factory.loadExtention(".fh,.fhc,.fh4,.fh5,.fh7", "image/x-freehand");
        factory.loadExtention(".ico", "image/x-icon");
        factory.loadExtention(".pntg,.pnt,.mac", "image/x-macpaint");
        factory.loadExtention(".pcx", "image/x-pcx");
        //factory.loadExtention(".pic,.pct", "image/x-pict");
        factory.loadExtention(".pnm", "image/x-portable-anymap");
        factory.loadExtention(".pbm", "image/x-portable-bitmap");
        factory.loadExtention(".pgm", "image/x-portable-graymap");
        factory.loadExtention(".ppm", "image/x-portable-pixmap");
        factory.loadExtention(".qtif,.qti", "image/x-quicktime");
        factory.loadExtention(".rgb", "image/x-rgb");
        factory.loadExtention(".xbm", "image/x-xbitmap");
        factory.loadExtention(".xpm", "image/x-xpixmap");
        factory.loadExtention(".xwd", "image/x-xwindowdump");
        factory.loadExtention(".eml,.mime", "message/rfc822");
        factory.loadExtention(".igs,.iges", "model/iges");
        factory.loadExtention(".msh,.mesh,.silo", "model/mesh");
        factory.loadExtention(".dwf", "model/vnd.dwf");
        factory.loadExtention(".gdl", "model/vnd.gdl");
        factory.loadExtention(".gtw", "model/vnd.gtw");
        factory.loadExtention(".mts", "model/vnd.mts");
        factory.loadExtention(".vtu", "model/vnd.vtu");
        factory.loadExtention(".wrl,.vrml", "model/vrml");
        factory.loadExtention(".ics,.ifb", "text/calendar");
        factory.loadExtention(".css", "text/css");
        factory.loadExtention(".csv", "text/csv");
        factory.loadExtention(".html,.htm", "text/html");
        factory.loadExtention(".txt,.text,.conf,.def,.list,.log,.in", "text/plain");
        factory.loadExtention(".dsc", "text/prs.lines.tag");
        factory.loadExtention(".rtx", "text/richtext");
        factory.loadExtention(".sgml,.sgm", "text/sgml");
        factory.loadExtention(".tsv", "text/tab-separated-values");
        factory.loadExtention(".t,.tr,.roff,.man,.me,.ms", "text/troff");
        factory.loadExtention(".uri,.uris,.urls", "text/uri-list");
        factory.loadExtention(".curl", "text/vnd.curl");
        factory.loadExtention(".dcurl", "text/vnd.curl.dcurl");
        factory.loadExtention(".scurl", "text/vnd.curl.scurl");
        factory.loadExtention(".mcurl", "text/vnd.curl.mcurl");
        factory.loadExtention(".fly", "text/vnd.fly");
        factory.loadExtention(".flx", "text/vnd.fmi.flexstor");
        factory.loadExtention(".gv", "text/vnd.graphviz");
        factory.loadExtention(".3dml", "text/vnd.in3d.3dml");
        factory.loadExtention(".spot", "text/vnd.in3d.spot");
        factory.loadExtention(".jad", "text/vnd.sun.j2me.app-descriptor");
        factory.loadExtention(".wml", "text/vnd.wap.wml");
        factory.loadExtention(".wmls", "text/vnd.wap.wmlscript");
        factory.loadExtention(".s,.asm", "text/x-asm");
        factory.loadExtention(".c,.cc,.cxx,.cpp,.h,.hh,.dic", "text/x-c");
        factory.loadExtention(".f,.for,.f77,.f90", "text/x-fortran");
        factory.loadExtention(".p,.pas", "text/x-pascal");
        factory.loadExtention(".java", "text/x-java-source");
        factory.loadExtention(".etx", "text/x-setext");
        factory.loadExtention(".uu", "text/x-uuencode");
        factory.loadExtention(".vcs", "text/x-vcalendar");
        factory.loadExtention(".vcf", "text/x-vcard");
        factory.loadExtention(".3gp", "video/3gpp");
        factory.loadExtention(".3g2", "video/3gpp2");
        factory.loadExtention(".h261", "video/h261");
        factory.loadExtention(".h263", "video/h263");
        factory.loadExtention(".h264", "video/h264");
        factory.loadExtention(".jpgv", "video/jpeg");
        factory.loadExtention(".jpm,.jpgm", "video/jpm");
        factory.loadExtention(".mj2,.mjp2", "video/mj2");
        factory.loadExtention(".mp4,.mp4v,.mpg4,.m4v", "video/mp4");
        factory.loadExtention(".webm", "video/webm");
        factory.loadExtention(".mpeg,.mpg,.mpe,.m1v,.m2v", "video/mpeg");
        factory.loadExtention(".ogv", "video/ogg");
        factory.loadExtention(".qt,.mov", "video/quicktime");
        factory.loadExtention(".fvt", "video/vnd.fvt");
        factory.loadExtention(".mxu,.m4u", "video/vnd.mpegurl");
        factory.loadExtention(".pyv", "video/vnd.ms-playready.media.pyv");
        factory.loadExtention(".viv", "video/vnd.vivo");
        factory.loadExtention(".dv,.dif", "video/x-dv");
        factory.loadExtention(".f4v", "video/x-f4v");
        factory.loadExtention(".fli", "video/x-fli");
        factory.loadExtention(".flv", "video/x-flv");
        //factory.loadExtention(".m4v", "video/x-m4v");
        factory.loadExtention(".asf,.asx", "video/x-ms-asf");
        factory.loadExtention(".wm", "video/x-ms-wm");
        factory.loadExtention(".wmv", "video/x-ms-wmv");
        factory.loadExtention(".wmx", "video/x-ms-wmx");
        factory.loadExtention(".wvx", "video/x-ms-wvx");
        factory.loadExtention(".avi", "video/x-msvideo");
        factory.loadExtention(".movie", "video/x-sgi-movie");
        factory.loadExtention(".ice", "x-conference/x-cooltalk");
        factory.loadExtention(".indd", "application/x-indesign");
        factory.loadExtention(".dat", "application/octet-stream");
        // Compressed files
        // Based on notes at http://en.wikipedia.org/wiki/List_of_archive_formats
        factory.loadExtention(".gz", "application/x-gzip");
        factory.loadExtention(".tgz", "application/x-tar");
        factory.loadExtention(".tar", "application/x-tar");

        // Not really sure about these...
        factory.loadExtention(".epub", "application/epub+zip");
        factory.loadExtention(".mobi", "application/x-mobipocket-ebook");

        // Here's some common special cases without filename extensions
        factory.loadExtention("README,LICENSE,COPYING,TODO,ABOUT,AUTHORS,CONTRIBUTORS", "text/plain");
        factory.loadExtention("manifest,.manifest,.mf,.appcache", "text/cache-manifest");

		let manualCancel;
		var cancelRequest;
		factory.getResponseFromAIApi = function(decBlob,fName,fExt,prompt){
debugger
			fExt = fExt ? fExt : (decBlob.type ? decBlob.type : '');
			var file = new File([decBlob],fName,{type: fExt});
			var formData = new FormData();
			formData.append("prompt", prompt);
			formData.append("model_name","gpt-4o");
			//formData.append("response_type","pdf");
			formData.append("file",file);
			// Define audio MIME types
		//	const audioMimeTypes = [
			//	'audio/mpeg', // mp3
				//'audio/mp4',  // mp4 audio
			//	'audio/wav',  // wav
		//		'audio/ogg',  // ogg
			//	'audio/aac',  // aac
		//		'audio/flac',  // flac
			//		'audio/x-wav',
		//		'audio/mp4a-latm',
			//	'audio/mp4a'
				// Add more audio MIME types as needed
	//		];
			console.log(`File Type: ${fExt}`);
			// Determine the API endpoint based on file type
	//		const isAudioFile = audioMimeTypes.includes(fExt);
			//const apiEndpoint = isAudioFileaa
			//	? 'https://ai-api.mylightening.com/v7/audio-analysis ' // Endpoint for audio files
			//	: 'https://ai-api.mylightening.com/v2/chat-completion'; // Default endpoint
			//const apiEndpoint = 'https://ai-api.mylightening.com/v5/chat-completion';  
			//const apiEndpoint = 'https://ai-api.mylightening.com/v6/audio-processing';  
			const apiEndpoint = 'https://ai-api.mylightening.com/v7/unified-processing';
			
			
			
			manualCancel = false;
			cancelRequest = $q.defer();
			if ([...formData.entries()].length === 0) {
				console.log('FormData is EMPTY');
			} else {
				console.log('FormData has entries:');
				console.log('updated');
				console.log(fExt);
				for (var pair of formData.entries()) {
					console.log(pair[0] + ':', pair[1]);
				}}
			$http.post(apiEndpoint, formData, {
					headers: {
						'authorization': 'someRandom101SecretKey4AIWork',
						'Content-Type': undefined
					},
					timeout: cancelRequest.promise
				})
				.then(function(res) {
				if(res && res.data){
    $rootScope.aiResText = res.data.response ? $sce.trustAsHtml(marked.parse(res.data.response)) : '';
    
if (res.data.pdf) {
    console.log("PDF data length:", res.data.pdf.length);
    
    try {
        // Clean the Base64 string
        const cleanBase64 = res.data.pdf.replace(/\s/g, '');
        
        // Convert Base64 to binary
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create Blob with proper PDF MIME type
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        console.log("Blob size:", pdfBlob.size);
        
        // Check if Blob is empty
        if (pdfBlob.size === 0) {
            throw new Error("Empty PDF Blob created");
        }
        
        // Revoke previous URL to prevent memory leaks
        if ($rootScope.pdfUrl) {
            URL.revokeObjectURL($rootScope.pdfUrl);
        }
        
        // Create the Blob URL
        $rootScope.pdfUrl = URL.createObjectURL(pdfBlob);
        console.log("PDF URL created:", $rootScope.pdfUrl);
        
    } catch (error) {
        console.error("Error creating PDF blob:", error);
        $rootScope.pdfUrl = null;
    }
} else {
    $rootScope.pdfUrl = null;
}
    
   let cleanName = fName.split('/').pop().split('?')[0]; // Remove any path or query
cleanName = cleanName.replace(/\.[^/.]+$/, ''); // Remove final extension

$rootScope.aiGenFName = cleanName + "_" + Date.now() + ".pdf";


}
					$rootScope.isAILoad = false;
				cancelRequest.resolve();
			}).catch(function(error) {
	$rootScope.isAILoad = false;
	if (!manualCancel) {
		console.log("Error Status: ", error.status);        // <-- log HTTP status code
		console.log("Error Data: ", error.data);            // <-- log server response
		console.log("Full Error: ", error);                 // optional full object
		var msg = (error.data && error.data.detail) 
			? JSON.stringify(error.data.detail) 
			: "Something went wrong while getting response from the service.";
		swal("Please try again!", msg, "error");
	}
});

		}
		
		factory.stopAIRequest = function(){
			if(cancelRequest){
				manualCancel = true;
				cancelRequest.resolve();
			}
		};
		
        return factory;
    };

    utilsService.$inject = ['$http', '$rootScope', '$sce', '$cookies', '$q'];

    angular.module('authApp').factory('utilsService', utilsService);

}());
