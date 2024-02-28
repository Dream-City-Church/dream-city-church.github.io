// Set current version
var dccGroupMetricsVersion = "0.1";
console.log('dcc-EventMetrics version ' + dccGroupMetricsVersion + ' loaded.');

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

    /* Check if User ID is present */
    if (userId == null) {
        divHTML = `<div id="dcc-eventmetrics"><div id="status-text"><p>You are not authorized to view this page.</p></div></div>`;
        document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;
        stop;
    }

    /* Call Event Metrics Load API */
    const params = {
        "User_ID": userId
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch('https://prod-09.westus2.logic.azure.com:443/workflows/9eefa5638fea445eb416b637d6219948/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXM1wj0RI6c_hdR4Lw5PGeFs_CtmtmsMGyuTZ4JTdCw', options)
        .then(function (response) {
            console.log(response.status);
            /* If status code 200 */
            if (response.status == 200) {
                return response.json();
            } else {
                /* If status code is not 200 */
                return PromiseRejectionEvent('Error: ' + response.status);
            }})
        .then(function (data) {
            if(data.Events.length > 0){
                /* for each event, create div with event image, title, and date */
                divHTML = `<div id="dcc-eventmetrics">`;

                for (var i = 0; i < data.Events.length; i++) {
                    if(data.Events[i].File_GUID == '' || data.Events[i].File_GUID == null) {
                        divHTML += `<div class="dcc-eventmetrics-event">
                        <div class="event-thumbnail empty"></div>
                        <div class="event-description">
                            <h3>${data.Events[i].Event_Title}</h3>
                            <div class="date">${data.Events[i].Event_Start_Date}</div>
                        </div>
                        </div>`;
                    } else {
                        divHTML += `<div class="dcc-eventmetrics-event">
                        <img src="https://my.dreamcitychurch.us/ministryplatformapi/files/${data.Events[i].File_GUID}" alt="${data.Events[i].Event_Title}" class="event-thumbnail" />
                        <div class="event-description">
                            <h3>${data.Events[i].Event_Title}</h3>
                            <div class="date">${data.Events[i].Event_Start_Date}</div>
                        </div>
                        </div>`;
                    }
                }

                document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;

            } else {
                divHTML = `<div id="dcc-eventmetrics"><div id="status-text"><p>No events found.</p></div></div>`;
            }
        })
        .catch(function (error) {
            divHTML = `<div id="dcc-eventmetrics"><div id="tatus-text"><p>Uh oh, something went wrong.<br /><br />We're having trouble communicating with our services. Please try again later.</p></div></div>`;
                document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;
        });
    }

window.onload = setTimeout(getCurrentEvents, 500);