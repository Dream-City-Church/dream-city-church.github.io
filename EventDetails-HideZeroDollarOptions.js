function waitForShadow(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot) {
        waitForOptionPrices(timeToWait,1,maxRun);
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForShadow,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function waitForOptionPrices(timeToWait,currentRun,maxRun) {
    if (document.querySelector('mpp-event-details').shadowRoot.querySelector('.option-price')) {
        updateOptionPrices();
    } else if (maxRun > currentRun-1) {
        currentRun = currentRun+1;
        setTimeout(waitForOptionPrices,timeToWait,timeToWait,currentRun,maxRun);
    }
}

function updateOptionPrices(){
    var OptionPrices = document.querySelector('mpp-event-details').shadowRoot.querySelectorAll('.option-price');
    console.log(OptionPrices);
    for (var i = 0; i < OptionPrices.length; i++) {
        if(OptionPrices.item(i).innerHTML=="$0.00"){
            OptionPrices.item(i).innerHTML="";
        }
    }
}

window.onload=waitForShadow(100,1,40);