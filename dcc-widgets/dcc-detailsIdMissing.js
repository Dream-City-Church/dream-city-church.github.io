// This script will check if an ID parameters is in the URL
// If an ID parameter is not found, update no-id DIV with a message
// Then removes elements mpp-event-details and mpp-group-details

// Get the URL parameters
var urlParams = new URLSearchParams(window.location.search);

// Check if the ID parameter exists and that it has a value (not empty)
if (urlParams.has('id') && urlParams.get('id') != "") {
    // If it exists, do nothing!
} else {
    // Variable with styles for #no-id
    var divStyle = "display: inline-block;width: 100%;text-align: center;padding: 2rem;";

    // Update #no-id div with the styles
    document.getElementById("no-id").setAttribute("style", divStyle);

    // Update the #no-id with a message
    document.getElementById("no-id").innerHTML = "Sorry, looks like this link isn't valid. Check the URL and try again.";

    // Set initial return link value
    var returnLink = "../";

    // Check if return link value exists in the #no-id element, update variable
    if (document.getElementById("no-id").hasAttribute("data-return-link")) {
        returnLink = document.getElementById("no-id").getAttribute("data-return-link");
    }

    // Update the #no-id element with the return link
    document.getElementById("no-id").innerHTML += "<br><a href='" + returnLink + "'>Return to the previous page</a>";
    
    // Remove Event Details and Group Details elements
    var eventWidgets = document.getElementsByTagName('mpp-event-details');
    var groupWidgets = document.getElementsByTagName('mpp-group-details');
    while (eventWidgets[0]) {
        eventWidgets[0].parentNode.removeChild(eventWidgets[0]);
    };
    while (groupWidgets[0]) {
        groupWidgets[0].parentNode.removeChild(groupWidgets[0]);
    };
}
