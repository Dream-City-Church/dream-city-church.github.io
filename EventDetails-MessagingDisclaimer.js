// Description: This script will wait for the shadowroot to load then add a disclaimer to the event details page for SMS messaging.

function waitForShadow(timeToWait,currentRun,maxRun) {
    console.log('waiting for shadow');
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForContactInfoForm(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForContactInfoForm(timeToWait,currentRun,maxRun) {
    console.log('waiting for contact info form');
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#contactInfoForm')) {
        insertSmsDisclaimer();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForContactInfoForm,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function insertSmsDisclaimer(){
    console.log('inserting sms disclaimer');
    var smsDisclaimer = `<div id="messaging-disclaimer" style="
        font-size: 0.75rem;
        margin-top: 0.5rem;
        line-height: 1rem;
        ">By providing your phone number, you agree to receive text messages from Dream City Church in accordance with our <a href="">Terms of Service</a> and <a href="">Privacy Policy</a>. Reply STOP to cancel. Msg rates may apply.</div>`;
    var ContactInfoForm = document.querySelector('mpp-event-details').shadowRoot.querySelector('#parentInfoForm');
    // if ContactInfoForm is not found, try a different selector
    if (!ContactInfoForm) {
        ContactInfoForm = document.querySelector('mpp-event-details').shadowRoot.querySelector('#contactInfoForm');
    }
    // insert disclaimer at end of ContactInfoForm container
    ContactInfoForm.insertAdjacentHTML('beforeend',smsDisclaimer);    
}

window.onload=waitForShadow(100,1,40);