/* This javascript will get the file GUID from the URL and then download the file */
const versionNumber = '1.0.0';
const widgetTagName = 'dcc-filedownloader';
const loadingSpinner = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';

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
    document.getElementsByTagName(widgetTagName)[0].innerHTML = loadingSpinner;
    // Use fetch() to check if the file exists
    fetch(fileUrl, {method: 'GET'})
    .then(function(response) {
        console.log("URL Status: "+response.status);
        if (response.status === 200) {
            getFileName(fileGuid);
        } else {
            invalidFileGuid(fileGuid);
        }
    });
}

/* Function for returning the file name */
function getFileName(fileGuid) {
    var fileUrl = "https://my.dreamcitychurch.us/ministryplatformapi/files/" + fileGuid;
    var fileName = "File";
    // Use fetch() to get the file name
    fetch(fileUrl, {method: 'GET'})
    .then(function(response) {
        if(response.headers.get('Content-Disposition')){
            fileName = fetch.headers.get('Content-Disposition').split('filename=')[1];
            validFileGuid(fileGuid,fileName);
        } else {
            validFileGuid(fileGuid,fileName)
        }
    })
    .catch(function(error) {
        validFileGuid(fileGuid,fileName);
    });
}

function invalidFileGuid(fileGuid) {
    console.log("Unable to find file for GUID "+fileGuid);
    var invalidFileGuidHtml = `<div id="file-downloader">
        <div id="file-downloader-header">Invalid File URL</div>
        <div id="file-downloader-subheader">This does not appear to be a valid file URL. Please check your link and try again.</div>
        </div>`;
    document.getElementsByTagName(widgetTagName)[0].innerHTML = invalidFileGuidHtml;
} 

function validFileGuid(fileGuid,fileName) {
    var downloadFileHtml = `<div id="file-downloader">
        <div id="file-downloader-header">Downloading ${fileName}...</div>
        <div id="file-downloader-subheader">Or <a id="file-download-link" href="https://my.dreamcitychurch.us/ministryplatformapi/files/${fileGuid}" target="_blank">Click here</a> if the download does not begin automatically.</div>
        </div>`;
    document.getElementsByTagName(widgetTagName)[0].innerHTML = downloadFileHtml;
    document.getElementById("file-download-link").click();
}

/* Load this widget after the page loads */
window.addEventListener('load', function() {
    isValidFileGuid();
});