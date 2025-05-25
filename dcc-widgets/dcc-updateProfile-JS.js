// This script will listen for chages in the profile form and send the updated data to the server.
// Listen for focus on input fields and track if there are any changes.
// If there are changes, when focus leaves the input field send the updated data to the server.
// Send the name, value, and data-table values from the field.
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('UserProfile');
    const inputs = profileForm.querySelectorAll('wa-input, wa-select, wa-textarea');

    inputs.forEach(input => {
        input.addEventListener('change', function() {
            const name = this.name;
            const value = this.select().value;
            const dataTable = this.getAttribute('data-table');

            console.log(`Updating profile: ${name} = ${value}, data-table = ${dataTable}`);
            // Send the updated data to the server

            
        });
    });
});