// This script will notify the Reading Plan API when a user starts or completes a reading plan
// The 'started' aciton will be sent after the widget has loaded
// The 'completed' action will be sent after the user has scrolled to the bottom of the page at least 30 seconds after the page load event

// Setup for analytics tracking
/* Function for getting URL variables */
function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

var contactGuid = getUrlVars()["cid"];

// Generate a device ID to store as a permanent cookie
var deviceID = localStorage.getItem('deviceID');
if (!deviceID) {
    deviceID = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceID', deviceID);
}
// Get current URL
var url = window.location.origin;
var url = url + window.location.pathname;
// Get current page
var page = window.location.pathname.split("/").pop();
if (page === '') {
    page = window.location.pathname.split("/").slice(-2)[0];
}
// End analytics tracking setup

// After the widget has loaded content, send the 'started' action to the Reading Plan API
window.addEventListener('widgetLoaded', function(event) {
    var readingPlanApi = 'https://prod-04.westus2.logic.azure.com:443/workflows/3add150e07c446c2812cdd37d0b03575/triggers/HTTP_Request/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FHTTP_Request%2Frun&sv=1.0&sig=wHhlULb0ORefuncrGl4K69_CyJ-EL3yPdaBtxY7VTmA';
    var readingPlanID = getUrlVars()["readingPlanID"];
    var readingPlanDayID = getUrlVars()["readingPlanDayID"];
    var data = {
        action: 'started',
        cid: contactGuid,
        src: page,
        url: url,
        deviceID: deviceID,
        readingPlanID: readingPlanID,
        readingPlanDayID: readingPlanDayID
    };
    fetch(readingPlanApi, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    // Start a timer
    var startTime = new Date().getTime();
    var timeElapsed = 0;
    var timeRequired = 30000; // 30 seconds

    // Check if the user has scrolled to the bottom of the page
    var scrollHandler = function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            // Stop the timer
            var endTime = new Date().getTime();
            timeElapsed = endTime - startTime;

            // If the user has scrolled to the bottom of the page and at least 30 seconds have passed since the page load event
            if (timeElapsed >= timeRequired) {
                // Send the 'completed' action to the Reading Plan API
                var data = {
                    action: 'completed',
                    cid: contactGuid,
                    src: page,
                    url: url,
                    deviceID: deviceID,
                    readingPlanID: readingPlanID,
                    readingPlanDayID: readingPlanDayID
                };
                fetch(readingPlanApi, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                // Remove the scroll event listener
                window.removeEventListener('scroll', scrollHandler);
            }
        }
    };
});