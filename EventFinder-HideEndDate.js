function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-finder').shadowRoot) {
        waitForDateFields(timeToWait,1,maxRun);
        SearchButtonListener(timeToWait);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForDateFields(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-finder').shadowRoot.querySelector('.event-date-range')) {
        updateDateFields();
        ShowCampusPicker();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForDateFields,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function ShowCampusPicker(){
    var FormFields = document.querySelector('mpp-event-finder').shadowRoot.querySelectorAll('.mppw-form-field__static-container');
    for (var i = 0; i < FormFields.length; i++) {
        if(FormFields.item(i).style.display==="none") {
            console.log('Showing campus picker')
            FormFields.item(i).style.display="inherit";
        }
    }
}

function updateDateFields(){
    var DateFields = document.querySelector('mpp-event-finder').shadowRoot.querySelectorAll('.event-date-range');
    console.log('Hiding end dates.');
    for (var i = 0; i < DateFields.length; i++) {
        DateFields.item(i).innerHTML = DateFields.item(i).innerHTML.replace(/- [0-9].*/gm,'');
    }
}

function SearchButtonListener(timeToWait){
    const SearchButton = document.querySelector('mpp-event-finder').shadowRoot.querySelector('#searchButton');
    const currentRun=1;
    const maxRun=40;
    SearchButton.addEventListener('click',event => {
        setTimeout(waitForDateFields,timeToWait,timeToWait,currentRun,maxRun);
    })
}

window.onload=waitForShadow(100,1,40);