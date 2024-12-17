/* Web Component that will be used to display the prayer request form */
const prayerRequestVersionNumber = '1.241217';
console.log(`Prayer Request Form Version: ${prayerRequestVersionNumber}`);

function loadPrayerRequestForm() {
    // get device screen width
    var screenWidth = window.innerWidth;
    var buttonSize = "medium";
    if (screenWidth <= 425) {
        buttonSize = "small";
    }

    submitterInfo = `
        <wa-input id="firstNameField" name="first-name" class="input-field" placeholder="First Name" minlength=3 max-length=20 autocapitalize="words" autocomplete="given-name" inputmode="text" required></wa-input>
        <wa-input id="lastNameField" name="last-name" class="input-field" placeholder="Last Name" minlength=3 max-length=20 autocapitalize="words" autocomplete="family-name" inputmode="text" required></wa-input>
        <wa-input id="emailAddressField" name="email" class="input-field" placeholder="Email Address" minlength=5 max-length=30 type="email" inputmode="email" autocomplete="email" help-text="A verification email will be sent to this address." required></wa-input>
        <wa-input id="phoneNumberField" name="phone" class="input-field" placeholder="Mobile Phone" minlength=10 max-length=13 type="tel" inputmode="tel" autocomplete="mobile"><p slot="help-text">Optional. By providing your phone number, you agree to receive text messages from Dream City Church in accordance with our <a href='https://dreamcitychurch.us/sms-tos/' target='_blank'>Terms of Service</a> and <a href='https://dreamcitychurch.us/privacy-policy/' target='_blank'>Privacy Policy</a>. Reply STOP to cancel. Msg rates may apply.<p></wa-input>
    `;

    userGuid = getUrlVars()["uid"];
    contactGuid = getUrlVars()["cid"];
    relatedGuid = getUrlVars()["rid"];

    if (userGuid || contactGuid) {
        submitterInfo = `
            <input id="firstNameField" name="first-name" class="input-field input-hidden" inputmode="text" hidden></input>
            <input id="lastNameField" name="last-name" class="input-field input-hidden" inputmode="text" hidden></input>
            <input id="emailAddressField" name="email" class="input-field input-hidden" hidden></input>
            <input id="phoneNumberField" name="phone" class="input-field input-hidden" hidden></input>
        `;
    }

    greetingHtml = ``;
    if (userGuid || contactGuid) {
        greetingHtml = `<div id="prayer-greeting"><p>&nbsp</p><p>Please enter your prayer request or praise report below.</p></div>`;
        // Get the user's first name and last name from API
        fetch(`https://prod-10.westus2.logic.azure.com:443/workflows/d910b8466b9f43dc93c10f23ab50fb78/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nbpbVKt37ObPXwptvbA-mjdkyzJsugJ-Xk4dyDcArE8&uid=${userGuid}&cid=${contactGuid}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.firstName) {
                    greetingHtml = `<div id="prayer-greeting"><p>Hi, ${data.firstName}!</p><p>Please enter your prayer request or praise report below.</p></div>`;
                    document.getElementById("prayer-greeting").innerHTML = greetingHtml;
                    console.log(data.firstName);
                }
            });
    }

    requestFormHTML = `
        ${greetingHtml}
        <div id="prayer-request-form">
            <form id="request-form">
                <wa-radio-group name="type" value="1" class="type-container" size="${buttonSize}" required>
                    <wa-radio-button value="1" class="PrayerRequestButton" size="${buttonSize}">
                        <wa-icon slot="prefix" name="hands-praying" variant="solid"></wa-icon>
                        Prayer Request
                    </wa-radio-button>
                    <wa-radio-button value="2" class="PraiseReportButton" size="${buttonSize}">
                        Praise Report
                        <wa-icon slot="suffix" name="hands-clapping" variant="solid"></wa-icon>
                    </wa-radio-button>
                </wa-radio-group>

                ${submitterInfo}

                <wa-textarea id="request-text-box" resize="auto" maxlength=1000 name="request-text" placeholder="Enter your prayer request or praise report here" rows=4 required autocapilatize="sentences" autocorrect class="request-text-box">
                    <span slot="help-text" id="char-count">0/1000</span>
                </wa-textarea>

                <wa-radio-group name="visibility" value="4" class="visibility-container" size="${buttonSize}" required>
                    <wa-radio-button value="4" class="VisibilityPublic" size="${buttonSize}">
                        <wa-icon slot="prefix" name="eye" variant="solid"></wa-icon>
                        Public
                    </wa-radio-button>
                    <wa-radio-button value="2" class="VisibilityPrivate" size="${buttonSize}">
                        <wa-icon slot="prefix" name="eye-slash" variant="solid"></wa-icon>
                        Private
                    </wa-radio-button>
                </wa-radio-group>

                <div id="prayer-disclaimer">
                    <p>If you are having an urgent emergency, please call 911. If you are having suicidal thoughts or thoughts of self-harm, please call the Suicide & Crisis Lifeline at 988.</p>
                    <p>Email verification and manual approval may be required before your post will visible on the public prayer wall. Links, URL's, self-promotion, and personally identifiable information may be removed from posts.
                    <p>To ensure fairness and visibility for all, we request only one public prayer request per person every 3 days. Thank you for your understanding.<br /></p>
                </div>

                <input type="hidden" id="prayer-form-uid" name="uid" value="${userGuid}">
                <input type="hidden" id="prayer-form-cid" name="cid" value="${contactGuid}">
                <input type="hidden" id="prayer-form-rid" name="rid" value="${relatedGuid}">

                <div class="submit-container">
                    <wa-button style="--background-color: #bc204b; --border-radius: 2rem;" type="submit" class="submit-button" id="prayer-request-submit-button">Submit</wa-button>
                </div>
                <div id="submit-status"></div>
            </form>
        </div>
    `;
    document.getElementsByTagName("dcc-PrayerRequestForm")[0].innerHTML = requestFormHTML;
}

//Function for phoneNumberField to not allow non-numbers, limit to 10 numbers, and format as xxx-xxx-xxxx.
// Insert the dashes to the phone number as it is being typed.
document.addEventListener("DOMContentLoaded", async () => {
    await customElements.whenDefined("wa-input");
    const phone = document.querySelector("#phoneNumberField");
    phone.addEventListener("input", () => {
        phone.value = phone.value.replace(/\D/g, "").substring(0, 10);
        const value = phone.value.replace(/\D/g, "");
        if (value.length > 3 && value.length < 7) {
            phone.value = `${value.slice(0, 3)}-${value.slice(3)}`;
        } else if (value.length >= 7) {
            phone.value = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
        }
    });
});

// When the form is submitted, validate the data entered then submit to api //
document.addEventListener("DOMContentLoaded", async () => {
    await customElements.whenDefined("wa-button");
    const form = document.querySelector("#request-form");
    const submitButton = document.querySelector("#prayer-request-submit-button");
    const firstName = document.querySelector("#firstNameField");
    const lastName = document.querySelector("#lastNameField");
    const email = document.querySelector("#emailAddressField");
    const phone = document.querySelector("#phoneNumberField");
    const request = document.querySelector("#request-text-box");
    const type = document.querySelector(".type-container");
    const visibility = document.querySelector(".visibility-container");
    const uid = document.querySelector("#prayer-form-uid");
    const cid = document.querySelector("#prayer-form-cid");
    const rid = document.querySelector("#prayer-form-rid");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        if (firstName.checkValidity() && lastName.checkValidity() && email.checkValidity() && request.checkValidity() && type.checkValidity() && visibility.checkValidity()) {
            fetch("https://prod-10.westus2.logic.azure.com:443/workflows/5562f39e49bb451e8cd39699645d8e75/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ynLuDLIn08dTCFuqdKn-VL71bCNuijKeX2MhMSUDIgU", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: firstName.value,
                    lastName: lastName.value,
                    email: email.value,
                    phone: phone.value || "",
                    requestText: request.value,
                    type: type.value,
                    visibility: visibility.value,
                    uid: uid.value || "",
                    cid: cid.value || "",
                    rid: rid.value || "",
                }),
            })
                .then((response) => {
                    // Check what the status code is. If 200, then return the response.json(). If 400, display email address validation error. If other error, display generic error.
                    if (response.status === 200) {
                        return response.json();
                    } else if (response.status === 400) {
                        return response.json().then((data) => {
                            // Check if the data.suggestion value exists. If it does, display the suggestion. If not, display the message.
                            if (data.suggestion) {
                                email.setCustomValidity(data.message + " Did you mean " + data.suggestion + '?');
                            } else {
                                email.setCustomValidity(data.message);
                            }
                            email.reportValidity();
                            submitButton.textContent = "Error!";
                            document.getElementById("submit-status").innerHTML = '<p>Please enter a valid email address. <i class="fa-solid fa-comment-xmark fa-shake fa-xl"></i></p>';

                            // add event listener on email field to clear the custom validity when the user types in the field
                            email.addEventListener("input", () => {
                                email.setCustomValidity("");
                                submitButton.textContent = "Submit";
                                submitButton.disabled = false;
                                document.getElementById("submit-status").innerHTML = '';
                            });
                            // Exit the promise chain
                            throw new Error("Invalid Email Address");
                        });
                    } else {
                        throw new Error("Server Error");
                    }                    
                })
                .then((data) => {
                    submitButton.textContent = 'Submitted!';

                    if(data.verification_needed === true) {
                        document.getElementById("submit-status").innerHTML = '<p>Your post needs verification. <i class="fa-solid fa-comment-exclamation fa-beat fa-xl"></i></p><p>Please check your email and click the verification link.</p>';
                    } else {
                        document.getElementById("submit-status").innerHTML = '<p>Your post has been submitted. Thank you! <i class="fa-solid fa-comment-check fa-bounce fa-xl"></i></p><p>Check your email for updates regarding your post.</p>';
                    }

                    form.reset();
                    // Clear all parameters from the URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    // Add back the CID and UID if they exist
                    if (contactGuid && !userGuid) {
                        window.history.pushState({}, document.title, `?cid=${contactGuid}`);
                    } else if (!contactGuid && userGuid) {
                        window.history.pushState({}, document.title, `?uid=${userGuid}`);
                    } else if (contactGuid && userGuid) {
                        window.history.pushState({}, document.title, `?uid=${userGuid}&cid=${contactGuid}`);
                    }
                    setTimeout(() => {
                        submitButton.textContent = "Submit";
                        submitButton.disabled = false;
                    }, 5000);
                    setTimeout(() => {
                        document.getElementById("submit-status").innerHTML = '';
                    }, 10000);
                })
                .catch((error) => {
                    if (error.message !== "Invalid Email Address") {
                        submitButton.textContent = "Error!";
                        document.getElementById("submit-status").innerHTML = '<p>Sorry, something went wrong. Try again later. <i class="fa-solid fa-comment-xmark fa-shake fa-xl"></i></p>';
                        setTimeout(() => {
                            submitButton.textContent = "Submit";
                            submitButton.disabled = false;
                        }, 5000);
                        setTimeout(() => {
                            document.getElementById("submit-status").innerHTML = '';
                        }, 5000);
                    }
                });
        }
    });
});
                

// When the user types in the textarea, update the character count //
document.addEventListener("DOMContentLoaded", async () => {
    await customElements.whenDefined("wa-textarea");
  
    const textarea = document.querySelector("#request-text-box");
    const helpText = document.querySelector("#char-count");
  
    textarea.addEventListener("wa-input", () => {
      const maxLength = textarea.maxlength;
      const currentLength = textarea.value.length;
      helpText.textContent = `${currentLength}/${maxLength}`;
    });
    const maxLength = textarea.maxlength;
    const currentLength = textarea.value.length;
    helpText.textContent = `${currentLength}/${maxLength}`;
  });

/* Function for getting URL variables */
function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

window.onload = setTimeout(loadPrayerRequestForm, 500);

