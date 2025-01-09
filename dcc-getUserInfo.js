// This script will look for a cid or uid parameter in the URL
// If found, it will make a GET API call to the DCC API to get the user information

// Get the URL parameters
/* Function for getting URL variables */
function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

var contactGuid = getUrlVars()["cid"];
var userGuid = getUrlVars()["uid"];

// Generate a device ID to store as a permanent cookie
var deviceID = localStorage.getItem('deviceID');
if (!deviceID) {
    deviceID = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceID', deviceID);
}
// Get current URL
var url = window.location.origin;
var url =+ window.location.pathname;
// Get current page
var page = window.location.pathname;

// If cid or uid is found, make a GET API call to the DCC API
if (userGuid || contactGuid) {
    // Get the user's first name and last name from API
    fetch(`https://prod-10.westus2.logic.azure.com:443/workflows/d910b8466b9f43dc93c10f23ab50fb78/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nbpbVKt37ObPXwptvbA-mjdkyzJsugJ-Xk4dyDcArE8&uid=${userGuid}&cid=${contactGuid}&src=${page}&url=${url}&deviceID=${deviceID}`)
}