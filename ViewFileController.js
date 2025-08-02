/**
 * Created by xshanarain.
 */

(function() {

    var viewFileController = function($scope,$state,$rootScope,$cookies,$location,authService, utilsService) {

        $scope.username = "";
        $scope.fileKey = "";
        $scope.fileName = "";
        $scope.fileSource = "";

        $scope.sName = "";
        $scope.sEmail = "";

        //https://docs.google.com/gview?url=http://writing.engr.psu.edu/workbooks/formal_report_template.doc&embedded=true
        $scope.viewFileURL = "";
        $scope.downloadFileMimeType = "";
        $scope.downloadFileName = "";
        $scope.downloadFileBlob;
        $scope.isPDF = false;

        $scope.canDownload = false;
        $scope.shouldNotify = false;

        var pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
        var pdfDoc = null,
            pageNum = 1,
            pageRendering = false,
            pageNumPending = null,
            scale = 0.8,
            canvas = document.getElementById('the-canvas'),
            ctx = canvas.getContext('2d');

        function renderPage(num) {
            pageRendering = true;
            // Using promise to fetch the page
            pdfDoc.getPage(num).then(function(page) {
                var viewport = page.getViewport(scale);
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);

                // Wait for rendering to finish
                renderTask.promise.then(function() {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        // New page rendering is pending
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                });
            });

            // Update page counters
            document.getElementById('page_num').textContent = num;
        }

        function queueRenderPage(num) {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        }

        function onPrevPage() {
            if (pageNum <= 1) {
                return;
            }
            pageNum--;
            queueRenderPage(pageNum);
        }

        function onNextPage() {
            if (pageNum >= pdfDoc.numPages) {
                return;
            }
            pageNum++;
            queueRenderPage(pageNum);
        }

        $scope.sendNotification = function (action) {
            if ( $scope.shouldNotify ){
                utilsService.getSharedFileDetails($scope.username, $scope.fileName, $scope.fileKey, $scope.fileSource,
                    $scope.sName, $scope.sEmail, action)
                    .then(function(success) {
                        console.log(success.data)
                    },function(error){
                        swal("Sorry!", error.data.message, "error");
                    });
            }
        };

        function downloadCurrentFile() {
            saveAs($scope.downloadFileBlob, $scope.downloadFileName);
        };

        $scope.showFile = function () {
            $scope.sendNotification('viewed');
            document.getElementById('downloadFileBtn').addEventListener('click', downloadCurrentFile);
            window.blobURL = URL.createObjectURL($scope.downloadFileBlob);
            if ($scope.downloadFileMimeType === 'image/jpeg' ||
                $scope.downloadFileMimeType === 'image/png' ||
                $scope.downloadFileMimeType === 'image/g3fax' ||
                $scope.downloadFileMimeType === 'image/gif') {
                var a = "<img src=" + window.blobURL + "\>";
                document.getElementById('byte_content').innerHTML = a;
            } else if ($scope.downloadFileMimeType === 'audio/mpeg' ||
                $scope.downloadFileMimeType === 'audio/ogg' ||
                $scope.downloadFileMimeType === 'audio/*') {
                var a = "<audio controls> <source src=" + window.blobURL + " type="+$scope.downloadFileMimeType+" > </audio>"
            } else if ($scope.downloadFileMimeType === 'video/mpeg' ||
                $scope.downloadFileMimeType === 'video/ogg' ||
                $scope.downloadFileMimeType === 'video/*') {
                var a = "<video controls> <source src=" + window.blobURL + " type=\"+$scope.downloadFileMimeType+\"> </video>"
            } else if ($scope.downloadFileMimeType === "text/html" ||
                $scope.downloadFileMimeType === "text/plain" ||
                $scope.downloadFileMimeType === "application/javascript" ||
                $scope.downloadFileMimeType === "application/json" ||
                $scope.downloadFileMimeType === "text/css" ||
                $scope.downloadFileMimeType === "text/richtext" ||
                $scope.downloadFileMimeType === "text/x-java-source" ||
                $scope.downloadFileMimeType === "text/x-c" ||
                $scope.downloadFileMimeType === "text/csv") {
                const reader = new FileReader();
                reader.onload = function(e) {
                    var data = e.target.result;
                    document.getElementById('byte_content').innerHTML = data;
                }
                reader.readAsBinaryString($scope.downloadFileBlob);
            } else if ($scope.downloadFileMimeType === "application/pdf") {
                $scope.isPDF = true;
                $scope.$evalAsync();

                document.getElementById('prev').addEventListener('click', onPrevPage);
                document.getElementById('next').addEventListener('click', onNextPage);
                pdfjsLib.getDocument(window.blobURL).then(function(pdfDoc_) {
                    pdfDoc = pdfDoc_;
                    document.getElementById('page_count').textContent = pdfDoc.numPages;

                    // Initial/first page rendering
                    renderPage(pageNum);
                });

            } else if ($scope.downloadFileMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                $scope.downloadFileMimeType === 'application/msword') {
                mammoth.convertToHtml({path: window.blobURL})
                    .then(function(result){
                        var html = result.value; // The generated HTML
                        document.getElementById('byte_content').innerHTML = html;
                        var messages = result.messages; // Any messages, such as warnings during conversion
                        swal("Sorry!", messages, "warning");
                    })
                    .done();
            }
        };

        var init = function() {
          
            $scope.username = $location.search().username;
            $scope.fileKey = $location.search().key;
            $scope.fileName = $location.search().fileName;
            $scope.fileSource = $location.search().source;
            $scope.sName = $location.search().sName;;
            $scope.sEmail = $location.search().sEmail;
            $scope.shouldNotify = $location.search().nm === "1";
            $scope.canDownload = $location.search().ad === "1";
            $scope.isPDF = false;
            utilsService.getSharedFileDetails($scope.username, $scope.fileName, $scope.fileKey, $scope.fileSource)
                .then(function(success) {
                    var _to = new Date(success.data.share_to);
                if (_to > new Date()) {
                    var dFUrl = 'https://mycloudfish.com/app/libs/downloadShareFile.php?fileName=' + $scope.fileName
                        + "&fileKey=" + $scope.fileKey + "&fileSource=" + $scope.fileSource;
                    fetch(dFUrl).then(function (res) {
                        return res.blob();
                    }).then(function (data) {
                        if (data) {
                            if ($scope.fileName.indexOf(".$enc") > 0) {
                                utilsService.getUserKey($scope.username).then(function(success) {
                                    $scope.downloadFileName = $scope.fileName.replace(".$enc", "");
                                    $scope.downloadFileMimeType = utilsService.getExtention($scope.downloadFileName);
                                    utilsService
                                        .decryptFileObject(data, success.data.key, $scope.downloadFileMimeType)
                                        .then(function (decBlob) {
                                            $scope.downloadFileBlob = decBlob;
                                            $scope.showFile();
                                        })
                                        .catch(function (err) {
                                            swal("Sorry!", err.data, "error");
                                        });
                                },function(error){
                                    swal("Sorry!", error.data, "error");
                                });
                            } else {
                                $scope.downloadFileBlob = data;
                                $scope.downloadFileName = $scope.fileName;
                                $scope.downloadFileMimeType = utilsService.getExtention($scope.downloadFileName);
                                $scope.showFile();
                                //saveAs(data, $scope.fileName);
                            }
                        }
                    }).catch(function(err) {
                        swal("Sorry!", err.message, "error");
                    });
                } else {
                    swal("Sorry!", "File has been expired!", "info");
                }
            },function(error){
                swal("Sorry!", error.data.message, "error");
            });
        }

        init();

    };

    viewFileController.$inject = ['$scope','$state','$rootScope','$cookies','$location', 'authService', 'utilsService'];

    angular.module('authApp').controller('viewFileController', viewFileController);

}());
