function addPrayer(prayerID) {
    /*Get local storage, append new prayerID, then store back to local*/
    var prayedForPrayers = JSON.parse(localStorage.getItem("prayedForPrayers"));
    prayedForPrayers.push(prayerID);
    localStorage.setItem("prayedForPrayers", JSON.stringify(prayedForPrayers));
    /*Update element to show as prayed for*/
    document.getElementById("prayer-id-"+prayerID).setAttribute('onclick','');
    document.getElementById("prayer-id-"+prayerID).classList.add(".prayer-is-praying");
    document.getElementById("prayer-id-"+prayerID).innerHTML="I'm Praying!";
}

function loadPrayerWall() {
    console.log('Prayer Wall v0.8.1');
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
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-28.westus2.logic.azure.com:443/workflows/eaafcdc3ed3a4652bffa62407b02f934/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8UdRnlOJSRoxY-LiSTfhQmYxjOFtpnX2o-8BE192LAg', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            if(data.status=="success"){
                console.log('Loading Prayer Wall');
                divHTML = `<div id="prayer-wall">`;
                data.prayers[0].forEach((prayer) => {
                    divHTML = divHTML+`<div class="prayer-card">
                    <div class="prayer-name">${prayer.Name}</div>
                    <div class="prayer-date">${prayer.Date}</div>
                    <div class="prayer-description">${prayer.Description}</div>
                    <div class="prayer-action ">
                        <button id="prayer-id-${prayer.PrayerID}" class="prayer-button" onclick="addPrayer(${prayer.PrayerID})">
                            I Will Pray <i class="fa-solid fa-hands-praying"></i> 
                        </button>
                    </div>
                    </div>`;
                }
                )
                
                divHTML = divHTML+`</div>`;
                document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;

            } else {
                /*Report something went wrong - failure response from server*/
                console.log('Prayer Wall resposne failure. Returning error.');
                divHTML = divHTML+`<p>Sorry, something went wrong. Please try again.</p>`;
                document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
            }
        })
        .then(function () {
            /*Loop through Prayed For Prayers and update to show as prayed for*/
            prayedForPrayers.forEach(prayerID) {
                document.getElementById("prayer-id-"+prayerID).setAttribute('onclick','');
                document.getElementById("prayer-id-"+prayerID).classList.add(".prayer-is-praying");
                document.getElementById("prayer-id-"+prayerID).innerHTML="I'm Praying!";
            }
        })
        .catch(function (fail) {
            /*Report something went wrong - couldn't connect to API*/
            console.log('Prayer Wall connection failure. Returning error.');
            divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
            document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
        }
    )
}

window.onload = setTimeout(loadPrayerWall, 500);