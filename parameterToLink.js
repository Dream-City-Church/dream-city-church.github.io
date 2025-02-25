// This script will copy the value of any parameters in the address bar then append those parameters to any <a> element with the class of "parameter-link"
// This is useful for when you want to pass parameters from one page to another
// Example: http://www.example.com/?parameter1=value1&parameter2=value2
// <a href="http://www.example.com/newpage" class="parameter-link">Link</a>
// The above link will be converted to http://www.example.com/newpage?parameter1=value1&parameter2=value2

// Get the parameters from the address bar
var urlParams = new URLSearchParams(window.location.search);

// Wait for page to finish loading then loop through all the <a> elements with the class of "parameter-link"
document.addEventListener("DOMContentLoaded", function() {
    var parameterLinks = document.querySelectorAll(".parameter-link");
    parameterLinks.forEach(function(link) {
        // Loop through all the parameters in the address bar
        urlParams.forEach(function(value, key) {
            // Append the parameters to the href of the link
            if (link.href.includes("?")) {
                link.href += "&" + key + "=" + value;
            } else {
                link.href += "?" + key + "=" + value;
            }
        });
    });
});