var coinEmoji = String.fromCodePoint(0x1FA99);

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

var bb_participantEarnTemplate=`<div id="biblebucks-participantselect">
    <div id="header">
        <button id="home-btn" class="navigation-button">BACK</button>
        <div class="header-text secondary-header">EARN POINTS</div>
    </div>
    <div id="content-card">
        <div class="input-field"><input id="participant-id" class="primary-input" placeholder="1234"></div>
        <button id="submit-participant-earn-btn" class="submit-button">SUBMIT</button>
    </div>
</div>`;

var bb_participantSpendTemplate=`<div id="biblebucks-participantselect">
    <div id="header">
        <button id="home-btn" class="navigation-button">BACK</button>
        <div class="header-text secondary-header">SPEND POINTS</div>
    </div>
    <div id="content-card">
    <div class="input-field"><input id="participant-id" class="primary-input" placeholder="1234"></div>
        <button id="submit-participant-spend-btn" class="submit-button">SUBMIT</button>
    </div>
</div>`;

var bb_earnPointsTemplate=`<div id="biblebucks-earnpoints">
<div id="header">
    <div id="earn-points-title" class="page-title">EARN POINTS</div>
    <button id="home-btn" class="navigation-button">BACK</button>
    <div id="participant-info" class="participant-info">
        <div class="participant-name">Bilbo Baggins</div>
        <div class="participant-balance">${coinEmoji}475</div>
    </div>
</div>
<div id="content-card">
    <div id="quick-button-grid">
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="25">+25</button>
        </div>
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="50">+50</button>
        </div>
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="75">+75</button>
        </div>
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="100">+100</button>
        </div>
    </div>
    <div class="input-field"><input id="custom-points" class="secondary-input" value="125"></input></div>
    <button id="submit-points-earn-btn" class="submit-button">SUBMIT</button>
</div>
</div>`;

var bb_spendPointsTemplate=`<div id="biblebucks-earnpoints">
<div id="header">
    <div id="earn-points-title" class="page-title">EARN POINTS</div>
    <button id="back-home" class="navigation-button">BACK</button>
    <div id="participant-info" class="participant-info">
        <div class="participant-name">Bilbo Baggins</div>
        <div class="participant-balance">${coinEmoji}475</div>
    </div>
</div>
<div id="content-card">
    <div id="quick-button-grid">
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="-25">-25</button>
        </div>
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="-50">-50</button>
        </div>
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="-75">-75</button>
        </div>
        <div class="quick-button">
            <button id="quickpoint-button" class="quickpoint-button" value="-100">-100</button>
        </div>
    </div>
    <div class="input-field"><input id="custom-points" class="secondary-input" value="-150"></input></div>
    <button id="submit-points-spend-btn" class="submit-button">SUBMIT</button>
</div>
</div>`;