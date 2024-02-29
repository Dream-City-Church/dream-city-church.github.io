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
                        divHTML += `<div class="dcc-eventmetrics-event">
                        <div class="event-thumbnail" style="background-image: url(https://my.dreamcitychurch.us/ministryplatformapi/files/${data.Events[i].File_GUID});"></div>
                        <div class="event-description" style="background-image:">
                            <h3>${data.Events[i].Event_Title}</h3>
                            <div class="date">${data.Events[i].Event_Start_Date}</div>
                        </div>`;
                        if (data.Events[i].Event_Metrics.length > 0){
                            divHTML += `<div class="event-metrics">`;
                            for (var j = 0; j < data.Events[i].Event_Metrics.length; j++) {
                                divHTML += `<div class="metric">
                                    <div class="event-metric">${data.Events[i].Event_Metrics[j].Metric_Title}: ${data.Events[i].Event_Metrics[j].Numerical_Value}</div>
                                </div>`;
                            }
                            divHTML += `</div>`;
                        }
                        /* Add form with dropdown for selecting a Metric and an input for the metric value */
                        divHTML += `
                        <div class="event-metric-form">
                            <form id="event-metric-form-${i}">
                                <select name="metric" id="metric-${i}">
                                    <option value="0">Select a Metric</option>`;
                                    for (var k = 0; k < data.Metrics.length; k++) {
                                        divHTML += `<option value="${data.Metrics[k].Metric_ID}">${data.Metrics[k].Metric_Title}</option>`;
                                    }
                                    divHTML += `
                                </select>
                                <input type="number" id="metric-value-${i}" name="metric-value" placeholder="Enter Value">
                                <button type="button" onclick="submitMetric(${i}, ${data.Events[i].Event_ID})">Submit</button>
                            </form>
                        </div></div>`;
                }

                document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;

            } else {
                divHTML = `<div id="dcc-eventmetrics"><div id="status-text"><p>No events found.</p></div></div>`;
            }
        })
        .catch(function (error) {
            console.log(error);
            divHTML = `<div id="dcc-eventmetrics"><div id="tatus-text"><p>Uh oh, something went wrong.<br /><br />We're having trouble communicating with our services. Please try again later.</p></div></div>`;
                document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;
        })
    }

window.onload = setTimeout(getCurrentEvents, 500);