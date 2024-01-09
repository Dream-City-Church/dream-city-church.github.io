/* This javascript will get the file GUID from the URL and then download the file */
const versionNumber = '1.0.0';
const widgetTagName = 'dcc-filedownloader';

console.log("Loading DCC File Downloader Widget v"+versionNumber);

/* Function for getting URL variables */
function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

/* Function for downloading file */
function downloadFile() {
    var urlVars = getUrlVars();
    var fileGuid = urlVars["fileguid"];
    var fileUrl = "https://my.dreamcitychurch.us/ministryplatformapi/files/" + fileGuid;
    window.location.href = fileUrl;
}

/* Function for checking if the file GUID is valid */
function isValidFileGuid() {
    var urlVars = getUrlVars();
    var fileGuid = urlVars["fileguid"];
    var fileUrl = "https://my.dreamcitychurch.us/ministryplatformapi/files/" + fileGuid;
    var request = new XMLHttpRequest();
    request.open('HEAD', fileUrl, false);
    request.send();
    return request.status != 404;
}

/* Function for returning the file name */
function getFileName() {
    var urlVars = getUrlVars();
    var fileGuid = urlVars["fileguid"];
    var fileUrl = "https://my.dreamcitychurch.us/ministryplatformapi/files/" + fileGuid;
    var request = new XMLHttpRequest();
    request.open('HEAD', fileUrl, false);
    request.send();
    return request.getResponseHeader('Content-Disposition').split('filename=')[1];
}

/* Function for starting the file download widget */
function startFileDownload() {
    /* If the file GUID is not valid, load the invalid file HTML */
    if (!isValidFileGuid()) {
        console.log("Unable to find file for GUID "+fileGuid);
        var invalidFileGuidHtml = `<div id="file-downloader">
            <div id="file-downloader-header">Invalid File URL</div>
            <div id="file-downloader-subheader">This does not appear to be a valid file URL. Please check your link and try again.</div>
            </div>`;
        document.getElementsByTagName(widgetTagName)[0].innerHTML = invalidFileGuidHtml;
    }else {
        /* Otherwise, start the file download */
        console.log("Starting file download for file GUID "+fileGuid);
        var downloadFileHtml = `<div id="file-downloader">
            <div id="file-downloader-header">Downloading ${getFileName}...</div>
            <div id="file-downloader-subheader">Or <a href="https://my.dreamcitychurch.us/ministryplatformapi/files/${fileGuid}" target="_blank">Click here</a> if the download does not begin automatically.</div>
            </div>`;
        document.getElementsByTagName(widgetTagName)[0].innerHTML = downloadFileHtml;
        downloadFile();
    }
}

/* Load this widget after the page loads */
window.addEventListener('load', function() {
    startFileDownload();
});