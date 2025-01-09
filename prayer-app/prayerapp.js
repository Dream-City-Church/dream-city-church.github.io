////
// Prayer App JavaScript
// Author: Stephan Swinford, Dream City Church
// Last Updated: 2024-12-30
////

//// Analytics Tracking
// Generate a device ID to store as a permanent cookie
var deviceID = localStorage.getItem('deviceID');
if (!deviceID) {
    deviceID = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceID', deviceID);
}
// Get current URL
var url = window.location.origin;
var url =+ window.location.pathname;
// Get current page
var page = window.location.pathname;

//// Function to get URL parameters
function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key.toLowerCase()] = value;
    });
    return urlVars;
}

//// Get the Contact_GUID from the URL
var contactGUID = getUrlVars()["cid"];

//// Function to load prayers
function loadPrayers() {
    // Get the number of .card elements in #card-container with class of .loaded
    var cardsMinimum = 3;
    var cardsLoaded = document.querySelectorAll('#card-container .card.loaded');
    var cardsVisible = document.querySelectorAll('#card-container .card.visible');
    var cardsDismissed = document.querySelectorAll('#card-container .card.dismissed');

    // Get the data-feedback-guid attribute from each .card element in #card-container
    // Store as comma seperated list in a string variable
    var feedbackGUIDs = '';
    document.querySelectorAll('#card-container .card').forEach(function(card) {
        feedbackGUIDs += card.getAttribute('data-feedback-guid') + ',';
    });
    // Remove the last comma from the string
    feedbackGUIDs = feedbackGUIDs.slice(0, -1);

    // If less than 4 cards are loaded, fetch more prayers
    if (cardsLoaded.length < cardsMinimum) {
        const params = {
            "Contact_GUID": getUrlVars()["cid"],
            "Device_GUID": deviceID,
            "Prayers_Queued": feedbackGUIDs,
            "URL": url,
            "Page": page
        };
        const options = {
            method: 'POST',
            body: JSON.stringify( params ),
            headers: {'Content-Type': 'application/json'}
        };
        fetch( 'https://dcc-apimanagement.azure-api.net/prayerapp/load', options, {timeout: 5000} )
            .then(function (response) {
                // If response code is 200 OK continue, otherwise catch error
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error('Prayer Load Error:', response.status);
                }
            })
            .then(function (data) {
                // For each prayer in the data array
                data.forEach(function(prayer,index) {
                    // Create a new .card element at the end of #card-container
                    var card = document.createElement('div');                
                    card.classList.add('card');
                    // If cardsVisible=0 then add class .visible to the first card
                    if (cardsVisible.length === 0 && index === 0) {
                        card.classList.add('visible');
                        // remove .disabled class from action-button and dismiss-button
                        document.getElementById('action-button').classList.remove('disabled');
                        document.getElementById('dismiss-button').classList.remove('disabled');
                    } else {
                        card.classList.add('loaded');
                    }
                    card.classList.add(prayer.Type);
                    card.setAttribute('data-feedback-guid', prayer._Feedback_GUID);

                    // Set a hex color code based on the value of prayer.Initials
                    var hash = 0;
                    var hashInitials = prayer.Initials+prayer.Initials+prayer.Initials;
                    for (var i = 0; i < hashInitials.length; i++) {
                        hash += hashInitials.charCodeAt(i)*hashInitials.charCodeAt(i);
                    }
                    var avatarColor = '#';
                    for (var i = 0; i < 3; i++) {
                        var value = (hash >> (i * 3)) & 0xFF;
                        avatarColor += ('00' + value.toString(16)).substr(-2);
                    }
                    // If the avatarColor is light, set the textColor to dark, otherwise set it to light
                    var textColor = '#efefef';
                    if (parseInt(avatarColor.substr(1,2), 16)>130 || parseInt(avatarColor.substr(3,2), 16)>130 || parseInt(avatarColor.substr(5,2), 16)>130 ) {
                        textColor = '#333';
                    }

                    card.innerHTML = `
                        <wa-avatar initials="${prayer.Initials}" label="Avatar with initials: SL" shape="circle" style="--background-color: ${avatarColor}; --content-color: ${textColor};"></wa-avatar>
                        <div class="title">${prayer.Title}</div>
                        <div class="date">${prayer.Date}</div>
                        <div class="content">${prayer.Description}</div>
                        <div class="read-more" style="opacity:0;height:0;padding-top:0;">Read More <i class="fa-solid fa-chevrons-down" style="vertical-align:middle"></i></div>`;
                    // If cardsVisible=0 then replace contents of #card-container with card
                    if (cardsVisible.length === 0 && index === 0) {
                        document.getElementById('card-container').innerHTML = '';
                        document.getElementById('card-container').appendChild(card);
                        // If current card has class of .praise-report, add class .praise-report to .action-button
                        if (prayer.Type=='praise-report') {
                            document.getElementById('action-button').classList.add('praise-report');
                            document.getElementById('action-button').setAttribute('data-action-type-id', 2);
                            document.getElementById('action-button').innerHTML = "<i class='fa-solid fa-party-horn'></i>";
                        }
                    } else {
                        document.getElementById('card-container').appendChild(card);
                    }

                    // If the content of the card overflows the card, show the read-more tag.
                    if (card.scrollHeight > card.clientHeight + 10) {
                        card.querySelector('.read-more').style.opacity = '1';
                        card.querySelector('.read-more').style.height = 'revert-layer';
                        card.querySelector('.read-more').style.paddingTop = 'revert-layer';
                    }
                    // Hide the read-more tag when the card has been scrolled to the bottom.
                    card.addEventListener('scroll', function() {
                        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 25) {
                            this.querySelector('.read-more').style.opacity = '0';
                            card.querySelector('.read-more').style.height = '0';
                            card.querySelector('.read-more').style.paddingTop = '0';
                        } else {
                            this.querySelector('.read-more').style.opacity = '1';
                            card.querySelector('.read-more').style.height = 'revert-layer';
                            card.querySelector('.read-more').style.paddingTop = 'revert-layer';
                        }
                        
                    });
                    // Smooth scroll 5 lines if the read-more tag is clicked
                    card.querySelector('.read-more').addEventListener('click', function() {
                        card.scrollBy({top: card.clientHeight/1.5, behavior: 'smooth'});
                    });
                });
            })
            .then(function (cleanup) {
                // Remove the .dismissed cards in #card-container except for the last one
                cardsDismissed.forEach(function(card, index) {
                    if (index < cardsDismissed.length - 1) {
                        card.remove();
                    }
                });
            })
            .catch(function (error) {
                console.log('Prayer Load Error:', error);
                // If there are no cards loaded, show error message in #card-container
                if (cardsLoaded.length === 0 && cardsVisible.length === 0) {
                    document.getElementById('card-container').innerHTML = '<i class="fa-solid fa-face-sad-sweat" style="font-size:2rem;"></i><br /><div id="load-failure">Sorry, something went wrong.<br />Please try again.<br /><br /><a href="" onclick="location.reload();">Reload</a></div>';
                }
            });
    }
}

//// Function to send prayer actions
function actionPrayer(actionTypeId) {
    // Add .disabled class to #action-button and #dismiss-button
    document.getElementById('action-button').classList.add('disabled');
    document.getElementById('dismiss-button').classList.add('disabled');

    const params = {
        "Contact_GUID": contactGUID,
        "Feedback_Entry_GUID": document.querySelector('#card-container .card.visible').getAttribute('data-feedback-guid'),
        "Action_ID": actionTypeId,
        "Device_GUID": deviceID,
        "URL": url,
        "Page": page
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };

    fetch( 'https://dcc-apimanagement.azure-api.net/prayerapp/action', options, {timeout: 5000} )
        .then(function (response) {
            // If response code is 200 OK
            if (response.status === 200) {

                // Reset the animation on #action-message
                document.getElementById('action-message').classList.remove('animate');

                //// Send feedback actions to user
                // Set action-message based on actionTypeId
                var actionMessage = '';
                switch (actionTypeId) {
                    case "1":
                        actionMessage = "I'm Praying! <i class='fa-solid fa-hands-praying'></i>";
                        break;
                    case "2":
                        actionMessage = "I'm Celebrating! <i class='fa-solid fa-party-horn'></i>";
                        document.getElementById('action-message').classList.add('praise');
                        break;
                    case "3":
                        actionMessage = "Skipped <i class='fa-solid fa-forward'></i>";
                        break;
                }

                // Set the innerHTML of #action-message to actionMessage
                document.getElementById('action-message').innerHTML = actionMessage;

                // Add class .animate to #action-message
                document.getElementById('action-message').classList.add('animate');

                setTimeout(function() {

                    //// Rotate cards
                    // Get the .card element in #card-container with class of .visible
                    var card = document.querySelector('#card-container .card.visible');
                    // Add class .dismissed to the .card element
                    card.classList.add('dismissed');
                    // Remove class .visible from the .card element
                    card.classList.remove('visible');
                    // Add class .visible to the next .card element in #card-container with status of .loaded
                    var nextCard = document.querySelector('#card-container .card.loaded');
                    nextCard.classList.add('visible');
                    nextCard.classList.remove('loaded');

                    // If current card has class of .praise-report, add class .praise-report to .action-button
                    if (nextCard.classList.contains('praise-report')) {
                        document.getElementById('action-button').classList.add('praise-report');
                        document.getElementById('action-button').setAttribute('data-action-type-id', 2);
                        document.getElementById('action-button').innerHTML = "<i class='fa-solid fa-party-horn'></i>";
                    } else {
                        document.getElementById('action-button').classList.remove('praise-report');
                        document.getElementById('action-button').setAttribute('data-action-type-id', 1);
                        document.getElementById('action-button').innerHTML = "<i class='fa-solid fa-hands-praying'></i>";
                    }
                    document.getElementById('dismiss-button').innerHTML='<i class="fa-regular fa-forward"></i>';

                    // Remove .disabled class from #action-button and #dismiss-button
                    document.getElementById('action-button').classList.remove('disabled');
                    document.getElementById('dismiss-button').classList.remove('disabled');

                }, 1000);             

                // Call loadPrayers
                loadPrayers();

                setTimeout(function() {
                    document.getElementById('action-message').classList.remove('animate');
                }, 3000);

                // Get the current values for #prayed-for .number-highlight and #celebrated .number-highlight
                var prayedFor = parseInt(document.getElementById('prayed-for').getElementsByClassName('number-highlight')[0].innerHTML);
                var celebrated = parseInt(document.getElementById('celebrated').getElementsByClassName('number-highlight')[0].innerHTML);

                // Increment the value of #prayed-for .number-highlight if actionTypeId=1
                if (actionTypeId === "1") {
                    prayedFor++;
                    document.getElementById('prayed-for').getElementsByClassName('number-highlight')[0].innerHTML = prayedFor;
                } else if (actionTypeId === "2") {
                    celebrated++;
                    document.getElementById('celebrated').getElementsByClassName('number-highlight')[0].innerHTML = celebrated;
                    document.getElementById('action-message').classList.remove('praise');
                };


            } else {
                // If response code is not 200 OK
                console.log('Error:', response.status);
                // exit to catch
                throw new Error('Prayer Action Error:', response.status);
            }
        })
        .catch(function (error) {
            console.log('Prayer Action Error:', error);
            // Show error message in #action-message
            document.getElementById('action-message').innerHTML = 'Sorry, something went wrong.<br />Please try again.';
            // Add class .animate and .error to #action-message
            document.getElementById('action-message').classList.add('animate');
            document.getElementById('action-message').classList.add('error');
            // Remove .disabled class from #action-button and #dismiss-button
            document.getElementById('action-button').classList.remove('disabled');
            document.getElementById('dismiss-button').classList.remove('disabled');
            document.getElementById('action-button').innerHTML = "<i class='fa-solid fa-hands-praying'></i>";
            document.getElementById('dismiss-button').innerHTML='<i class="fa-regular fa-forward"></i>';
            setTimeout(function() {
                document.getElementById('action-message').classList.remove('animate');
                document.getElementById('action-message').classList.remove('error');
            }, 4000);
            
        });
}

//// Call loadPrayers when page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    loadPrayers();
});

//// Run after DOMCONTENTLOADED
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to #action-button
    document.getElementById('action-button').addEventListener('click', function() {
        // Ignore click if button is disabled
        if (this.classList.contains('disabled')) {
            return;
        }
        document.getElementById('action-button').innerHTML='<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
        actionPrayer(document.getElementById('action-button').getAttribute('data-action-type-id'));
    });

    // Add event listener to #dismiss-button
    document.getElementById('dismiss-button').addEventListener('click', function() {
        // Ignore click if button is disabled
        if (this.classList.contains('disabled')) {
            return;
        }
        document.getElementById('dismiss-button').innerHTML='<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
        actionPrayer("3");
    });
});