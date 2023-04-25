function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function updatePrayerStatus() {
    const feedbackGuid = getUrlVars()["guid"];
    const feedbackAction = getUrlVars()["action"];
    const urlBase = window.location.href.split('?')[0];
    var divHTML = "";
    if (feedbackGuid && feedbackAction){
        const params = {
            guid: feedbackGuid,
            action: feedbackAction
        };
        const options = {
            method: 'POST',
            body: JSON.stringify( params )  
        };
        fetch('https://prod-25.westus2.logic.azure.com:443/workflows/510cfa6ebac0464fa12496d41aa6c356/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fy-hW0-_TydEDcYjNO5jmc_DhWGzT1tAFBpi1eH9BF8', options )
            .then(function (response) {return response.json();})
            .then(function (data) {
                /*Start DIV writeback*/
                divHTML='<p>'+data.Message+'</p>';
                document.getElementById("prayerStatusDialog").innerHTML = divHTML;
                if(data.Status=='success'){
                    document.getElementById("prayerStatusDialog").className = "prayerStatusSuccess";
                } else {
                    document.getElementById("prayerStatusDialog").className = "prayerStatusFailure";
                }
        });
    } else {
        document.getElementById("prayerStatusDialog").innerHTML = divHTML;
    }
}

window.onload = updatePrayerStatus();