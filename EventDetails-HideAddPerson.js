// Description: This script will wait for the shadowroot to load then add a disclaimer to the event details page for SMS messaging.

function waitForShadowHideAddPerson(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForAddPerson(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadowHideAddPerson,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForAddPerson(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#addAnotherButton')) {
        hideAddPersonButton();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForAddPerson,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function hideAddPersonButton(){
    // Get the value of "id" parameter from the URL
        const urlIdParams = new URLSearchParams(window.location.search);
        const urlId = urlIdParams.get('id');

        const blockedIds = ['90893', '456', '789'];

        console.log('ID from URL:', urlId);

        // Check if the "id" parameter is present and not empty
        if (urlId) {
            // If the ID value is in the blocked ID list, find divs with id "addAnotherButton" and set inline style to hide them
            if (blockedIds.includes(urlId)) {
                const addAnotherButtons = document.querySelector('mpp-event-details').shadowRoot.querySelectorAll("#addAnotherButton");
                addAnotherButtons.forEach(button => {
                    button.style.display = 'none';
                });
            }
        }
        // If the ID value is not in the blocked ID list, do nothing
}

window.onload=waitForShadowHideAddPerson(100,1,40);