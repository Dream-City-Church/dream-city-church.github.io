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
    fetch('https://prod-04.westus2.logic.azure.com:443/workflows/9ca3fe0b28004cca9d76207dc75f7dc4/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ks5VRiZRp-sjVhC6tNRZDmhFj2DzZQXDsNtq7uch4Ac', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            console.log(data.status);
            if(data.status=="success"){
                divHTML = `<div class="event-title"><h2>${data.EventTitle}</h2></div><div class="event-start-date">${data.EventStartDate}</div><div class="event-registered-count">Registered: ${data.RegisteredCount}</div>`;
                divHTML = divHTML+`<div id="event-participants">`;
                data.EventParticipants[0].forEach((participant) => {
                    divHTML = divHTML+`<div class="participant-card">
                        <div class="participant-name">${participant.Participant_Name}</div>
                        <div class="registration-date">Registered at ${participant.Registration_Date}</div>`;
                    if(participant.Mobile_Phone){divHTML = divHTML+`<div class="participant-mobile"><a href="tel:${participant.Mobile_Phone}" target="_blank"><i class="fa-solid fa-mobile-screen"></i> ${participant.Mobile_Phone}</a></div>`;}
                    if(participant.Email_Address){divHTML = divHTML+`<div class="participant-email"><a href="mailto:${participant.Email_Address}" target="_blank"><i class="fa-solid fa-envelope"></i> ${participant.Email_Address}</a></div>`;}
                    if(participant.Paid_Total){divHTML = divHTML+`<div class="participant-paid">Paid: $${participant.Paid_Total}</div>`;}
                    if(participant.Selected_Options){divHTML = divHTML+`<div class="participant-options">Selected Options: ${participant.Selected_Options}</div>`;}
                    divHTML = divHTML+`</div>`;
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
        })
}

window.onload = setTimeout(loadEventParticipants, 500);