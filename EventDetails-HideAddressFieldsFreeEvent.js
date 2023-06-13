function waitForShadowHideAddress(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForRegistrationContainer(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadowHideAddress,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForRegistrationContainer(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#registrationTotalContainer')) {
        if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#registrationTotalContainer').computedStyleMap.display === 'none') {
            updateAddressFields();
        }
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForRegistrationContainer,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function updateAddressFields(){
    var AddressFields = document.querySelector('mpp-event-details').shadowRoot.querySelectorAll('#addressFormWrapper');
    console.log('Hiding address fields');
    AddressFields.style.display = 'none';
}

window.onload=waitForShadowHideAddress(100,1,40);