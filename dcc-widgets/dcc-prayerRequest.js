/* Web Component that will be used to display the prayer request form */
const prayerRequestVersionNumber = '1.250209';
console.log(`Prayer Request Form Version: ${prayerRequestVersionNumber}`);

//// Analytics Tracking
// Generate a device ID to store as a permanent cookie
var deviceID = localStorage.getItem('deviceID');
if (!deviceID) {
    deviceID = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceID', deviceID);
}
// Get current URL
var url = window.location.origin;
var url = url + window.location.pathname;
// Get current page
var page = window.location.pathname.split("/").pop();
if (page === '') {
    page = window.location.pathname.split("/").slice(-2)[0];
}

function renderTurnstileChallenge() {

    if (document.querySelector('[name="cf-turnstile-response"]')) {
        // If the turnstile value already exists, remove any existing elements in the turnstile var
        document.querySelector('[name="cf-turnstile-response"]').remove();
    }

    turnstile.render('#turnstile-challenge', {
        sitekey: '0x4AAAAAAA6ACv2bbg9fJSl8',
        action: "prayer_request"
    });

    console.log(turnstile.getResponse());
}

var prayerDisclaimer = `
<div id="prayer-tou" class="dcc-modal">
    <div id="prayer-tou-content">
    <div id="prayer-disclaimer-dismiss" class="dcc-modal-close" onclick="termsModalClose()" style="cursor:pointer;margin-bottom:1rem;">Close &times;</div>
    <h3>Dream City Church Prayer Wall Terms of Use</h3>
    <p>Welcome to the Dream City Church Prayer Wall. We are grateful for your participation in this community of faith and prayer. To ensure a respectful and supportive environment, we ask that all users adhere to the following terms of use:</p>
    <ol><li><strong>Purpose of the Prayer Wall</strong>
    <p>The Prayer Wall is intended for sharing specific prayer requests related to personal needs or the needs of other people in your life so that our church community may join with you in prayer, such as prayer requests for:</p>
    <ul><li>Financial hardships</li>
    <li>Health complications</li>
    <li>Strength to overcome sin or temptation</li>
    <li>Wisdom in decision-making</li>
    <li>Salvation for family and friends</li></ul>
    <p>It is not intended for personal prayer journaling (prayers between you and God), reciting scripture, or sharing preaching/teaching. While these are good things, they do not fall under the purpose of the public prayer wall.</p></li>

    <li><strong>Submission Guidelines</strong>
    <ul><li>Limit public prayer requests to one every three days.</li>
    <li>Limit re-posting the same prayer request to no more than once per month.</li>
    <li>Prayer requests should not contain full names, only first names, or any other identifying information such as addresses, phone numbers, or email addresses.</li></ul></li>
    
    <li><strong>Content Restrictions</strong>
    <ul><li>Prayer requests must not call for violence or ask for God to "destroy" any person or persons. Our belief is that the message of Jesus and salvation is for all, and that everyone can be redeemed.</li>
    <li>Do not denigrate or insult any person or persons. We are all made in God's image and are deserving of respect.</li>
    <li>Avoid political divisiveness. Prayers regarding politicians should focus on wisdom, guidance, salvation, and the rise of Godly leaders.</li>
    <li>Do not use the Prayer Wall to promote personal agendas, political views, or other divisive content.</li>
    <li>If your prayer request involves sensitive or graphic content, please be mindful of how you share it.</li>
    <li>Do not promote music, websites, videos, books, articles, or any other material. The Prayer Wall is solely for prayer requests.</li></ul></li>
    
    <li><strong>Moderation and Rejection of Requests</strong>
    <p>Dream City Church reserves the right to review and reject any prayer requests that do not align with these terms of use, or for any other reason. This is to maintain a respectful and focused environment for all users. Dream City Church also reserves the right to modify prayer requests in whole or part to remove content that does not align with the terms of use or to entirely hide prayer requests that do not align with the terms of use. Examples of content that may be modified or removed include, but are not limited to, inappropriate language, personal attacks, or references to external content.</p></li>

    <li><strong>Community Conduct</strong>
    <p>Users are expected to engage with the Prayer Wall in a spirit of love, respect, and encouragement, reflecting the teachings of Jesus.</p></li>

    <li><strong>Privacy and Confidentiality</strong>
    <p>We are committed to protecting your privacy and the privacy of those you're praying for. Please refrain from including any personal or identifying information in your prayer requests.</p></li></ol>

    <p>By using the Prayer Wall, you agree to abide by these terms. Thank you for your understanding and cooperation in making this a welcoming space for all.</p>
    <div id="prayer-disclaimer-dismiss" class="dcc-modal-close" onclick="termsModalClose()" style="cursor:pointer;">Close &times;</div>
    </div>
</div>
`;

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
        <wa-input id="emailAddressField" name="email" class="input-field" placeholder="Email Address" minlength=5 max-length=30 type="email" inputmode="email" autocomplete="email" hint="A verification email will be sent to this address." required></wa-input>
        <wa-input id="phoneNumberField" name="phone" class="input-field" placeholder="Mobile Phone" minlength=10 max-length=13 type="tel" inputmode="tel" autocomplete="mobile"><span slot="hint">Optional. By providing your phone number, you agree to receive text messages from Dream City Church in accordance with our <a href='https://dreamcitychurch.us/sms-tos/' target='_blank'>Terms of Service</a> and <a href='https://dreamcitychurch.us/privacy-policy/' target='_blank'>Privacy Policy</a>. Reply STOP to cancel. Msg rates may apply.</span></wa-input>
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
        fetch(`https://prod-10.westus2.logic.azure.com:443/workflows/d910b8466b9f43dc93c10f23ab50fb78/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nbpbVKt37ObPXwptvbA-mjdkyzJsugJ-Xk4dyDcArE8&uid=${userGuid}&cid=${contactGuid}&src=${page}&url=${url}&deviceID=${deviceID}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.firstName) {
                    greetingHtml = `<div id="prayer-greeting"><p>Hi, ${data.firstName}!</p><p>Please enter your prayer request or praise report below.</p></div>`;
                    document.getElementById("prayer-greeting").innerHTML = greetingHtml;
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
                    <p>By submitting your prayer request, you agree to abide by the <a href="#" onclick="termsModalOpen()">Prayer Wall Terms of Use</a>.</p>
                </div>

                <input type="hidden" id="prayer-form-uid" name="uid" value="${userGuid}">
                <input type="hidden" id="prayer-form-cid" name="cid" value="${contactGuid}">
                <input type="hidden" id="prayer-form-rid" name="rid" value="${relatedGuid}">
                <div id="turnstile-challenge" class="cf-turnstile" data-sitekey="0x4AAAAAAA6ACv2bbg9fJSl8"></div>
                <div class="submit-container">
                    <wa-button style="--background-color: #bc204b; --border-radius: 2rem;" type="submit" class="submit-button" id="prayer-request-submit-button">Submit</wa-button>
                </div>
                <div id="submit-status"></div>
            </form>
        </div>
    `;
    document.getElementsByTagName("dcc-PrayerRequestForm")[0].innerHTML = requestFormHTML;
    renderTurnstileChallenge();
}

function termsModalOpen() {
    // add the prayer-tau modal at the root of the DOM
    document.body.insertAdjacentHTML('beforeend', prayerDisclaimer);
}

function termsModalClose() {
    // remove the prayer-tau modal from the DOM
    document.getElementById('prayer-tou').remove();
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

        var turnstile = document.querySelector('[name="cf-turnstile-response"]');

        if (!turnstile.value) {
            submitButton.textContent = "Error!";
            document.getElementById("submit-status").innerHTML = '<i class="fa-solid fa-shield-xmark fa-shake fa-xl"></i><p>Security validation failed.</p><p>Please refresh and try again.</p>';
            submitButton.textContent = "Error!";
            return;
        }


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
                    turnstile: turnstile.value || "",
                    url: url,
                    page: page,
                    deviceID: deviceID
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
                            document.getElementById("submit-status").innerHTML = '<i class="fa-solid fa-comment-xmark fa-shake fa-xl"></i><p>Please enter a valid email address.</p>';

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
                    } else if (response.status === 401) {
                        
                        return response.json().then(() => {
                            submitButton.textContent = "Error!";
                            document.getElementById("submit-status").innerHTML = '<i class="fa-solid fa-shield-xmark fa-shake fa-xl"></i><p>Security validation failed.</p><p>Please refresh and try again.</p>';
                            // Exit the promise chain
                            throw new Error("Turnstile Validation Failure");
                        });

                    } else {
                        throw new Error("Server Error");
                    }                    
                })
                .then((data) => {
                    submitButton.textContent = 'Submitted!';

                    if(data.verification_needed === true) {
                        document.getElementById("submit-status").innerHTML = '<i class="fa-solid fa-comment-exclamation fa-beat fa-xl"></i><p>Your post needs verification.</p><p>Please check your email and click the verification link.</p>';
                    } else {
                        document.getElementById("submit-status").innerHTML = '<i class="fa-solid fa-comment-check fa-bounce fa-xl"></i><p>Your post has been submitted. Thank you!</p><p>Check your email for updates regarding your post.</p>';
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
                    // Fill the first name, last name, email, and phone fields with data from vars
                    document.querySelector("#firstNameField").value = firstName.value;
                    document.querySelector("#lastNameField").value = lastName.value;
                    document.querySelector("#emailAddressField").value = email.value;
                    document.querySelector("#phoneNumberField").value = phone.value;
                    // Reset the submit button and re-enable it after 5 seconds
                    setTimeout(() => {
                        submitButton.textContent = "Submit";
                        submitButton.disabled = false;
                    }, 5000);
                    setTimeout(() => {
                        document.getElementById("submit-status").innerHTML = '';
                    }, 10000);
                })
                .catch((error) => {
                    console.log(error);
                    if (error.message !== "Invalid Email Address" || error.message !== "Turnstile Validation Failure") {
                        submitButton.textContent = "Error!";
                        document.getElementById("submit-status").innerHTML = '<i class="fa-solid fa-comment-xmark fa-shake fa-xl"></i><p>Sorry, something went wrong. Try again later.</p>';
                        setTimeout(() => {
                            submitButton.textContent = "Submit";
                            submitButton.disabled = false;
                        }, 5000);
                        setTimeout(() => {
                            document.getElementById("submit-status").innerHTML = '';
                        }, 5000);
                    }
                });
        };
        renderTurnstileChallenge();
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