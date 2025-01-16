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
    var readingPlanApi = 'https://dcc-apimanagement.azure-api.net/readingplan/action';
    var readingPlanID = Number(getUrlVars()["ReadingPlanID"]);
    var readingPlanDayID = Number(getUrlVars()["ReadingPlanDayID"]);
    var data = {
        ReadingPlanAction: 'started',
        Contact_GUID: contactGuid,
        Page: page,
        URL: url,
        Device_GUID: deviceID,
        ReadingPlanID: readingPlanID,
        ReadingPlanDayID: readingPlanDayID
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
                    ReadingPlanAction: 'completed',
                    Contact_GUID: contactGuid,
                    Page: page,
                    URL: url,
                    Device_GUID: deviceID,
                    ReadingPlanID: readingPlanID,
                    ReadingPlanDayID: readingPlanDayID
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

                // Check if the #day-completed element already exists. If not, add it to the #reading-plan-card element

                var dayCompletedElement = document.getElementById('day-completed');
                if (!dayCompletedElement) {
                    var dayCompletedElement = `<div id="day-completed" class="animation">Day Complete</div>`;
                    var readingPlanCard = document.getElementById('reading-plan-card');
                    readingPlanCard.insertAdjacentHTML('beforeend', dayCompletedElement);
                }
            }
        }
    };

    // Add a scroll event listener
    window.addEventListener('scroll', scrollHandler);

});