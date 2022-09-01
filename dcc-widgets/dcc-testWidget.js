let authToken = localStorage.getItem('mpp-widgets_AuthToken');
let tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');
let divHTML = "";

function testForToken() {
     if(!authToken || !tokenExpires) {
        waitForToken();
    } else {
        TestAzureLogicApp();
    }
}

function waitForToken() {
    console.log('Auth token not found. Waiting for loading');
        for (var i=1; i <= 5 && !authToken; i++) {
            setTimeout(function() {
                authToken = localStorage.getItem('mpp-widgets_AuthToken');
                tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');
                if(authToken !== null && authToken !== '') {TestAzureLogicApp;};
                if(i=5) {notSignedIn;};
            }, 250*i);
        }
}

function TestAzureLogicApp() {
    console.log('Token found.');
    const params = {
        "authToken": authToken,
        "expires": new Date(tokenExpires)
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-00.westus2.logic.azure.com:443/workflows/ffeb92b11bd144eda24ea28b510bf449/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mLIAvHXC7ccbthF00ms82b56jJFLRQQeYwPD8L8wI_Y', options )
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            divHTML = `<p><strong>The following user information was found:</strong><br />
                Name: ${data.nickname} ${data.last_name}<br />
                Email: ${data.email}<br />
                Mobile: ${data.mobile_phone}<br />
                DOB: ${data.date_of_birth}<br />
                Age: ${data.age}<br />
                Campus: ${data.campus}<br />
                Address: ${data.address1}, ${data.city}, ${data.state} ${data.zip}<br /></p>`;
            document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
        })
        .catch(function (fail) {
            divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
            document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
        }
    )
}

function notSignedIn() {
    console.log('User not signed in');
    divHTML = "Please sign in to view this page.";
    document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
    document.getElementsByTagName("dcc-testWidget")[0].className = "statusFail";
}

window.onload = setTimeout(testForToken, 500);