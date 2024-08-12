// This javascript will be used to verify a user's email address. The URL contains a verification token, which will then be sent for validation and a message returned to the user

// Function to get the URL parameters
function getUrlVars() {
    const vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
        vars[key] = value;
    });
    return vars;
}

function verifyEmailAddress() {

    // Set the HTML container for this target to the <dcc-emailVerification> tag with a loading message
    document.getElementsByTagName("dcc-emailVerification")[0].innerHTML = `
        <div class="container">
            <h1>Email Verification</h1>
            <p><i class="fa-solid fa-circle-envelope fa-beat-fade"></i> Verifying your email address. Please wait just a moment...</p>
        </div>
    `;

    // Load the token parameter from the URL
    const token = getUrlVars()["token"];

    // If the token is not present, display an error message
    if (!token || token === "") {
        document.getElementsByTagName("dcc-emailVerification")[0].innerHTML = `
            <div class="container">
                <h1>Email Verification</h1>
                <p><i class="fa-sharp fa-solid fa-hexagon-exclamation"></i> Unable to verify your email.<br />Please check your link and try again.</p>
            </div>
        `;
    }

    // POST the token to the API for verification
    fetch("https://prod-29.westus2.logic.azure.com:443/workflows/68a398f2c61e473282777c43deb55267/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=98iOvd4-ZSvP-pvGyuPDyVmHS_jEshhFpyuxFoNIeA0", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token: token,
        }),
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("There was an error verifying your email address.<br />Check your link and try again later.");
            }
        })
        .then((data) => {
            document.getElementsByTagName("dcc-emailVerification")[0].innerHTML = `
                <div class="container">
                    <h1>Email Verification</h1>
                    <p><i class="fa-sharp fa-solid fa-envelope-circle-check"></i> Your email address has been verified successfully! You may now close this window.</p>
                </div>
            `;
        })
        .catch((error) => {
            document.getElementsByTagName("dcc-emailVerification")[0].innerHTML = `
                <div class="container">
                    <h1>Email Verification</h1>
                    <p><i class="fa-sharp fa-solid fa-hexagon-exclamation"></i>  ${error.message}</p>
                </div>
            `;
        });
}

document.addEventListener("DOMContentLoaded", verifyEmailAddress);