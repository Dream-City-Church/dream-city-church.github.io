function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function loadEventParticipants() {
    console.log('Event Participants v0.2304.1');

    /*Initialize loading spinner*/
    divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementsByTagName("dcc-EventParticipants")[0].innerHTML = divHTML;
    
    /*Set API options*/
    const params = {
        "ContactGuid": getUrlVars()["ContactGuid"],
        "EventId": getUrlVars()["EventId"]
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-04.westus2.logic.azure.com:443/workflows/9ca3fe0b28004cca9d76207dc75f7dc4/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ks5VRiZRp-sjVhC6tNRZDmhFj2DzZQXDsNtq7uch4Ac', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            console.log(data.status);
            if(data.status=="success"){
                divHTML = `<div id="event-participants">`;
                
                data.EventParticipants[0].forEach((participant) => {
                    divHTML = divHTML+`<div class="participant-card">
                        <table>
                        <tr><td class="participant-name">${participant.Participant_Name}</td></tr>
                        <tr><td class="participant-contact">${participant.Mobile_Phone} ${participant.Email_Address}</td></tr>
                        <tr><td class="participant-paid">Total Paid: ${participant.Paid_Total}</td></tr>
                        <tr><td class="participant-remaining">Payment Remaining: ${participant.Remaining}</td></tr>
                        <tr><td class="participant-options">Registration Options: ${participant.Selected_Options}</td></tr>
                        </table>
                        </div>`;
                    }
                )
                
                divHTML = divHTML+`</div>`;
                document.getElementsByTagName("dcc-EventParticipants")[0].innerHTML = divHTML;

            } else {
                /*Report something went wrong - failure response from server*/
                console.log('Event Participant response failure. Returning error.');
                divHTML = divHTML+`<p>Sorry, something went wrong. Please try again later.</p>`;
                document.getElementsByTagName("dcc-EventParticipants")[0].innerHTML = divHTML;
            }
        })
        .catch(function (fail) {
            /*Report something went wrong - couldn't connect to API*/
            console.log('Event Participant connection failure. Returning error.');
            divHTML = `<p>Sorry, something went wrong. Please try again later.</p>`;
            document.getElementsByTagName("dcc-EventParticipants")[0].innerHTML = divHTML;
        } 
    
}

window.onload = setTimeout(loadEventParticipants, 500);