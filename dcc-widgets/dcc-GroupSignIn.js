// Set current version
var dccGroupSignInVersion = "1.0.0";
console.log('dcc-GroupSignIn.js version ' + dccGroupSignInVersion + ' loaded.');

// Local Storage for saving user data a prefill form
var savedContactInfo = localStorage.getItem('dcc-quickform-contactinfo');

// Check if is additional person
var isAdditional= getUrlParams()["additional"]

// Main App
function loadGroupSignIn(groupId) { 

    // Loading Spinner
    divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementsByTagName("dcc-GroupSignIn")[0].innerHTML = divHTML;

    // Get URL param if not passed in
    if(!groupId) {
        groupId = getUrlParams()["id"]
    }

    // Get Group Data
    if(groupId) {
        getGroupData(groupId);
    } else {
        divHTML = `<p>No Group ID found in the URL. Please check your link and try again later.</p>`;
        document.getElementsByTagName("dcc-GroupSignIn")[0].innerHTML = divHTML;
    }
}

// Lookup Group from API
function getGroupData(groupId) {
    var emailRegex = "[-a-zA-Z0-9~!$%^&amp;*_=+}{'?]+(\.[-a-zA-Z0-9~!$%^&amp;*_=+}{'?]+)*@([a-zA-Z0-9_][-a-zA-Z0-9_]*(\.[-a-zA-Z0-9_]+)*\.([cC][oO][mM]))(:[0-9]{1,5})?";

    const params = {
        "Group_ID": groupId
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch('https://prod-17.westus2.logic.azure.com:443/workflows/e879a39b992546ac9ec00a611065f655/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BCtOg6wyG_cz3RUaTxr8Rc7zzGT7UQOaAyIIFttOO3w', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            // Set Header Image
            headerDisplay = data.File_GUID ? "block" : "none";

            if(data.status=="success") {
                // If at least one event is returned, create form
                if(data.Events.length >= 1){

                    // Create form checkbox for each Event returned
                    var checkboxContainer = document.createElement("div");
                    checkboxContainer.setAttribute('class', 'checkbox');
                    var label;
                    var checkbox;

                    for(i=0;i<data.Events.length;i++) {
                        label = document.createElement("label");
                        checkbox = document.createElement("input");
                        checkbox.setAttribute('type', 'checkbox');
                        checkbox.setAttribute('name', 'group_event');
                        checkbox.setAttribute('value', data.Events[i].Event_ID);
                        checkbox.setAttribute('id', 'event_id_' + data.Events[i].Event_ID);
                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(data.Events[i].Event_Start_Date));
                        checkboxContainer.appendChild(label);
                        if(data.Events.length==1){
                            checkbox.setAttribute('checked', 'checked');
                            checkbox.setAttribute('onclick','return false;');
                        }
                    }

                    console.log('Event objects: '+data.Events.length);

                    if(data.Events.length>1){
                        checkboxContainer.innerHTML = `<div id="checkboxInstructions">Select one or more events to sign in to:</div>${checkboxContainer.innerHTML}`;
                    }

                    // Main HTML Body
                    const groupSignInForm = `
                        <div id="header-image" style="display: ${headerDisplay};background-image: url(https://my.dreamcitychurch.us/ministryplatformapi/files/${data.File_GUID})"></div>
                        <div id="dcc-signinform">
                            <div id="form-description-text">Please complete this form so that we know you attended <strong>${data.Group_Name}</strong>.</div>
                            <form id="sign-in-form" class="form-horizontal">
                                <fieldset>
                                    <!-- Events -->
                                    ${checkboxContainer.outerHTML}

                                    <!-- First Name -->
                                    <div class="form-group">
                                        <label class="col-md-4 control-label" for="first_name">First Name*</label>  
                                        <div class="col-md-4">
                                            <input id="form_first_name" name="first_name" type="text" placeholder="" class="form-control input-md" required="">
                                        </div>
                                    </div>

                                    <!-- Last Name -->
                                    <div class="form-group">
                                        <label class="col-md-4 control-label" for="last_name">Last Name*</label>  
                                        <div class="col-md-4">
                                            <input id="form_last_name" name="last_name" type="text" placeholder="" class="form-control input-md" required="">
                                        </div>
                                    </div>

                                    <!-- Email Address -->
                                    <div class="form-group">
                                        <label class="col-md-4 control-label" for="email_address">Email Address*</label>  
                                        <div class="col-md-4">
                                            <input id="form_email_address" name="email_address" type="email" placeholder="" class="form-control input-md" required="" pattern="${emailRegex}" title="Please enter a full email address.">
                                        </div>
                                    </div>

                                    <!-- Phone Number -->
                                    <div class="form-group">
                                        <label class="col-md-4 control-label" for="mobile_phone">Phone Number</label>  
                                        <div class="col-md-4">
                                            <input id="form_mobile_phone" name="mobile_phone" type="tel" placeholder="" maxlength="12" class="form-control input-md" onInput="this.value = phoneFormat(this.value)">
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


                    document.getElementsByTagName("dcc-GroupSignIn")[0].innerHTML = groupSignInForm;

                    // Prefill form if data is saved
                    if(savedContactInfo && isAdditional!="yes") {
                        var contactInfo = JSON.parse(savedContactInfo);
                        document.getElementById("form_first_name").value = contactInfo.First_Name ?? '';
                        document.getElementById("form_last_name").value = contactInfo.Last_Name ?? '';
                        document.getElementById("form_email_address").value = contactInfo.Email_Address ?? '';
                        document.getElementById("form_mobile_phone").value = contactInfo.Mobile_Phone ?? '';
                        document.querySelector('.btn-reset').style.display = "block";
                    }


                } else if(data.Events.length < 1) {
                    divHTML = `<div id="header-image" style="display: ${headerDisplay};background-image: url(https://my.dreamcitychurch.us/ministryplatformapi/files/${data.File_GUID})"></div>
                    <div id="dcc-signinform">
                        <div id="form-description-text"><p>Sorry, we couldn't find any recent or upcoming events for <strong>${data.Group_Name}</strong>.</p><p>Please try again later.</p></div>
                    </div>`;
                    document.getElementsByTagName("dcc-GroupSignIn")[0].innerHTML = divHTML;
                } else {
                    divHTML = `<p>Sorry, something went wrong. Please try again later.</p>`;
                    document.getElementsByTagName("dcc-GroupSignIn")[0].innerHTML = divHTML;
                }
            }
        })
        .catch(function (fail) {
            /*Report something went wrong - couldn't connect to API*/
            console.log('Group data connection failure. Returning error.');
            console.log(fail);
            divHTML = `<p>Sorry, something went wrong. Please try again later.</p>`;
            document.getElementsByTagName("dcc-GroupSignIn")[0].innerHTML = divHTML;
        })
        .then(function (createFormListener) {
            if(document.getElementById("sign-in-form")){
                document.getElementById("sign-in-form").addEventListener("submit", SubmitFormListener);
            }
        })
        
    }

// Form Validation
function SubmitFormListener() {
    console.log('Submit click detected');
    if(this.checkValidity()) {
        event.preventDefault();
        var checkedboxes = document.querySelectorAll('input[name="group_event"]:checked');
        if(checkedboxes.length>0) {
            submitGroupSignIn();
        } else {
            alert('Please select at least one event.');
        }
    }
}

// Clear form and local storage
function clearForm() {
    localStorage.removeItem('dcc-quickform-contactinfo');
    document.getElementById("sign-in-form").reset();
}

// Submit Form to API
function submitGroupSignIn() {
    // Get Event IDs from Checkboxes
        const evenCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked, input[name="group_event"]:checked');
        let eventIds = [];
        evenCheckboxes.forEach((checkbox) => {
            eventIds.push(Number(checkbox.value));
        });
        console.log('Event Ids are: ' + eventIds);
    // Set API Params
    const params = {
        "Event_IDs": eventIds,
        "Group_ID": getUrlParams()["id"],
        "First_Name": document.getElementById("form_first_name").value,
        "Last_Name": document.getElementById("form_last_name").value,
        "Email_Address": document.getElementById("form_email_address").value,
        "Mobile_Phone": document.getElementById("form_mobile_phone").value
    };
    //Set API Options
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    // Loading Spinner
    var divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementById("dcc-signinform").innerHTML = divHTML;
    // Submit to API
    fetch('https://prod-22.westus2.logic.azure.com:443/workflows/449859db35564f838cb376dd3c2cc79b/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=AXIabYlSlyRM9k20wyC1OFFUP-oOOD1MS82qbzntq5w', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            if(isAdditional!="yes"){
                var submitAnotherUrl = window.location.href + "&additional=yes";
            } else {
                var submitAnotherUrl = window.location.href;
            }

            divHTML = `<div id="sign-in-confirmation-message" class="sign-in-success"><p style="font-weight:bold;">You have been signed in!</p><p>You may close this window or <a href="${submitAnotherUrl}">click here</a> to sign in someone else.</p></div>`;
            document.getElementById("dcc-signinform").innerHTML = divHTML;

            // If not additional person, save contact info to local storage
            if(isAdditional!="yes"){
                var contactInfoReceived = {First_Name: data.First_Name,Last_Name: data.Last_Name,Email_Address: data.Email_Address,Mobile_Phone: data.Mobile_Phone};
                localStorage.setItem('dcc-quickform-contactinfo', JSON.stringify(contactInfoReceived));
            }
        })
        .catch(function (notSubmitted){
            console.log(notSubmitted);
            divHTML = `<div id="sign-in-confirmation-message" class="sign-in-failure"><p style="font-weight:bold;">Sorry, something went wrong.</p><p>Please try again later. <a href="javascript:window.location.href=window.location.href">Click here</a> to reload the page.</p></div>`;
            document.getElementById("dcc-signinform").innerHTML = divHTML;
        })
}

// Get Parameters from URL
function getUrlParams() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

window.onload = setTimeout(loadGroupSignIn, 500);