function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-finder').shadowRoot) {
        ShowCampusPicker();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}



window.onload=waitForShadow(100,1,40);