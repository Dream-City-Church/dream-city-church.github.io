function waitForShadowHideAddress(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForRegistrationContainer(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadowHideAddress,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForRegistrationContainer(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#addressLine1')) {
        if(!document.querySelector('mpp-event-details').shadowRoot.querySelector('#addressLine1').getAttribute("required")) {
            console.log('Reg container found');
            updateAddressFields();
        }
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForRegistrationContainer,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function updateAddressFields(){
    const addressFormWrapper = document.querySelector('mpp-event-details').shadowRoot.querySelector('#addressFormWrapper');
    addressFormWrapper.style.display = 'none';
    console.log('Hiding address fields');
}

window.onload=waitForShadowHideAddress(100,1,40);