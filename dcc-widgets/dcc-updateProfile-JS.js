// This script will listen for chages in the profile form and send the updated data to the server.
// Listen for focus on input fields and track if there are any changes.
// If there are changes, when focus leaves the input field send the updated data to the server.
// Send the name, value, and data-table values from the field.
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('UserProfile');
    const inputs = profileForm.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const name = this.name;
            const value = this.value;
            const dataTable = this.getAttribute('data-table');

            if (name && dataTable) {
                console.log(`Updating profile: ${name} = ${value} in table ${dataTable}`);
                // Here you would typically send the data to the server.
                /**
                fetch('/update-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        value: value,
                        table: dataTable
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Profile updated:', data);
                })
                .catch(error => {
                    console.error('Error updating profile:', error);
                });
                **/
            }
        });
    });
});