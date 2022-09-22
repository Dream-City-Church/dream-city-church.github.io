function testForToken() {
    console.log('Testing for tokens...');
    let authToken = localStorage.getItem('mpp-widgets_AuthToken');
    let tokenExpires = localStorage.getItem('mpp-widgets_ExpiresAfter');

    if(authToken==null || authToken=='null' || tokenExpires==null || tokenExpires=='null' || new Date(tokenExpires) < new Date()) {
        console.log('Token not found. Waiting...');
        waitForToken();
    } else {
        console.log('Token found. Proceeding...');
        TestAzureLogicApp();
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
                if((authToken !== null && authToken !== 'null') && new Date(tokenExpires) > new Date()) {console.log('Token found after waiting. Proceeding...');TestAzureLogicApp();};
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
    divHTML = '<p>Please sign in to view this page.</p><p><mpp-locale-selector customcss="https://dream-city-church.github.io/widget-styles-salient.css?cache=no"></mpp-locale-selector></p>';
    document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
    document.getElementsByTagName("dcc-testWidget")[0].className = "statusFail";
}

function TestAzureLogicApp() {
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
    fetch( 'https://prod-00.westus2.logic.azure.com:443/workflows/ffeb92b11bd144eda24ea28b510bf449/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mLIAvHXC7ccbthF00ms82b56jJFLRQQeYwPD8L8wI_Y', options )
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            if(data.status=="success"){
                console.log('API success. Returning data.');
                divHTML = `<p><strong>The following user information was found:</strong><br />
                    Name: ${data.nickname} ${data.last_name}<br />
                    Email: ${data.email}<br />
                    Mobile: ${data.mobile_phone}<br />
                    DOB: ${data.date_of_birth}<br />
                    Age: ${data.age}<br />
                    Campus: ${data.campus}<br />
                    Address: ${data.address1}, ${data.city}, ${data.state} ${data.zip}<br /></p>`;
                document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
            } else {
                console.log('API returned failure. Returning error.');
                divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
                document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
            }
        })
        .catch(function (fail) {
            console.log('API call failed. Returning error.');
            divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
            document.getElementsByTagName("dcc-testWidget")[0].innerHTML = divHTML;
        }
    )
}

window.onload = setTimeout(testForToken, 500);