function verifyEmail() {
    // Get container from webpage after DOM loads
    var container = document.getElementsByTagName('dcc-emailVerification')[0];

    // Get cid parameter from URL
    var urlParams = new URLSearchParams(window.location.search);
    var cid = urlParams.get('cid');

    // If no cid parameter, display error message
    if (!cid) {
        container.innerHTML = '<p>There is a problem with the link provided.<br />Please check the link you received and try again.</p>';
        return;
    }

    // Set loading message in container
    container.innerHTML = '<p>Loading...</p><br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>';

    // Create JSON object with cid to send to server
    var data = { "contact_id": cid };

    // Set remote server URL
    var url = 'https://prod-24.westus2.logic.azure.com:443/workflows/4addd51425d94afeb54390e69a92aba7/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=R_F7ZdwXLob3kMqMnMTfoBBStpvV7sICasv3ohVSjf8';

    // Create Fetch request to server
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    })

    // .then process response
    .then(response => response.json())

    // Let user know the status of the verification
    .then(data => {
        if (data.status == 'success') {
            container.innerHTML = `<p>Your email address ${data.email_address} has been verified.<br />You may close this window.</p>`;
        } else {
            container.innerHTML = '<p>There was a problem verifying your email address.<br />Please check the link you received and try again.</p>';
        }
    })
}

// On load, verify email address
window.addEventListener('load', verifyEmail);