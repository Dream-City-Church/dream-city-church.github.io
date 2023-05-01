function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-finder').shadowRoot) {
        waitForDateFields(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForDateFields(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-finder').shadowRoot.querySelector('.event-date-range')) {
        updateDateFields();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForDateFields,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function updateDateFields(){
    var DateFields = document.querySelector('mpp-event-finder').shadowRoot.querySelectorAll('.event-date-range');
    console.log('Hiding end dates.');
    for (var i = 0; i < DateFields.length; i++) {
        DateFields.item(i).innerHTML = DateFields.item(i).innerHTML.replace(/- [0-9].*/gm,'');
    }
}

window.onload=waitForShadow(100,1,40);