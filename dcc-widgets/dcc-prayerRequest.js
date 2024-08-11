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
            <form>
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
                        Public: Post under my initials
                    </wa-radio-button>
                    <wa-radio-button value="2" class="VisibilityPrivate">
                        <wa-icon slot="prefix" name="eye-slash" variant="solid"></wa-icon>
                        Private: Only share with the prayer team
                    </wa-radio-button>
                </wa-radio-group>

                <div id="prayer-disclaimer">
                    <p>If you are having an urgent emergency, please call 911. If you are having suicidal thoughts or thoughts of self-harm, please call the Suicide & Crisis Lifeline at 988.</p>
                    <p>Email verification and manual review may be required before your post will visible on the public prayer wall. Links, URL's, self-promotion, and personally identifiable information may be removed from posts.</p>
                </div>

                <input type="hidden" id="prayer-form-uid" name="uid" value="${userGuid}">
                <input type="hidden" id="prayer-form-cid" name="cid" value="${contactGuid}">
                <input type="hidden" id="prayer-form-rid" name="rid" value="${relatedGuid}">

                <div class="submit-container">
                    <wa-button style="--background-color: #bc204b; --border-radius: 2rem;" type="submit" class="submit-button">Submit</wa-button>
                </div>
            </form>
        </div>
    `;
    document.getElementsByTagName("dcc-PrayerRequestForm")[0].innerHTML = requestFormHTML;
}

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

