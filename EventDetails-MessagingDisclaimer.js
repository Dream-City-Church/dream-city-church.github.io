// Description: This script will wait for the shadowroot to load then add a disclaimer to the event details page for SMS messaging.

function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForContactInfoForm(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForContactInfoForm(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#contactInfoForm')) {
        insertSmsDisclaimer();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForContactInfoForm,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function insertSmsDisclaimer(){
    var smsDisclaimer = `<div id="messaging-disclaimer">By providing your phone number, you agree to receive text messages from Dream City Church in accordance with our <a href="/sms-tos/" target="_blank">Terms of Service</a> and <a href="/privacy-policy/" target="_blank">Privacy Policy</a>. Reply STOP to cancel. Msg rates may apply.</div>`;
    var ContactInfoForm = document.querySelector('mpp-event-details').shadowRoot.querySelector('#contactInfoForm');
    var ParentInfoForm = document.querySelector('mpp-event-details').shadowRoot.querySelector('#parentInfoForm');

    // Check if #messaging-disclaimer doesn't already exist inside #contactInfoForm
    if(!ContactInfoForm.querySelector('#messaging-disclaimer')){
        ContactInfoForm.insertAdjacentHTML('beforeend',smsDisclaimer);
    }
    // Check if #messaging-disclaimer doesn't already exist inside #parentInfoForm
    if(!ParentInfoForm.querySelector('#messaging-disclaimer')){
        ParentInfoForm.insertAdjacentHTML('beforeend',smsDisclaimer);
    }

}

window.onload=waitForShadow(100,1,40);