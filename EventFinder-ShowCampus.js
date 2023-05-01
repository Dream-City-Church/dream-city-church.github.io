function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-finder').shadowRoot) {
        ShowCampusPicker();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function ShowCampusPicker(){
    var FormFields = document.querySelector('mpp-event-finder').shadowRoot.querySelectorAll('.mppw-form-field mppw-form-field__static-container');
    console.log('Showing campus picker')
    for (var i = 0; i < FormFields.length; i++) {
        if(FormFields.item(i).getElementsByClassName.style.display="none") {}
            FormFields.item(i).getElementsByClassName.style.display="inherit";
    }
}

window. Onload=waitForShadow(100,1,40);