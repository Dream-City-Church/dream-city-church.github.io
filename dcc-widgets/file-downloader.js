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

/* Function for checking if the file GUID is valid */
function isValidFileGuid() {
    var fileGuid = getUrlVars()["fileguid"];
    var fileUrl = "https://my.dreamcitychurch.us/ministryplatformapi/files/" + fileGuid;
    // Use fetch() to check if the file exists
    fetch(fileUrl, {method: 'GET'})
    .then(function(response) {
        if (response.status == 200) {
            return true;
        } else {
            return false;
        }
        console.log("URL Status: "+response.status);
    });
}

/* Function for returning the file name */
function getFileName() {
    var fileGuid = getUrlVars()["fileguid"];
    var fileUrl = "https://my.dreamcitychurch.us/ministryplatformapi/files/" + fileGuid;
    // Use fetch() to get the file name
    fetch(fileUrl, {method: 'GET'});
    // extract the file name
    var fileName = fetch.headers.get('Content-Disposition').split('filename=')[1];
    // return the file name
    console.log("File name: "+fileName)
    return fileName;
}

/* Function for starting the file download widget */
function startFileDownload() {
    var fileGuid = getUrlVars()["fileguid"];
    /* If the file GUID is not valid, load the invalid file HTML */
    if (!isValidFileGuid() && 1 == 0) {
        console.log("Unable to find file for GUID "+fileGuid);
        var invalidFileGuidHtml = `<div id="file-downloader">
            <div id="file-downloader-header">Invalid File URL</div>
            <div id="file-downloader-subheader">This does not appear to be a valid file URL. Please check your link and try again.</div>
            </div>`;
        document.getElementsByTagName(widgetTagName)[0].innerHTML = invalidFileGuidHtml;
    } else {
        /* Otherwise, start the file download */
        var fileName = getFileName();
        console.log("Starting file download for file GUID "+fileGuid);
        var downloadFileHtml = `<div id="file-downloader">
            <div id="file-downloader-header">Downloading ${fileName}...</div>
            <div id="file-downloader-subheader">Or <a id="file-download-link" href="https://my.dreamcitychurch.us/ministryplatformapi/files/${fileGuid}" target="_blank">Click here</a> if the download does not begin automatically.</div>
            </div>`;
        document.getElementsByTagName(widgetTagName)[0].innerHTML = downloadFileHtml;
        document.getElementById("file-download-link").click();
    }
}

/* Load this widget after the page loads */
window.addEventListener('load', function() {
    startFileDownload();
});