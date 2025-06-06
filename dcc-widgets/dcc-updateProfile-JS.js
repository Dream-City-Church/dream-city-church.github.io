// This script will listen for chages in the profile form and send the updated data to the server.
// Listen for focus on input fields and track if there are any changes.
// If there are changes, when focus leaves the input field send the updated data to the server.
// Send the name, value, and data-table values from the field.

console.log('dcc-updateProfile-JS loaded');
// All Web Awesome components on the page are ready!

const inputListeners = async () => {
    await customElements.whenDefined('wa-input');

    const profileForm = document.getElementById('UserProfile');
    const inputs = profileForm.querySelectorAll('wa-input, wa-textarea');

    inputs.forEach(input => {
        input.addEventListener('change', function() {
            const name = this.name;
            const value = this.value;
            const dataTable = this.getAttribute('data-table');

            console.log(`Updating profile: ${name} = ${value}, data-table = ${dataTable}`);
            // Send the updated data to the server
        });

        // for wa-input name=Mobile_Phone, format the phone number like 123-456-7890 as it is typed
        if (input.name === 'Mobile_Phone') {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, ''); // Remove non-digit characters
                if (value.length > 3 && value.length <= 6) {
                    value = `${value.slice(0, 3)}-${value.slice(3)}`;
                } else if (value.length > 6) {
                    value = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
                this.value = value;
            });
        }
    }
    );
};

const selectListeners = async () => {
    await customElements.whenDefined('wa-select');

    const profileForm = document.getElementById('UserProfile');
    const inputs = profileForm.querySelectorAll('wa-select');

    // Find any wa-select elements that have a value attribute set and trigger a change event to force visual update
    const selects = profileForm.querySelectorAll('wa-select[value]');
    selects.forEach(select => {
        const value = select.getAttribute('value');
        if (value) {
            console.log(`Triggering change for wa-select with value: ${value}`);
            select.value = value; // Set the value to trigger the change
            select.dispatchEvent(new Event('change')); // Dispatch change event
        }
    });

    // Add change event listeners to all wa-select elements
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            const name = this.name;
            const value = this.value;
            const dataTable = this.getAttribute('data-table');

            console.log(`Updating profile: ${name} = ${value}, data-table = ${dataTable}`);
            // Send the updated data to the server
        });
    }
    );
};

const checkboxListeners = async () => {
    const profileForm = document.getElementById('UserProfile');
    const checkboxes = profileForm.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const action = this.checked;
            const name = this.name;
            const value = this.value;
            const dataTable = this.getAttribute('data-table');
            const dataType = this.getAttribute('data-attribute-type');

            console.log(`Updating profile: ${action} ${name} = ${value}, data-table = ${dataTable}, data-type = ${dataType}`);
            // Send the updated data to the server
        });
    });
};

inputListeners();
selectListeners();

window.addEventListener('widgetLoaded', function(event) {
  checkboxListeners();
});