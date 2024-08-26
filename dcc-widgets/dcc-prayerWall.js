/* Set starting variables */
const versionNumber = '1.240826';
var pageNum = 1;
var maxPrayerId = 0;

/* Function for getting URL variables */
function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

/* Function for prayer as prayed for */
function addPrayer(prayerID,TypeID) {
    document.getElementById("prayer-id-"+prayerID).classList.add("prayer-is-praying");
    document.getElementById("prayer-id-"+prayerID).innerHTML='<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
    const params = {
        "prayerID": prayerID,
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-24.westus2.logic.azure.com:443/workflows/434c7064b3204e948e1dcc7a96dfe540/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0imIlONgjS1gpDOm9g2DG-dv4_iZzO5H-KnRn6IYGAc', options )
        .then(function (response) {return response.json();})
        .then(function (data) {
            if(data.status=="success"){
                /*Get local storage, append new prayerID, then store back to local*/
                var prayedForPrayers = JSON.parse(localStorage.getItem("prayedForPrayers"));
                prayedForPrayers.push(prayerID);
                localStorage.setItem("prayedForPrayers", JSON.stringify(prayedForPrayers));
                /*Update element to show as prayed for*/
                document.getElementById("prayer-id-"+prayerID).setAttribute('onclick','');
                document.getElementById("prayer-id-"+prayerID).classList.add("prayer-is-praying");
                if(TypeID==1){
                    document.getElementById("prayer-id-"+prayerID).innerHTML="I'm Praying!";}
                else if(TypeID==2){
                    document.getElementById("prayer-id-"+prayerID).innerHTML="I'm Celebrating!";}
            }else{
                document.getElementById("prayer-id-"+prayerID).classList.remove("prayer-is-praying");
                if(TypeID==1){document.getElementById("prayer-id-"+prayerID).innerHTML='I Will Pray <i class="fa-solid fa-hands-praying"></i> ';}
                else if(TypeID==2){document.getElementById("prayer-id-"+prayerID).innerHTML='Celebrate! <i class="fa-solid fa-hands-praying"></i> ';}
            };
        })
        .catch(function(fail){
            document.getElementById("prayer-id-"+prayerID).classList.remove("prayer-is-praying");
            if(TypeID==1){document.getElementById("prayer-id-"+prayerID).innerHTML='I Will Pray <i class="fa-solid fa-hands-praying"></i> ';}
            else if(TypeID==2){document.getElementById("prayer-id-"+prayerID).innerHTML='Celebrate! <i class="fa-solid fa-hands-praying"></i> ';}
        })
}

/* Function for adding prayers as prayed for from URL */
function addPrayerFromUrl() {
    const prayerUrlIds = getUrlVars()["prayers"];
    if (prayerUrlIds) {
        const prayerUrlIdArray=prayerUrlIds.split(',');
        prayerUrlIdArray.forEach(prayerUrlId => {
            addPrayer(prayerUrlId,1);
        });
        document.getElementById("prayer-wall-status-message").innerHTML="Thank you for praying!";
        document.getElementById("prayer-wall-status-message").className = "prayerStatusSuccess";
        // Remove "prayers" from URL
        var url = window.location.href;
        var urlParts = url.split('?');
        if (urlParts.length > 1) {
            var baseUrl = urlParts[0];
            var params = urlParts[1].split('&');
            var newUrl = baseUrl;
            for (var i = 0; i < params.length; i++) {
                var parameter = params[i].split('=');
                if (parameter[0] != 'prayers') {
                    if (newUrl.indexOf('?') == -1) {
                        newUrl += '?' + params[i];
                    } else {
                        newUrl += '&' + params[i];
                    }
                }
            }
            window.history.replaceState({}, document.title, newUrl);
        }
    }
}

/* Function for reloading prayer wall */
function reloadPrayerWall() {
    pageNum = 1;
    let prayerCards = document.querySelectorAll('.prayer-card');
    document.getElementById("loadMorePrayers").remove();
    prayerCards.forEach(prayerCard => {
        prayerCard.remove();
    });
    document.getElementById("reload-prayer-wall").innerHTML='Refresh <i class="fa-solid fa-arrows-rotate"></i>';
    document.getElementById("reload-prayer-wall").classList.remove('new-prayers-available');
    loadPrayers();
}

/* Function to check if there are any new prayers */
function checkForNewPrayers() {
    var newMaxPrayerId = 0;
    const params = {
        "prayer": 1,
        "praise": 1,
        "pageNum": 1
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-28.westus2.logic.azure.com:443/workflows/eaafcdc3ed3a4652bffa62407b02f934/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8UdRnlOJSRoxY-LiSTfhQmYxjOFtpnX2o-8BE192LAg', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            if(data.status=="success"){
                newMaxPrayerId = Math.max.apply(Math, data.prayers[0].map(function(o) { return o.PrayerID; }));

                if(newMaxPrayerId > maxPrayerId){
                    document.getElementById("reload-prayer-wall").innerHTML='There are new prayers! <i class="fa-solid fa-arrows-rotate"></i>';
                    document.getElementById("reload-prayer-wall").className = 'new-prayers-available';
                }
            }
        })
}

/* Function for loading more prayers */
function loadMorePrayers() {
    pageNum = pageNum+1;
    document.querySelector("#loadMorePrayers").remove();
    loadPrayers();
}

/* Function for initial loading of prayer wall */
function loadPrayerWall() {
    console.log('Prayer Wall v'+versionNumber);
    divHTML = `<div id="prayer-wall"><div id="prayer-wall-status-message"></div><div id="reload-prayer-wall" onclick="reloadPrayerWall()">Refresh <i class="fa-solid fa-arrows-rotate"></i></div></div>`;
    document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
    loadPrayers();
    setInterval(checkForNewPrayers, 120*1000);
}

/* Function for loading prayers */
function loadPrayers() {
    divHTML = `
        <div class="prayer-card prayer-wall-skeleton">
            <div class="prayer-name"><sl-skeleton effect="sheen"></sl-skeleton></div>
            <div class="prayer-date"><sl-skeleton effect="sheen"></sl-skeleton></div>
            <div class="prayer-description">
                <sl-skeleton effect="sheen"></sl-skeleton>
                <sl-skeleton effect="sheen"></sl-skeleton>

            </div>
            <div class="prayer-action">
                <sl-skeleton effect="pulse"></sl-skeleton>
            </div>
        </div>
        <div class="prayer-card prayer-wall-skeleton">
            <div class="prayer-name"><sl-skeleton effect="sheen"></sl-skeleton></div>
            <div class="prayer-date"><sl-skeleton effect="sheen"></sl-skeleton></div>
            <div class="prayer-description">
                <sl-skeleton effect="sheen"></sl-skeleton>
                <sl-skeleton effect="sheen"></sl-skeleton>
                <sl-skeleton effect="sheen"></sl-skeleton>
                <sl-skeleton effect="sheen"></sl-skeleton>
            </div>
            <div class="prayer-action">
                <sl-skeleton effect="pulse"></sl-skeleton>
            </div>
        </div>
        <div class="prayer-card prayer-wall-skeleton">
            <div class="prayer-name"><sl-skeleton effect="sheen"></sl-skeleton></div>
            <div class="prayer-date"><sl-skeleton effect="sheen"></sl-skeleton></div>
            <div class="prayer-description">
                <sl-skeleton effect="sheen"></sl-skeleton>
                <sl-skeleton effect="sheen"></sl-skeleton>
                <sl-skeleton effect="sheen"></sl-skeleton>
            </div>
            <div class="prayer-action">
                <sl-skeleton effect="pulse"></sl-skeleton>
            </div>
        </div>
    `;
    document.querySelector("#prayer-wall").innerHTML += divHTML;

    /*Initialize local storage for prayed-for prayers*/
    var prayedForPrayers = JSON.parse(localStorage.getItem("prayedForPrayers"));
    if(prayedForPrayers == null) {
        prayedForPrayers = [];
        localStorage.setItem("prayedForPrayers", JSON.stringify(prayedForPrayers));
    }
    
    /*Set API options*/
    const params = {
        "prayer": 1,
        "praise": 1,
        "pageNum": pageNum
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-28.westus2.logic.azure.com:443/workflows/eaafcdc3ed3a4652bffa62407b02f934/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8UdRnlOJSRoxY-LiSTfhQmYxjOFtpnX2o-8BE192LAg', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            if(data.status=="success"){
                divHTML = ``;
                data.prayers[0].forEach((prayer) => {
                    if(prayedForPrayers.indexOf(prayer.PrayerID)!==-1){
                        if(prayer.TypeID==1){
                            /* Prayer ID found in local storage as prayed for */
                            divHTML = divHTML+`<div class="prayer-card">
                            <div class="prayer-name">Prayer Request from ${prayer.Name}</div>
                            <div class="prayer-date">${prayer.Date}</div>
                            <div class="prayer-description">${prayer.Description}</div>
                            <div class="prayer-action ">
                                <button id="prayer-id-${prayer.PrayerID}" class="prayer-button prayer-is-praying">
                                    I'm Praying! 
                                </button>
                            </div>
                            </div>`;
                        }else if(prayer.TypeID==2){
                            /* Prayer ID found in local storage as prayed for - Praise Reports*/
                            divHTML = divHTML+`<div class="prayer-card praise-report">
                            <div class="prayer-name">Praise Report from ${prayer.Name}</div>
                            <div class="prayer-date">${prayer.Date}</div>
                            <div class="prayer-description">${prayer.Description}</div>
                            <div class="prayer-action ">
                                <button id="prayer-id-${prayer.PrayerID}" class="prayer-button prayer-is-praying">
                                    I'm Celebrating!
                                </button>
                            </div>
                            </div>`;
                        }
                    } else {
                        if(prayer.TypeID==1){
                            /* Prayer ID not found in local storage as prayed for */
                            divHTML = divHTML+`<div class="prayer-card">
                            <div class="prayer-name">Prayer Request from ${prayer.Name}</div>
                            <div class="prayer-date">${prayer.Date}</div>
                            <div class="prayer-description">${prayer.Description}</div>
                            <div class="prayer-action ">
                                <button id="prayer-id-${prayer.PrayerID}" class="prayer-button" onclick="addPrayer(${prayer.PrayerID},${prayer.TypeID})">
                                    I Will Pray <i class="fa-solid fa-hands-praying"></i> 
                                </button>
                            </div>
                            </div>`;
                        } else if(prayer.TypeID==2) {
                            /* Prayer ID not found in local storage as prayed for - Praise Report */
                            divHTML = divHTML+`<div class="prayer-card praise-report">
                            <div class="prayer-name">Praise Report from ${prayer.Name}</div>
                            <div class="prayer-date">${prayer.Date}</div>
                            <div class="prayer-description">${prayer.Description}</div>
                            <div class="prayer-action ">
                                <button id="prayer-id-${prayer.PrayerID}" class="prayer-button" onclick="addPrayer(${prayer.PrayerID},${prayer.TypeID})">
                                    Celebrate! <i class="fa-solid fa-hands-clapping"></i> 
                                </button>
                            </div>
                            </div>`;
                        }
                    }
                }
                )

                /* select the max prayer ID number then update variable */
                returnedMaxPrayerId = Math.max.apply(Math, data.prayers[0].map(function(o) { return o.PrayerID; }));
                if(returnedMaxPrayerId > maxPrayerId){
                    maxPrayerId = returnedMaxPrayerId;
                }
                
                document.querySelectorAll(".prayer-wall-skeleton").forEach(e => e.remove());

                if (pageNum < 4) {
                    /*Add Load More button if there are less than 4 pages already loaded*/
                    divHTML = divHTML+`<button id="loadMorePrayers" class="prayer-button" onclick="loadMorePrayers()">Load More Prayers</button></div>`;
                }
                document.querySelector("#prayer-wall").innerHTML += divHTML;

            } else {
                /*Report something went wrong - failure response from server*/
                console.log('Prayer Wall response failure. Returning error.');
                divHTML = divHTML+`<p>Sorry, something went wrong. Please try again later.</p>`;
                document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
            }
        })
        .catch(function (fail) {
            /*Report something went wrong - couldn't connect to API*/
            console.log('Prayer Wall connection failure. Returning error.');
            console.log(fail);
            divHTML = `<p>Sorry, something went wrong. Please try again later.</p>`;
            document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
        })
        .then(function (readMore) {
            /* Adds a Read More button to long description boxes */
            const prayerDescriptions = document.querySelectorAll('.prayer-description')
                prayerDescriptions.forEach(pDescription => {
                    var buttons = pDescription.getElementsByTagName('button');
                    if (pDescription.offsetHeight < pDescription.scrollHeight-2 && buttons.length < 1) {
                        pDescription.innerHTML += '<button class="prayer-read-more" onclick=\'event.target.parentNode.classList.add("prayer-description-full");event.target.style.display="none";\'>Read More</button>';
                        }
                });
        })
        .then(setTimeout(addPrayerFromUrl,3000))
}

window.onload = setTimeout(loadPrayerWall, 500);