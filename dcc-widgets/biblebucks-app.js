const currentVersion='0.9.1';

// BASIC NAVIGATION //

function loadBibleBucksApp(){
    document.querySelector('dcc-biblebucks').innerHTML=bb_elementContainer;
    document.querySelector('#biblebucks-content').innerHTML=bb_homeTemplate;

    document.getElementById("earn-points-btn").addEventListener("click", loadEarnParticipantSelect);
    document.getElementById("spend-points-btn").addEventListener("click", loadSpendParticipantSelect);
}

function loadEarnParticipantSelect(){
    document.querySelector('#biblebucks-content').innerHTML=bb_participantEarnTemplate;
    document.getElementById("home-btn").addEventListener("click", loadBibleBucksApp);
    document.getElementById("submit-participant-earn-btn").addEventListener("click", function(){earnParticipantLookup(0)});
}

function loadSpendParticipantSelect(){
    document.querySelector('#biblebucks-content').innerHTML=bb_participantSpendTemplate;
    document.getElementById("home-btn").addEventListener("click", loadBibleBucksApp);
    document.getElementById("submit-participant-spend-btn").addEventListener("click", function(){spendParticipantLookup(0)});
}

// QR Reader //

function onScanSuccess(decodedText, decodedResult) {
    // handle the scanned code as you like, for example:
    console.log(`Code matched = ${decodedText}`, decodedResult);
    if(document.getElementById("submit-participant-earn-btn")){
        earnParticipantLookup(decodedText);
    }
    if(document.getElementById("submit-participant-spend-btn")){
        spendParticipantLookup(decodedText);
    }
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    console.warn(`Code scan error = ${error}`);
}


function startQrScanner(){
    document.getElementById("reader").style="display:block;";
    let html5QrcodeScanner = new Html5QrcodeScanner("reader",{ fps: 10, qrbox: {width: 300, height: 300},supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], facingMode: { exact: "environment"} },/* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// PARTICIPANT LOOKUPS //

function earnParticipantLookup(ParticipantId){
    document.getElementById("loading-overlay").style.display="block";
    console.log('looking up participant')
    if(ParticipantId==0){ParticipantId=Number(document.querySelector('#participant-id').value)};

    const params = {
        "Participant_ID": ParticipantId,
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
                document.getElementById("loading-overlay").style.display="none";
                document.querySelector('#biblebucks-content').innerHTML=`<div id="biblebucks-earnpoints">
                <div id="header">
                    <div id="earn-points-title" class="page-title">EARN POINTS</div>
                    <button id="back-btn" class="navigation-button">BACK</button>
                    <div id="participant-info" class="participant-info">
                        <div class="participant-name">${data.participantName}</div>
                        <div class="participant-balance">${coinEmoji}${data.participantBalance}</div>
                    </div>
                </div>
                <div id="content-card">
                    <div id="quick-button-grid">
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(25)">+25</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(50)">+50</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(75)">+75</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(100)">+100</button>
                        </div>
                    </div>
                    <form id="points-form">
                        <div class="input-field">
                            <input type="number" id="points-total" class="secondary-input" min="1" max="1000" required>
                            <input type="hidden" id="participant-id" value="${data.participantId}" required>
                        </div>
                        <button type="submit" id="submit-points-btn" class="submit-button" >SUBMIT</button>
                    </form>
                </div>
                </div>`;

                

            }else{
                console.log('something went wrong processing the data.')
            };
        })
        .then(function (eventListeners) {
            document.getElementById("back-btn").addEventListener("click", loadEarnParticipantSelect);
            document.getElementById("points-form").addEventListener("submit", function(){submitFormListener('earnPointsPage')});
        })
        .catch(function(fail){
            console.log('something went wrong calling the fetch.')
        })
}

function spendParticipantLookup(ParticipantId){
    document.getElementById("loading-overlay").style.display="block";
    console.log('looking up participant')
    if(ParticipantId==0){ParticipantId=Number(document.querySelector('#participant-id').value)};

    const params = {
        "Participant_ID": ParticipantId,
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
                document.getElementById("loading-overlay").style.display="none";
                document.querySelector('#biblebucks-content').innerHTML=`<div id="biblebucks-earnpoints">
                <div id="header">
                    <div id="earn-points-title" class="page-title">EARN POINTS</div>
                    <button id="back-btn" class="navigation-button">BACK</button>
                    <div id="participant-info" class="participant-info">
                        <div class="participant-name">${data.participantName}</div>
                        <div class="participant-balance">${coinEmoji}${data.participantBalance}</div>
                    </div>
                </div>
                <div id="content-card">
                    <div id="quick-button-grid">
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(-25)">-25</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(-50)">-50</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(-75)">-75</button>
                        </div>
                        <div class="quick-button">
                            <button id="quickpoint-button" class="quickpoint-button" onclick="addPointsValue(-100)">-100</button>
                        </div>
                    </div>
                    <form id="points-form">
                        <div class="input-field">
                            <input type="number" id="points-total" class="secondary-input" min="-1000" max="-1" required>
                            <input type="hidden" id="participant-id" value="${data.participantId}" required>
                        </div>
                        <button type="submit" id="submit-points-btn" class="submit-button" >SUBMIT</button>
                    </form>
                </div>
                </div>`;

                

            }else{
                console.log('something went wrong processing the data.')
            };
        })
        .then(function (eventListeners) {
            document.getElementById("back-btn").addEventListener("click", loadSpendParticipantSelect);
            document.getElementById("points-form").addEventListener("submit", function(){submitFormListener('spendPointsPage')});
        })
        .catch(function(fail){
            console.log('something went wrong calling the fetch.')
        })
}

// POINTS FUNCTIONS //

function addPointsValue(addAmount) {
    currentPoints = document.getElementById('points-total').value;
    document.getElementById('points-total').value = Number(currentPoints)+Number(addAmount);
}

function submitFormListener(reference) {
    console.log('Submit click detected');
    event.preventDefault();
    submitPointsTransaction(reference);
}

function submitPointsTransaction(reference){
    document.getElementById("loading-overlay").style.display="block";
    console.log('Posting transaction - reference: '+reference);
    const params = {
        "Participant_ID": Number(document.getElementById("participant-id").value),
        "Points": Number(document.getElementById("points-total").value),
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
                if(reference=="earnPointsPage"){
                    console.log('Posting Points Success');
                    earnParticipantLookup(data.ParticipantId);
                }else if(reference=="spendPointsPage"){
                    console.log('Posting Points Success');
                    spendParticipantLookup(data.ParticipantId);
                }else{
                    console.log(data.status)
                }
            }
            else{}
        })
}

// PAGE TEMPLATES //

var coinEmoji = String.fromCodePoint(0x1FA99);
var cameraEmoji = String.fromCodePoint(0x1F4F7);

var bb_elementContainer=`<div id="biblebucks-wrapper">
<div id="loading-overlay"> <div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div> </div>
<div id="biblebucks-content">
<div id="current-version">${currentVersion}</div>
</div>
</div>`;

var bb_homeTemplate=`<div id="biblebucks-home">
    <div id="header">
        <div class="header-text">${coinEmoji} Bible Bucks</div>
    </div>
    <div id="content-card">
        <div class="primary-button-wrapper">
            <button id="earn-points-btn" class="primary-button">Earn Points</button>
        </div>
        <div class="primary-button-wrapper">
            <button id="spend-points-btn" class="primary-button">Spend Points</button>
        </div>
    </div>
</div>`;

var bb_participantEarnTemplate=`<div id="biblebucks-participantearnselect">
    <div id="header">
        <button id="home-btn" class="navigation-button">BACK</button>
        <div class="header-text secondary-header">EARN POINTS</div>
    </div>
    <div id="content-card">
        <div id="reader"></div>
        <div class="input-field"><input type="number" id="participant-id" class="primary-input" max="999999"><button id="qr-reader" onclick="startQrScanner();">${cameraEmoji}</button></div>
        <button id="submit-participant-earn-btn" class="submit-button">SUBMIT</button>
        
    </div>
</div>`;

var bb_participantSpendTemplate=`<div id="biblebucks-participantspendselect">
    <div id="header">
        <button id="home-btn" class="navigation-button">BACK</button>
        <div class="header-text secondary-header">SPEND POINTS</div>
    </div>
    <div id="content-card">
        <div id="reader"></div>
        <div class="input-field"><input type="number" id="participant-id" class="primary-input" max="999999"><button id="qr-reader" onclick="startQrScanner();">${cameraEmoji}</button></div>
        <button id="submit-participant-spend-btn" class="submit-button">SUBMIT</button>
        
    </div>
</div>`;