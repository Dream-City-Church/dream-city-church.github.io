// This script will update a form field with the value from the URL parameter "source"

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-custom-form').shadowRoot) {
        waitForSourceField(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForSourceField(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-custom-form').shadowRoot.querySelector('#mp_customform_2700')) {
        updateSourceField();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForSourceField,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function updateSourceField(){
    var source = getUrlVars()["source"];
    var SourceField = document.querySelector('mpp-custom-form').shadowRoot.querySelector('#mp_customform_2700');
    SourceField.value = source;
    console.log('Updated source field with value: '+source);
}

window.onload=waitForShadow(100,1,40);