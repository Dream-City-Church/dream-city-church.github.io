function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

function addPrayer(prayerID,TypeID) {
    console.log('adding prayer '+prayerID+' with type '+TypeID)
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

function addPrayerFromUrl() {
    const prayerUrlIds = getUrlVars()["prayers"];
    console.log(prayerUrlIds);
    if (prayerUrlIds) {
        const prayerUrlIdArray=prayerUrlIds.split(',');
        prayerUrlIdArray.forEach(prayerUrlId => {
            addPrayer(prayerUrlId,1);
            console.log('prayer id '+prayerUrlId);
        });
    }
}

function loadPrayerWall() {
    console.log('Prayer Wall v0.2301.43');
    /*Initialize local storage for prayed-for prayers*/
    var prayedForPrayers = JSON.parse(localStorage.getItem("prayedForPrayers"));
    if(prayedForPrayers == null) {
        prayedForPrayers = [];
        localStorage.setItem("prayedForPrayers", JSON.stringify(prayedForPrayers));
    }

    /*Initialize loading spinner*/
    divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
    
    /*Set API options*/
    const params = {
        "prayer": 1,
        "praise": 1
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
                divHTML = `<div id="prayer-wall">`;
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
                
                divHTML = divHTML+`</div>`;
                document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;

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
                    if (pDescription.offsetHeight < pDescription.scrollHeight-2) {
                        pDescription.innerHTML += '<button class="prayer-read-more" onclick=\'event.target.parentNode.classList.add("prayer-description-full");event.target.style.display="none";\'>Read More</button>';
                        }
                });
        })
        .then(setTimeout(addPrayerFromUrl,2000))
}

window.onload = setTimeout(loadPrayerWall, 500);