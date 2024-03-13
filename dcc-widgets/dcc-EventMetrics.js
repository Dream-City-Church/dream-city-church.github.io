// Set current version
var dccGroupMetricsVersion = "1.0";
console.log('Event Metrics version ' + dccGroupMetricsVersion + ' loaded.');

// Set Global Variables
var userId = getUrlVars()["userId"];
var contactGuid = getUrlVars()["contactGuid"];

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
    if (contactGuid == null) {
        divHTML = `<div id="dcc-eventmetrics"><div id="status-text"><p>You are not authorized to view this page.</p></div></div>`;
        document.getElementsByTagName("dcc-EventMetrics")[0].innerHTML = divHTML;
        stop;
    }

    /* Call Event Metrics Load API */
    const params = {
        "Contact_GUID": contactGuid
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch('https://prod-09.westus2.logic.azure.com:443/workflows/9eefa5638fea445eb416b637d6219948/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXM1wj0RI6c_hdR4Lw5PGeFs_CtmtmsMGyuTZ4JTdCw', options)
        .then(function (response) {
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
                divHTML = `<div id="dcc-eventmetrics"><div id="overlay"></div>`;

                for (var i = 0; i < data.Events.length; i++) {
                        divHTML += `<div class="dcc-eventmetrics-event" id="eventmetrics-event-${data.Events[i].Event_ID}" >
                        <div class="event-thumbnail" style="background-image: url(https://my.dreamcitychurch.us/ministryplatformapi/files/${data.Events[i].File_GUID});" onclick="toggleEventMetrics(${data.Events[i].Event_ID},'open','thumbnail')"></div>
                        <div class="event-description"  onclick="toggleEventMetrics(${data.Events[i].Event_ID},'open','description')">
                            <h3 class="event-title">${data.Events[i].Event_Title}</h3>
                            <div class="location"><i class="fa-solid fa-location-pin"></i> ${data.Events[i].Event_Location}</div>
                            <div class="date"><i class="fa-regular fa-calendar-days"></i> ${data.Events[i].Event_Start_Date}</div>
                        </div>
                        <div class="event-metrics" id="event-${data.Events[i].Event_ID}-metrics">`;
                        if (data.Events[i].Event_Metrics.length > 0){
                            for (var j = 0; j < data.Events[i].Event_Metrics.length; j++) {
                                divHTML += `<div class="metric">
                                    <div class="event-metric"><i class="fa-solid fa-note"></i> ${data.Events[i].Event_Metrics[j].Metric_Title}: ${data.Events[i].Event_Metrics[j].Numerical_Value}</div>
                                </div>`;
                            }
                        }
                        /* Add form with dropdown for selecting a Metric and an input for the metric value */
                        divHTML += `
                        </div>
                        <div class="event-metric-form">
                            <form id="event-metric-form-${i}">
                                <select name="metric" id="metric-${i}" required >
                                    <option value="0">Select a Metric</option>`;
                                    for (var k = 0; k < data.Metrics.length; k++) {
                                        divHTML += `<option value="${data.Metrics[k].Metric_ID}">${data.Metrics[k].Metric_Title}</option>`;
                                    }
                                    divHTML += `
                                </select>
                                <input type="number" id="metric-value-${i}" name="metric-value" placeholder="Enter Value" required >
                                <textarea type="text" id="metric-notes-${i}" name="metric-notes" placeholder="Any additional notes" maxlength="250" ></textarea>
                                <button type="button" onclick="submitMetric(${i},${data.Events[i].Event_ID})">Submit</button>
                            </form>
                        </div>
                        <div class="close-event-metrics" onclick="toggleEventMetrics(${data.Events[i].Event_ID},'close','close button')">close</div>
                        </div>`;
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

function submitMetric(Form_ID,Event_ID) {
    /* Get Metric and Value from Form */
    var metricForm = document.getElementById('event-metric-form-'+Form_ID);
    var metricId = document.getElementById('metric-'+Form_ID).value;
    var metricText = document.getElementById('metric-'+Form_ID).options[document.getElementById('metric-'+Form_ID).selectedIndex].text;
    var metricValue = document.getElementById('metric-value-'+Form_ID).value;
    var metricNotes = document.getElementById('metric-notes-'+Form_ID).value;

    document.getElementById('metric-'+Form_ID).disabled = true;
    document.getElementById('metric-value-'+Form_ID).disabled = true;
    document.getElementById('metric-notes-'+Form_ID).disabled = true;

    /* Check if Metric and Value are valid */
    if (metricId == 0 || metricValue == "" || metricValue < 1) {
        document.getElementById('metric-'+Form_ID).disabled = false;
        document.getElementById('metric-value-'+Form_ID).disabled = false;
        document.getElementById('metric-notes-'+Form_ID).disabled = false;
        alert("Please select a metric and enter a value greater than 0.");
        return;
    }

    const params = {
        "Contact_GUID": contactGuid,
        "Event_ID": Event_ID,
        "Metric_ID": metricId,
        "Metric_Value": metricValue,
        "Metric_Notes": metricNotes
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch('https://prod-12.westus2.logic.azure.com:443/workflows/835aa031af4d4836ae7e3ba8d5f43586/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PvI4ZCT-K8otlzUMFjHjSkl1VICiC8Aug6zK2NGdv1E', options)
        .then(function (response) {
            /* If status code 200 */
            if (response.status == 200) {
                return;
            } else {
                /* If status code is not 200 */
                return PromiseRejectionEvent('Error: ' + response.status);
            }})
        .then(function (data) {
            divHTML = document.getElementById('event-'+Event_ID+'-metrics').innerHTML;
            divHTML += `<div class="metric">
                <div class="event-metric"><i class="fa-solid fa-note"></i> ${metricText}: ${metricValue}</div>`;

            document.getElementById('event-'+Event_ID+'-metrics').innerHTML = divHTML;

            metricForm.reset();
            document.getElementById('metric-'+Form_ID).disabled = false;
            document.getElementById('metric-value-'+Form_ID).disabled = false;
            document.getElementById('metric-notes-'+Form_ID).disabled = false;
        })
        .catch(function (error) {
            console.log(error);
            alert("Uh oh, something went wrong. We're having trouble communicating with our services. Please try again later.");

            document.getElementById('metric-'+Form_ID).disabled = false;
            document.getElementById('metric-value-'+Form_ID).disabled = false;
            document.getElementById('metric-notes-'+Form_ID).disabled = false;
        })
        
}

function toggleEventMetrics(eventId, action, source) {
    if (action == "close") {
        document.getElementById('eventmetrics-event-'+eventId).classList.remove('open-event-metric');
        document.getElementById('overlay').classList.remove('overlay-active');
        document.getElementById('overlay').setAttribute('onclick', 'return();');
    } else if (action == "open") {
        document.getElementById('eventmetrics-event-'+eventId).classList.add('open-event-metric');
        document.getElementById('overlay').classList.add('overlay-active');
        document.getElementById('overlay').setAttribute('onclick', 'toggleEventMetrics('+eventId+',\'close\',\'overlay\')');
    }
}

window.onload = setTimeout(getCurrentEvents, 500);