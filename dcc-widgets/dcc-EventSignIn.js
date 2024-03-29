// Set current version
var dccGroupSignInVersion = "1.0.230912";
console.log('dcc-GroupSignIn.js version ' + dccGroupSignInVersion + ' loaded.');

// Local Storage for saving user data a prefill form
var savedContactInfo = localStorage.getItem('dcc-quickform-contactinfo');

// Check if is additional person
var isAdditional=getUrlVars()["additional"]


// Main App
function loadEventSignIn() {
    var emailRegex = '[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.+[a-zA-Z0-9-]+';

    /*Initialize loading spinner*/
    divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementsByTagName("dcc-EventSignIn")[0].innerHTML = divHTML;

    /*Set API options*/
    const params = {
        "EventId": getUrlVars()["id"]
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch('https://prod-27.westus2.logic.azure.com:443/workflows/779544a2ee3e412598d11d048ff1bb2f/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tmDZsq2CiSCq-tmh4Pzc0-pxNbolivvrGXrunyTVQbw', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            console.log(data.status);
            if(data.status=="success"){
                var headerDisplay = data.File_GUID ? "block" : "none";
                divHTML = `
                <div id="header-image" style="display: ${headerDisplay};background-image: url(https://my.dreamcitychurch.us/ministryplatformapi/files/${data.File_GUID})"></div>
                <div id="qr-image" style="display: none;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${window.location.href}" /></div>
                <div id="dcc-signinform">
                <div id="form-description-text">Please complete this form so that we know you attended <span class="datapoint">${data.Event_Title}</span> on <span class="datapoint">${data.Event_Start_Date}</span></div>
                <form id="sign-in-form" class="form-horizontal">
                <fieldset>
                <!-- First Name -->
                <div class="form-group">
                  <label class="col-md-4 control-label" for="first_name">First Name</label>  
                  <div class="col-md-4">
                  <input id="form_first_name" name="first_name" type="text" placeholder="" class="form-control input-md" required="">
                    
                  </div>
                </div>
                
                <!-- Last Name -->
                <div class="form-group">
                  <label class="col-md-4 control-label" for="last_name">Last Name</label>  
                  <div class="col-md-4">
                  <input id="form_last_name" name="last_name" type="text" placeholder="" class="form-control input-md" required="">
                    
                  </div>
                </div>
                
                <!-- Email Address -->
                <div class="form-group">
                  <label class="col-md-4 control-label" for="email_address">Email Address</label>  
                  <div class="col-md-4">
                  <input id="form_email_address" name="email_address" type="email" placeholder="" class="form-control input-md" pattern="${emailRegex}" title="Please enter a full email address.">
                    
                  </div>
                </div>
                
                <!-- Phone Number -->
                <div class="form-group">
                  <label class="col-md-4 control-label" for="mobile_phone">Phone Number</label>  
                  <div class="col-md-4">
                  <input id="form_mobile_phone" name="mobile_phone" type="tel" placeholder="" maxlength="12" class="form-control input-md" onInput="this.value = phoneFormat(this.value)">
                    
                  </div>
                </div>

                <!-- Event ID -->
                <div class="form-group">
                  <div class="col-md-4">
                  <input id="form_event_id" name="event_id" type="hidden" value="${data.Event_ID}">
                  </div>
                </div>
                
                <!-- Reset Button -->
                <div class="form-group reset-container">
                    <label class="col-md-4 control-label" for="reset"></label>
                    <div class="col-md-4">
                        <button id="resetCheckInForm" name="reset-btn" type="button" class="btn btn-reset" onclick="clearForm()">Reset Form</button>
                    </div>
                </div>
                
                <!-- Submit Button -->
                <div class="form-group submit-container">
                  <label class="col-md-4 control-label" for="submit"></label>
                  <div class="col-md-4">
                    <button id="submitCheckInForm" name="submit" type="submit" class="btn btn-primary">Sign In</button>
                  </div>
                </div>
                
                </fieldset>
                </form>
                </div>`;

                document.getElementsByTagName("dcc-EventSignIn")[0].innerHTML = divHTML;

                // Prefill form if data is saved
                if(savedContactInfo && isAdditional!="yes") {
                    var contactInfo = JSON.parse(savedContactInfo);
                    document.getElementById("form_first_name").value = contactInfo.First_Name ?? '';
                    document.getElementById("form_last_name").value = contactInfo.Last_Name ?? '';
                    document.getElementById("form_email_address").value = contactInfo.Email_Address ?? '';
                    document.getElementById("form_mobile_phone").value = contactInfo.Mobile_Phone ?? '';
                    document.querySelector('.btn-reset').style.display = "block";
                }

            } else if(data.status=="expired-event"){
                var headerDisplay = data.File_GUID ? "block" : "none";
                divHTML = `
                <div id="header-image" style="display: ${headerDisplay};background-image: url(https://my.dreamcitychurch.us/ministryplatformapi/files/${data.File_GUID})"></div>
                <div id="dcc-signinform">
                <div id="form-description-text">Sorry, it looks like <strong>${data.Event_Title}</strong> already occured on <strong>${data.Event_Start_Date}</strong>.<br /><br />Sign in for this event is closed.</div>
                </div>`;

                document.getElementsByTagName("dcc-EventSignIn")[0].innerHTML = divHTML;

            } else if(data.status=="event-not-found"){
                divHTML = `
                <div id="dcc-signinform">
                <div id="form-description-text">Uh oh, something went wrong.<br /><br />We couldn't find any events at this link. It may have been moved or deleted.</div>
                </div>`;

                document.getElementsByTagName("dcc-EventSignIn")[0].innerHTML = divHTML;

            } else {
                /*Report something went wrong - failure response from server*/
                console.log('Event data response failure. Returning error.');
                divHTML = divHTML+`<div id="dcc-signinform"><div id="form-description-text"><p>Uh oh, something went wrong.<br /><br />We're having trouble communicating with our services. Please try again later.</p></div></div>`;
                document.getElementsByTagName("dcc-EventSignIn")[0].innerHTML = divHTML;
            }
        })
        .catch(function (fail) {
            /*Report something went wrong - couldn't connect to API*/
            console.log('Event data connection failure. Returning error.');
            divHTML = `<p>Sorry, something went wrong. Please try again later.</p>`;
            document.getElementsByTagName("dcc-EventSignIn")[0].innerHTML = divHTML;
        })
        .then(function (createFormListener) {
            if(document.getElementById("sign-in-form")){
                document.getElementById("sign-in-form").addEventListener("submit", SubmitFormListener);
            }
        })

}

// Validate and submit form
function SubmitFormListener() {
    console.log('Submit click detected');

    if(document.getElementById("form_email_address").value == "" && document.getElementById("form_mobile_phone").value == "") {
        event.preventDefault();
        alert("Please enter an email address or phone number.");
    } else {
        if(this.checkValidity()) {
            event.preventDefault();
            submitEventSignIn();
        }
    }
}

// Clear form and local storage
function clearForm() {
    localStorage.removeItem('dcc-quickform-contactinfo');
    document.getElementById("sign-in-form").reset();
}

function submitEventSignIn() {
    /*Set API options*/
    const params = {
        "Event_ID": document.getElementById("form_event_id").value,
        "First_Name": document.getElementById("form_first_name").value,
        "Last_Name": document.getElementById("form_last_name").value,
        "Email_Address": document.getElementById("form_email_address").value,
        "Mobile_Phone": document.getElementById("form_mobile_phone").value
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    var divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementById("dcc-signinform").innerHTML = divHTML;
    fetch('https://prod-13.westus2.logic.azure.com:443/workflows/1b11793e1b9b400e89f137820e0852c6/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eokGnYOfjDaB78nBjC8FAgjgJf5ihpPlVSErMcZvfhk', options)
        .then(function (response) {return response.json();})
        .then(function (submitted) {
            if(isAdditional!="yes"){
                var submitAnotherUrl = window.location.href + "&additional=yes";
            } else {
                var submitAnotherUrl = window.location.href;
            }

            divHTML = `<div id="sign-in-confirmation-message" class="sign-in-success"><p style="font-weight:bold;">You have been signed in!</p><p>You may close this window or <a href="${submitAnotherUrl}">click here</a> to sign in someone else.</p></div>`;
            document.getElementById("dcc-signinform").innerHTML = divHTML;

            // If not additional person, save contact info to local storage
            if(isAdditional!="yes"){
                var contactInfoReceived = {First_Name: submitted.First_Name,Last_Name: submitted.Last_Name,Email_Address: submitted.Email_Address,Mobile_Phone: submitted.Mobile_Phone};
                localStorage.setItem('dcc-quickform-contactinfo', JSON.stringify(contactInfoReceived));
            }
        })
        .catch(function (notSubmitted){
            console.log(notSubmitted)
            divHTML = `<div id="sign-in-confirmation-message" class="sign-in-failure"><p style="font-weight:bold;">Sorry, something went wrong.</p><p>Please try again later. <a href="javascript:window.location.href=window.location.href">Click here</a> to reload the page.</p></div>`;
            document.getElementById("dcc-signinform").innerHTML = divHTML;
        })
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function phoneFormat(input) {//returns ###-###-####
    input = input.replace(/\D/g,'');
    var size = input.length;
    if (size>3) {input=input.slice(0,3)+"-"+input.slice(3,12)}
    if (size>6) {input=input.slice(0,7)+"-" +input.slice(7,12)}
    return input;
}

window.onload = setTimeout(loadEventSignIn, 500);