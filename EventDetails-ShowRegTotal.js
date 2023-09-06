function waitForShadowRegTotal(timeToWait,currentRun,maxRun) {
        if (document.querySelector('mpp-event-details').shadowRoot) {
            waitForRegTotalContainer(timeToWait,1,maxRun);
        } else if (maxRun > currentRun-1) {
            currentRun = currentRun+1;
            setTimeout(waitForShadowRegTotal,timeToWait,timeToWait,currentRun,maxRun);
        }
    }
    
    function waitForRegTotalContainer(timeToWait,currentRun,maxRun) {
        if (document.querySelector('mpp-event-details').shadowRoot.querySelector('#registrationTotalValue')) {
            
                const regTotalValue = document.querySelector("#registrationTotalValue");
                const observer = new MutationObserver(() => {
                    if (regTotalValue.innerHTML != "$0.00"){
                            document.querySelector("#registrationTotalValue").style.display = 'block';
                    }
                });
                observer.observe(regTotalValue, { characterData: true, subtree: true, childList: true, attributes: true });  

        } else if (maxRun > currentRun-1) {
            currentRun = currentRun+1;
            setTimeout(waitForRegTotalContainer,timeToWait,timeToWait,currentRun,maxRun);
        }
    }
    
window.onload=waitForShadowRegTotal(100,1,40);
