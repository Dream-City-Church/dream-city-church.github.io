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
        if(document.querySelector('mpp-event-details').shadowRoot.querySelector('#addressLine1').hasAttribute('required')) {
            console.log('Reg container found');
            updateAddressFields();
        }
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForRegistrationContainer,timeToWait,timeToWait,currentRun,maxRun);
    }

    //Watch for changes on Total
        const regTotalValue = document.querySelector("#registrationTotalValue");
        const observer = new MutationObserver(() => {
            if (regTotalValue.innerHTML != "$0.00"){
                    document.querySelector("#registrationTotalValue").style.display = 'block';
            }
        });
        observer.observe(regTotalValue, { characterData: true, subtree: true, childList: true, attributes: true });
}

function updateAddressFields(){
    var AddressFields = document.querySelector('mpp-event-details').shadowRoot.querySelector('#addressFormWrapper');
    console.log('Hiding address fields');
    AddressFields.style.display = 'none';
}

window.onload=waitForShadowHideAddress(100,1,40);