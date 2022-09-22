function testForToken() {
    console.log('Testing for tokens...');
    let authToken = localStorage.getItem('mpp-widgets_AuthToken');
    let tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');

    if(authToken==null || authToken=='null' || tokenExpires==null || tokenExpires=='null' || new Date(tokenExpires) < new Date()) {
        console.log('Token not found. Waiting...');
        waitForToken();
    } else {
        console.log('Token found. Proceeding...');
        householdPRF();
    }
}

function waitForToken() {
    let authToken = localStorage.getItem('mpp-widgets_AuthToken');
    let tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');
    console.log('Starting wait loop...');
        for (var i=1; i <= 5; i++) {
            setTimeout(function() {
                authToken = localStorage.getItem('mpp-widgets_AuthToken');
                tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');
                if((authToken !== null && authToken !== 'null') && new Date(tokenExpires) > new Date()) {console.log('Token found after waiting. Proceeding...');householdPRF();};
                if(i=5 && (authToken == null || authToken == 'null' || new Date(tokenExpires) < new Date())) {console.log('Token not found after waiting...');notSignedIn();};
                console.log('Waiting 500 msecs...');
            }, 500*i);
            if((authToken !== null && authToken !== 'null') && new Date(tokenExpires) > new Date()) {break;};
            if(i=5) {break;};
        }
}

function notSignedIn() {
    let divHTML = "";
    console.log('No token found. Displaying sign in message.');
    divHTML = '<p>Please sign in to view this page.</p>';
    document.getElementsByTagName("dcc-householdPRF")[0].innerHTML = divHTML;
    document.getElementsByTagName("dcc-householdPRF")[0].className = "statusFail";
}

function householdPRF() {
    let authToken = localStorage.getItem('mpp-widgets_AuthToken');
    let tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');
    let divHTML = "";
    console.log('Sending API call...');
    const params = {
        "authToken": authToken,
        "expires": new Date(tokenExpires)
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-09.westus2.logic.azure.com:443/workflows/0d3b662e928140bfa59d66f03bdf38f1/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=h7nAuF3CZ-p17MuTv7oKZmIlkWqssa-QAercej_A_gU', options )
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            if(data.status=="success"){
                console.log('API success. Returning data.');
                divHTML = `<p><strong>The below data was returned:</strong><br /><br />`;
                    data.members.forEach((person) => {
                        divHTML = divHTML+`${data.members.FirstName} ${data.members.LastName}, ${data.members.Expires} (Status: ${data.members.FirstName})`
                    }

                    )

                document.getElementsByTagName("dcc-householdPRF")[0].innerHTML = divHTML;
            } else {
                console.log('API returned failure. Returning error.');
                divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
                document.getElementsByTagName("dcc-householdPRF")[0].innerHTML = divHTML;
            }
        })
        .catch(function (fail) {
            console.log('API call failed. Returning error.');
            divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
            document.getElementsByTagName("dcc-householdPRF")[0].innerHTML = divHTML;
        }
    )
}

window.onload = setTimeout(testForToken, 500);