// Description: This script will wait for the shadowroot to load then set the required Frequency dropdown to a value of 1

function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-pledge-campaign').shadowRoot) {
        waitForFrequencyField(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForFrequencyField(timeToWait,currentRun,maxRun) {
    var dropdownField = document.querySelector('mpp-pledge-campaign').shadowRoot.querySelector('#Frequency');
    if (dropdownField) {
        // Pause to allow widget to finish loading
        setTimeout(function() {
            console.log('Setting Frequency dropdown to 1');
            dropdownField.value=1;
            dropdownField.dispatchEvent(new Event('change'));
        }, 5000);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForFrequencyField,timeToWait,timeToWait,currentRun,maxRun);
    }
}

window.onload=waitForShadow(100,1,40);