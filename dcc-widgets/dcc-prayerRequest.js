/* Web Component that will be used to display the prayer request form */

function loadPrayerRequestForm() {
    submitterInfo = `
        <wa-input id="firstNameField" name="first-name" class="input-field" placeholder="First Name" minlength=3 max-length=20 autocapitalize="words" autocomplete="given-name" inputmode="text" required></wa-input>
        <wa-input id="lastNameField" name="last-name" class="input-field" placeholder="Last Name" minlength=3 max-length=20 autocapitalize="words" autocomplete="family-name" inputmode="text" required></wa-input>
        <wa-input id="emailAddressField" name="email" class="input-field" placeholder="Email Address" minlength=5 max-length=30 type="email" inputmode="email" autocomplete="email" required></wa-input>
        <wa-input id="phoneNumberField" name="phone" class="input-field" placeholder="Mobile Phone" minlength=10 max-length=13 type="tel" inputmode="tel" autocomplete="mobile" help-text="Optional. By providing your phone number to Dream City Church, you're opting in to receive text messages from us. Data & Msg rates may apply. Reply STOP to cancel."></wa-input>
    `;

    userGuid = getUrlVars()["uid"];
    contactGuid = getUrlVars()["cid"];
    relatedGuid = getUrlVars()["rid"];

    if (userGuid || contactGuid) {
        submitterInfo = ``;
    }

    requestFormHTML = `
        <div id="prayer-request-form">
            <form id="request-form">
                <wa-radio-group name="type" value="1" class="type-container" required>
                    <wa-radio-button value="1" class="PrayerRequestButton">
                        <wa-icon slot="prefix" name="hands-praying" variant="solid"></wa-icon>
                        Prayer Request
                    </wa-radio-button>
                    <wa-radio-button value="2" class="PraiseReportButton">
                        Praise Report
                        <wa-icon slot="suffix" name="hands-clapping" variant="solid"></wa-icon>
                    </wa-radio-button>
                </wa-radio-group>

                ${submitterInfo}

                <wa-textarea id="request-text-box" resize="auto" maxlength=1000 name="request-text" placeholder="Enter your prayer request or praise report here" rows=4 required autocapilatize="sentences" autocorrect class="request-text-box">
                    <span slot="help-text" id="char-count">0/1000</span>
                </wa-textarea>

                <wa-radio-group name="visibility" value="4" class="visibility-container" required>
                    <wa-radio-button value="4" class="VisibilityPublic">
                        <wa-icon slot="prefix" name="eye" variant="solid"></wa-icon>
                        Public
                    </wa-radio-button>
                    <wa-radio-button value="2" class="VisibilityPrivate">
                        <wa-icon slot="prefix" name="eye-slash" variant="solid"></wa-icon>
                        Private
                    </wa-radio-button>
                </wa-radio-group>

                <div id="prayer-disclaimer">
                    <p>If you are having an urgent emergency, please call 911. If you are having suicidal thoughts or thoughts of self-harm, please call the Suicide & Crisis Lifeline at 988.</p>
                    <p>Email verification and manual review may be required before your post will visible on the public prayer wall. Links, URL's, self-promotion, and personally identifiable information may be removed from posts.<br /></p>
                </div>

                <input type="hidden" id="prayer-form-uid" name="uid" value="${userGuid}">
                <input type="hidden" id="prayer-form-cid" name="cid" value="${contactGuid}">
                <input type="hidden" id="prayer-form-rid" name="rid" value="${relatedGuid}">

                <div class="submit-container">
                    <wa-button style="--background-color: #bc204b; --border-radius: 2rem;" type="submit" class="submit-button" id="prayer-request-submit-button">Submit</wa-button>
                </div>
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
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("There was an error submitting your request.<br />Please try again later.");
                    }
                })
                .then((data) => {
                    submitButton.textContent = "Submitted!";
                    form.reset();
                    setTimeout(() => {
                        submitButton.textContent = "Submit";
                        submitButton.disabled = false;
                    }, 5000);
                })
                .catch((error) => {
                    submitButton.textContent = "Error!";
                    setTimeout(() => {
                        submitButton.textContent = "Submit";
                        submitButton.disabled = false;
                    }, 5000);
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

