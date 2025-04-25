function waitForShadowHideAddress(timeToWait, currentRun, maxRun) {
    const eventDetails = document.querySelector('mpp-event-details');
    if (eventDetails && eventDetails.shadowRoot) {
        waitForRegistrationContainer(timeToWait, 1, maxRun);
    } else if (maxRun > currentRun - 1) {
        currentRun += 1;
        setTimeout(waitForShadowHideAddress, timeToWait, timeToWait, currentRun, maxRun);
    }
}

function waitForRegistrationContainer(timeToWait, currentRun, maxRun) {
    const eventDetails = document.querySelector('mpp-event-details');
    if (eventDetails && eventDetails.shadowRoot) {
        const addressLine1 = eventDetails.shadowRoot.querySelector('#addressLine1');
        if (addressLine1 && !addressLine1.getAttribute("required")) {
            console.log('Reg container found');
            updateAddressFields();
        } else if (maxRun > currentRun - 1) {
            currentRun += 1;
            setTimeout(waitForRegistrationContainer, timeToWait, timeToWait, currentRun, maxRun);
        }
    }
}

function updateAddressFields() {
    const eventDetails = document.querySelector('mpp-event-details');
    if (eventDetails && eventDetails.shadowRoot) {
        const shadowRoot = eventDetails.shadowRoot;
        const addressFormWrapper = shadowRoot.querySelector('#addressFormWrapper');
        
        if (addressFormWrapper) {
            // Create a <style> element
            const style = document.createElement('style');
            style.textContent = `
                #addressFormWrapper {
                    display: none !important;
                }
            `;
            // Append the <style> element to the shadow root
            shadowRoot.appendChild(style);
            console.log('Hiding address fields with inline style');
        } else {
            console.error('Element #addressFormWrapper not found');
        }
    } else {
        console.error('Shadow root not found');
    }
}


window.onload = function() {
    waitForShadowHideAddress(100, 1, 40);
};
