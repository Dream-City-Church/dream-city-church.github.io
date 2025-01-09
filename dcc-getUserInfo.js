// This script will look for a cid or uid parameter in the URL
// If found, it will make a GET API call to the DCC API to get the user information

// Get the URL parameters
var urlParams = new URLSearchParams(window.location.search);
var cid = urlParams.get('cid');
var uid = urlParams.get('uid');

// If cid or uid is found, make a GET API call to the DCC API
if (cid || uid) {
    var xhr = new XMLHttpRequest();
    var url = "https://prod-10.westus2.logic.azure.com:443/workflows/d910b8466b9f43dc93c10f23ab50fb78/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nbpbVKt37ObPXwptvbA-mjdkyzJsugJ-Xk4dyDcArE8";
    xhr.open("GET", url + "?cid=" + cid + "&uid=" + uid, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var user = JSON.parse(xhr.responseText);
            console.log(user);
        }
    };
    xhr.send();
}