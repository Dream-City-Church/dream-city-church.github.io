function waitForShadow(timeToWait, currentRun, maxRun) {
    if (document.querySelector('mpp-user-login').shadowRoot) {
        waitForLoginBtn(timeToWait, 1, maxRun);
    } else if (maxRun > currentRun - 1) {
        currentRun = currentRun + 1;
        setTimeout(waitForShadow, timeToWait, timeToWait, currentRun, maxRun);
    }
}

function waitForLoginBtn(timeToWait, currentRun, maxRun) {
    if (document.querySelector('mpp-user-login').shadowRoot.querySelector('#loginButton')) {
        console.log('click');
        if (document.querySelector('mpp-user-login').shadowRoot.querySelector('#loginButton').style.display != 'none') {
            document.querySelector('mpp-user-login').shadowRoot.querySelector('#loginButton').click();
        } else {
            getContactGuid();
        }
    } else if (maxRun > currentRun - 1) {
        currentRun = currentRun + 1;
        setTimeout(waitForLoginBtn, timeToWait, timeToWait, currentRun, maxRun);
    }
}

function getContactGuid() {
    new Date().setDate()
    let authToken = localStorage.getItem('mpp-widgets_AuthToken');
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`}
    };
    fetch( 'https://my.dreamcitychurch.us/ministryplatformapi/oauth/connect/userinfo', options )
        .then(function (response) {return response.json();})
        .then(function (data) {
            console.log(data.ext_Contact_GUID);
            document.getElementById("input_34_8").value=data.ext_Contact_GUID;
            }
        )
    }

window.onload=waitForShadow(100,1,40);