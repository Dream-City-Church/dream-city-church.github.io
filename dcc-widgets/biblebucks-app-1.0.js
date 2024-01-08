const currentVersion='1.0.3';

var LastParticipantId = 0;

// APP HOMEPAGE //

function loadBibleBucksApp(messageContent,messageClass){
    document.querySelector('dcc-biblebucks').innerHTML=bb_elementContainer;
    recordID = getUrlVars()["recordID"];
    pageID = getUrlVars()["pageID"];

    // If loaded as an MP Tool
    if(recordID>0 && pageID==645){
        participantLookup(recordID,'Record_ID');
    } else {
        document.querySelector('#biblebucks-content').innerHTML=bb_participantSelection;
        document.getElementById("participant-form").addEventListener("submit", function(){submitParticipantListener(0,'Participant_ID');});
        document.getElementById("loading-overlay").style.display="none";
    }

    // If a message was sent to the function
    if(messageContent){
        document.getElementById('message').className = messageClass;
        document.getElementById("message").innerHTML=messageContent;
        setTimeout(function(){
            document.getElementById('message').className += ' fadeout';
        }, 500);
    }
}

// QR Reader //

function startQrScanner(){
    document.getElementById("reader").style="display:block;";
    let html5QrcodeScanner = new Html5QrcodeScanner("reader",{ fps: 10, qrbox: {width: 300, height: 300} },/* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText, decodedResult) {
        // handle the scanned code as you like, for example:
        console.log(`Code matched = ${decodedText}`, decodedResult);

        html5QrcodeScanner.clear();
        document.getElementById("reader").style="display:none;";
        participantLookup(decodedText,'Participant_ID');
        
    }
    
    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // for example:
        console.warn(`Code scan error = ${error}`);
    }
}

// PARTICIPANT LOOKUPS //

function participantLookup(IdNumber,IdType){
    document.getElementById("loading-overlay").style.display="block";
    console.log('looking up participant');
    if(IdNumber==0){IdNumber=Number(document.querySelector('#participant-id').value)};

    const params = {
        "Participant_ID": IdNumber,
        "ID_Type": IdType
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-14.westus2.logic.azure.com:443/workflows/ab9dec0701914b62a16a2084f7901610/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Km8nl0n6tby9XAORe8n9MNqnvfq9fsfCS6nfPs48eXA', options )
        .then(function (response) {return response.json();})
        .then(function (data) {
            if(data.status=="ok"){
                // If participant found
                document.getElementById("loading-overlay").style.display="none";
                document.querySelector('#biblebucks-content').innerHTML=`<div id="header">
                    <div class="page-title">${coinEmoji} Bible Bucks</div>
                    <button id="back-btn" class="navigation-button">BACK</button>
                    <div id="participant-info" class="participant-info">
                        <div class="participant-name">${data.participantName}</div>
                        <div id="participant-balance" class="participant-balance">${coinEmoji}<div id="participant-balance-value">${data.participantBalance}</div></div>
                    </div>
                </div>
                <div id="content-card">
                    <div id="quick-button-grid">
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button remove-points" onclick="addPointsValue(-100)">-100</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button remove-points" onclick="addPointsValue(-200)">-200</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button add-points" onclick="addPointsValue(200)">+200</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button add-points" onclick="addPointsValue(100)">+100</button>
                        </div>
                    </div>
                    <form id="points-form">
                        <div class="input-field">
                            <input type="number" id="points-total" class="secondary-input" min="-50000" max="1000" required>
                            <input type="hidden" id="participant-id" value="${data.participantId}" required>
                        </div>
                        <button type="submit" id="submit-points-btn" class="submit-button" >SUBMIT</button>
                    </form>
                </div>`;
                // Set Last Participant ID
                LastParticipantId = data.participantId;

                // Add button listeners
                document.getElementById("back-btn").addEventListener("click", function(){window.history.replaceState(null, '', window.location.pathname);loadBibleBucksApp();});
                document.getElementById("points-form").addEventListener("submit", function(){submitFormListener();});

            }else if(data.status=="participant_not_found"){
                // If no participant found
                console.log('Invalid Participant ID.');
                loadBibleBucksApp('Invalid ID number. Please try again.','message-error');
            }else{
                // If there was an error loading he participant
                console.log('something went wrong processing the data.');
                loadBibleBucksApp('Sorry, could not load the participant. Try again later.','message-error');
            };
        })
        .catch(function(fail){
            // If some other error happened
            console.log('something went wrong calling the fetch.');
            console.log(fail);
            loadBibleBucksApp('Server connection error. Try again later.','message-error');
        })
}

// POINTS CALCULATOR //

function addPointsValue(addAmount) {
    currentPoints = Number(document.getElementById('points-total').value);
    addPoints = Number(addAmount);
    availablePoints = Number(document.getElementById('participant-balance-value').innerHTML);
    if(currentPoints+addPoints+availablePoints >= 0){
        document.getElementById('points-total').value = currentPoints+Number(addAmount);
    } else {
        alert('Not enough points!');
    }
}

// PARTICIPANT FORM SUBMIT //

function submitParticipantListener(ParticipantId,IdType) {
    console.log('Submit click detected');
    event.preventDefault();
    participantLookup(ParticipantId,IdType);
}

// POINTS FORM SUBMIT //

function submitFormListener() {
    currentPoints = Number(document.getElementById('points-total').value);
    availablePoints = Number(document.getElementById('participant-balance-value').innerHTML);
    if(currentPoints!=0 && currentPoints+availablePoints>=0){
        console.log('Submit click detected');
        event.preventDefault();
        submitPointsTransaction();
    } else if (currentPoints!=0) {
        event.preventDefault();
        alert('Not enough points!');
    } else {
        event.preventDefault();
        alert('Please enter a value!');
    }
}

// POINTS TRANSACTION //

function submitPointsTransaction(){
    document.getElementById("loading-overlay").style.display="block";
    pointsAmount=Number(document.getElementById("points-total").value);
    const params = {
        "Participant_ID": Number(document.getElementById("participant-id").value),
        "Points": pointsAmount,
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-22.westus2.logic.azure.com:443/workflows/283598bfdf9a4e3a9f7adca2335f0706/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OhC43R9TIRVSwjLtTKNacWcNp-9agT9PIL2o-Q8B4_Y', options )
        .then(function (response) {console.log('response received');return response.json();})
        .then(function (data) {
            if(data.status=="ok"){
                window.history.replaceState(null, '', window.location.pathname);
                if(pointsAmount>0){
                    loadBibleBucksApp(`${pointsAmount} Bible Bucks have been added to ${data.ParticipantName}!`,'message-pointsAdded');
                } else {
                    loadBibleBucksApp(`${pointsAmount} Bible Bucks have been removed from ${data.ParticipantName}!`,'message-pointsRemoved');
                }
            }
            else{
                alert('Sorry, something went wrong. Please try again in a moment.');
            }
        })
        .catch(function (fail) {
            alert('Server communication error. Please try again');
            console.log(fail);
        })
}

// GET URL PARAMS //

function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

// PAGE TEMPLATES //

var coinEmoji = String.fromCodePoint(0x1FA99);
var cameraEmoji = String.fromCodePoint(0x1F4F7);

var bb_elementContainer=`<div id="biblebucks-wrapper">
<div id="loading-overlay" style="display:block;"> <div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div> </div>
<div id="biblebucks-content">
</div>
</div>
<div id="current-version">${currentVersion}</div>`;

var bb_participantSelection=`<div id="biblebucks-participantearnselect">
<div id="header">
    <div class="header-text">${coinEmoji} Bible Bucks</div>
</div>
<div id="content-card">
    <div id="reader"></div>
    <form id="participant-form"><div class="input-field"><input type="number" id="participant-id" class="primary-input" min="1" max="999999"><div id="qr-reader" onclick="startQrScanner();">${cameraEmoji}</div></div>
    <button id="submit-participant-earn-btn" class="submit-button">SUBMIT</button>${(function (){if(LastParticipantId>0){return `<i class="fa-solid fa-arrows-rotate" aria-hidden="true" onclick="submitParticipantListener(${LastParticipantId},'Participant_ID')"></i>`;}})}</form>
</div>
<div id="message"></div>
</div>`;