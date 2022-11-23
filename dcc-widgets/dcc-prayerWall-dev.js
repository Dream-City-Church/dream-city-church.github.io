function addPrayer(prayerID) {
    document.getElementById("prayer-id-"+prayerID).onclick="";
    document.getElementById("prayer-id-"+prayerID).classList.add(".prayer-is-praying");
    document.getElementById("prayer-id-"+prayerID).innerHTML="I'm Praying!";
}

function loadPrayerWall() {
    divHTML = `<br /><div class="dccw-spinnercontainer"><div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>`;
    document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
    
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://prod-28.westus2.logic.azure.com:443/workflows/eaafcdc3ed3a4652bffa62407b02f934/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8UdRnlOJSRoxY-LiSTfhQmYxjOFtpnX2o-8BE192LAg', options)
        .then(function (response) {return response.json();})
        .then(function (data) {
            /*Start DIV writeback*/
            if(data.status=="success"){
                console.log('API success. Returning data.');
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
                console.log('API returned failure. Returning error.');
                divHTML = divHTML+`<p>Sorry, something went wrong. Please try again.</p>`;
                document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
            }
        })
        .catch(function (fail) {
            console.log('API call failed. Returning error.');
            divHTML = `<p>Sorry, something went wrong. Please try again.</p>`;
            document.getElementsByTagName("dcc-PrayerWall")[0].innerHTML = divHTML;
        }
    )
}

window.onload = setTimeout(loadPrayerWall, 500);