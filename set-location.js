<script type="text/Javascript">
Function location_SetPhoenix() {
    Document.cookie = "location_selector=phoenix"
    }
    
Function location_SetScottsdale() {
    Document.cookie = "location_selector=scottsdale"
    }
    
    
Function location_SetGlendale() {
    Document.cookie = "location_selector=glendale"
    }
    
    
Function location_SetWhiteMountains() {
    Document.cookie = "location_selector=whitemountains"
    }
    
    
Function location_SetColoradoCity() {
    Document.cookie = "location_selector=coloradocity"
    }
    
Function location_SetAsheville() {
    Document.cookie = "location_selector=asheville"
    }




 var target = document.getElementById("dynamicEventCalendar");

 var campusID = getCookie("dcc_campusID");
 if(campusID!=0&&campusID!=null){
 target.innerHTML += '<mpp-event-finder target="https://my.dreamcitychurch.us/portal/event_detail.aspx" congregationid="'+campusID+'"></mpp-event-finder>'
 } else {
    target.innerHTML += '<mpp-event-finder target="https://my.dreamcitychurch.us/portal/event_detail.aspx"></mpp-event-finder>'  
 }





    </script>