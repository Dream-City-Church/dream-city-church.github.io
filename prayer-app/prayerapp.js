// Use only standard JavaScript in this file

function getUrlVars() {
    var urlVars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        urlVars[key] = value;
    });
    return urlVars;
}

var userGUID = getUrlVars()["ug"];

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

    // If less than 4 cards are loaded, fetch more prayers
    if (cardsLoaded.length < cardsMinimum) {
        const params = {
            "User_GUID": getUrlVars()["ug"],
            "Prayers_Queued": feedbackGUIDs
        };
        const options = {
            method: 'POST',
            body: JSON.stringify( params ),
            headers: {'Content-Type': 'application/json'}
        };
        fetch( 'https://dcc-apimanagement.azure-api.net/prayerapp/load', options )
            .then(function (response) {return response.json();})
            .then(function (data) {
                console.log(data);
                // For each prayer in the data array
                data.forEach(function(prayer,index) {
                    console.log('new card. index:', index);
                    // Create a new .card element at the end of #card-container
                    var card = document.createElement('div');                
                    card.classList.add('card');
                    // If cardsVisible=0 then add class .visible to the first card
                    if (cardsVisible.length === 0 && index === 0) {
                        card.classList.add('visible');
                    } else {
                        card.classList.add('loaded');
                    }
                    card.classList.add(prayer.Type);
                    card.setAttribute('data-feedback-guid', prayer._Feedback_GUID);
                    card.innerHTML = `
                        <div class="title">${prayer.Title}</div>
                        <div class="date">${prayer.Date}</div>
                        <div class="content">${prayer.Description}</div>`;
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
                console.log('Error:', error);
            });
    }
}

function actionPrayer(actionTypeId) {
    // Add .disabled class to #action-button and #dismiss-button
    document.getElementById('action-button').classList.add('disabled');
    document.getElementById('dismiss-button').classList.add('disabled');

    const params = {
        "User_GUID": userGUID,
        "Feedback_Entry_GUID": document.querySelector('#card-container .card.visible').getAttribute('data-feedback-guid'),
        "Action_ID": actionTypeId
    };
    const options = {
        method: 'POST',
        body: JSON.stringify( params ),
        headers: {'Content-Type': 'application/json'}
    };
    fetch( 'https://dcc-apimanagement.azure-api.net/prayerapp/action', options )
        .then(function (response) {
            // If response code is 200 OK
            if (response.status === 200) {

                //// Send feedback actions to user
                // Set action-message based on actionTypeId
                var actionMessage = '';
                switch (actionTypeId) {
                    case 1:
                        actionMessage = "I'm Praying! <i class='fa-solid fa-hands-praying'></i>";
                        break;
                    case 2:
                        actionMessage = "I'm Celebrating! <i class='fa-solid fa-party-horn'></i>";
                        break;
                    case 3:
                        actionMessage = "Skipped <i class='fa-solid fa-hand-point-right'></i>";
                        break;
                }

                // Set the innerHTML of #action-message to actionMessage
                document.getElementById('action-message').innerHTML = actionMessage;

                // Add class .animate to #action-message
                document.getElementById('action-message').classList.add('animate');

                setTimeout(function() {
                    // Remove .disabled class from #action-button and #dismiss-button
                    document.getElementById('action-button').classList.remove('disabled');
                    document.getElementById('dismiss-button').classList.remove('disabled');

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
                    if (card.classList.contains('praise-report')) {
                        document.getElementById('action-button').classList.add('praise-report');
                        document.getElementById('action-button').setAttribute('data-action-type-id', 2);
                        document.getElementById('action-button').innerHTML = "<i class='fa-solid fa-party-horn'></i>";
                    } else {
                        document.getElementById('action-button').classList.remove('praise-report');
                        document.getElementById('action-button').setAttribute('data-action-type-id', 1);
                        document.getElementById('action-button').innerHTML = "<i class='fa-solid fa-hands-praying'></i>";
                    }   
                }, 2000);             

                // Call loadPrayers
                loadPrayers();

                setTimeout(function() {
                    document.getElementById('action-message').classList.remove('animate');
                }, 2000);
            }
        })
        .catch(function (error) {
            console.log('Error:', error);
        });
}

// Call loadPrayers when page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    loadPrayers();
});

// Run after DOMCONTENTLOADED
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to #action-button
    document.getElementById('action-button').addEventListener('click', function() {
        // Ignore click if button is disabled
        if (this.classList.contains('disabled')) {
            return;
        }
        actionPrayer(document.getElementById('action-button').getAttribute('data-action-type-id'));
    });

    // Add event listener to #dismiss-button
    document.getElementById('dismiss-button').addEventListener('click', function() {
        // Ignore click if button is disabled
        if (this.classList.contains('disabled')) {
            return;
        }
        actionPrayer(3);
    });
});