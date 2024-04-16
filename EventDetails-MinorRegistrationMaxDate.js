function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForDateOfBirth(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForDateOfBirth(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#attendeeDateOfBirth')) {
        updateDateOfBirth();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForOptionPrices,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function updateDateOfBirth(){
    var DateOfBirthField = document.querySelector('mpp-event-details').shadowRoot.querySelector('#attendeeDateOfBirth');
    
    /* Set max date value to yesterday in Date Of Birth field */
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    var dd = yesterday.getDate();
    var mm = yesterday.getMonth()+1; //January is 0!
    var yyyy = yesterday.getFullYear();
    if(dd<10) { dd='0'+dd; }
    if(mm<10) { mm='0'+mm; }
    yesterday = yyyy+'-'+mm+'-'+dd;
    DateOfBirthField.setAttribute('max', yesterday);
}

window.onload=waitForShadow(100,1,40);