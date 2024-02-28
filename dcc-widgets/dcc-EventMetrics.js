// Set current version
var dccGroupMetricsVersion = "0.1";
console.log('dcc-GroupMetrics version ' + dccGroupMetricsVersion + ' loaded.');

// Set Global Variables
var userId = getUrlVars()["userId"];

// Get URL Params Function
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

// Load Events
function getCurrentEvents() {
    /* Initialize loading spinner */
    divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;

    /* Call Event Metrics Load API */
    const params = {
        "User_ID": userId
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch('https://prod-27.westus2.logic.azure.com:443/workflows/779544a2ee3e412598d11d048ff1bb2f/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tmDZsq2CiSCq-tmh4Pzc0-pxNbolivvrGXrunyTVQbw', options)
        .then(function (response) {
            /* If status code 200 */
            if (response.status == 200) {
                return response.json();
            } else {
                /* If status code is not 200 */
                return PromiseRejectionEvent('Error: ' + response.status);
            }})
        .then(function (data) {
            
        })
        .catch(function (error) {
            divHTML = divHTML+`<div id="dcc-eventmetrics"><div id="form-description-text"><p>Uh oh, something went wrong.<br /><br />We're having trouble communicating with our services. Please try again later.</p></div></div>`;
                document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;
        });
    }

window.onload = setTimeout(getCurrentEvents, 500);