// This script will listen for chages in the profile form and send the updated data to the server.
// Listen for focus on input fields and track if there are any changes.
// If there are changes, when focus leaves the input field send the updated data to the server.
// Send the name, value, and data-table values from the field.
// If the field update fails, restore the original value and set the field to error state.

console.log('dcc-updateProfile-JS loaded');

import 'cropperjs';

// Function for sending data to the API service
async function sendDataToAPI(name, value, dataTable, dataAttribute) {
    // Implement the logic to send data to the API service
    console.log(`Sending data to API: ${name} = ${value}, data-table = ${dataTable}, data-attribute = ${dataAttribute}`);
    // Add a delay for testing purposes
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate a successful response
            console.log(`Data sent successfully: ${name} = ${value}`);
            // Dispatch success event
            const event = new Event('success');
            document.dispatchEvent(event);
            resolve('success'); // Simulate a successful response
        }, 2000); // Simulate network delay
    });
}

// Function to handle input changes and send data to the API
const inputListeners = async () => {
    await customElements.whenDefined('wa-input');
    await customElements.whenDefined('wa-select');

    const profileForm = document.getElementById('UserProfile');
    const inputs = profileForm.querySelectorAll('wa-input, wa-textarea, wa-select');

    // Add focus event listener to all inputs. Store the current value when the input is focused.
    // On blur, if a change is detected, send the updated data to the server.
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Store the current value in a data attribute for later comparison
            this.setAttribute('data-original-value', this.value);
            console.log(`Focused on input: ${this.name}, original value: ${this.value}`);
        });
        input.addEventListener('change', async function() {
            console.log(`Change detected in input: ${this.name}, new value: ${this.value}`);
            // Compare the current value with the original value
            const originalValue = this.getAttribute('data-original-value');
            if (this.value !== originalValue) {
                const name = this.name;
                const value = this.value;
                const dataTable = this.getAttribute('data-table');
                // Send the updated data to the server. Insert the loading icon into the element until the server responds.
                // This will allow the user to see that the data is being sent.
                const loadingIcon = '<i slot="end" class="fa-solid fa-floppy-disk fa-fade" style="color: #bc204b;"></i>';
                this.appendChild(document.createRange().createContextualFragment(loadingIcon));
                // Create a promise to handle the asynchronous nature of the API call
                // This will allow us to wait for the API response before proceeding
                sendDataToAPI(name, value, dataTable, null).then((result) => {
                    console.log(`Result from sendDataToAPI: ${result}`);
                    // Check the result from the API call
                    if (result === 'success') {
                        this.removeAttribute('error'); // Remove the error state
                        this.removeChild(this.querySelector('[slot="end"]'));
                        this.dispatchEvent(new Event('input')); // Trigger input event to update UI
                    } else {
                        this.setAttribute('error', 'true'); // Set the error state
                        this.removeChild(this.querySelector('[slot="end"]'));
                        this.dispatchEvent(new Event('input')); // Trigger input event to update UI
                    }
                }).catch((error) => {
                    console.error(`Error sending data to API: ${error}`);
                    this.setAttribute('error', 'true'); // Set the error state
                    this.removeChild(this.querySelector('[slot="end"]'));
                    this.dispatchEvent(new Event('input')); // Trigger input event to update UI
                });
            }
        });
    } );


    // for wa-input name=Mobile_Phone, format the phone number like 123-456-7890 as it is typed
    if (inputs.name === 'Mobile_Phone') {
        inputs.addEventListener('input', function() {
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

const checkboxListeners = async () => {
    const profileForm = document.getElementById('UserProfile');
    const checkboxes = profileForm.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        // Store the current checked state in a data attribute for later comparison
        checkbox.setAttribute('data-original-checked', checkbox.checked);

        checkbox.addEventListener('change', async function() {
            const originalValue = this.getAttribute('data-original-checked');
            // Compare the current checked state with the original checked state
            if (this.checked != originalValue) {
                const name = this.name;
                const value = this.checked ? '1' : '0'; // Convert checked state to string
                const dataTable = this.getAttribute('data-table');
                const dataAttribute = this.getAttribute('data-attribute-type') || null;
                const checkboxLabel = profileForm.querySelector(`[for="${this.id}"]`);
                // Send the updated data to the server. Insert the loading icon into the element until the server responds.
                // This will allow the user to see that the data is being sent.
                const loadingIcon = '<i slot="end" class="fa-solid fa-floppy-disk fa-fade" style="color: #bc204b;"></i>';
                checkboxLabel.appendChild(document.createRange().createContextualFragment(loadingIcon));
                try {
                    const result = await sendDataToAPI(name, value, dataTable, dataAttribute);
                    console.log(`Result from sendDataToAPI: ${result}`);
                    // Check the result from the API call
                    if (result === 'success') {
                        this.removeAttribute('error'); // Remove the error state
                        checkboxLabel.removeChild(checkboxLabel.querySelector('[slot="end"]'));
                         checkbox.setAttribute('data-original-checked', this.value); // Update the original checked state
                        this.dispatchEvent(new Event('input')); // Trigger input event to update UI
                    } else {
                        this.setAttribute('error', 'true'); // Set the error state
                        checkboxLabel.removeChild(this.querySelector('[slot="end"]'));
                        this.dispatchEvent(new Event('input')); // Trigger input event to update UI
                    }
                } catch (error) {
                    console.error(`Error sending data to API: ${error}`);
                    this.setAttribute('error', 'true'); // Set the error state
                    checkboxLabel.removeChild(checkboxLabel.querySelector('[slot="end"]'));
                    this.dispatchEvent(new Event('input')); // Trigger input event to update UI
                }
            }
        });
    });
};

const avatarEditing = async () => {
    await customElements.whenDefined('wa-avatar');

    const avatar = document.getElementById('avatar');
    const fileInput = document.getElementById('fileInput');
    const cropContainer = document.getElementById('cropContainer');
    const cropImage = document.getElementById('cropImage');
    const cropButton = document.getElementById('cropButton');
    let cropper;

    avatar.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
        cropImage.src = reader.result;
        cropContainer.style.display = 'block';
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
        });
        };
        reader.readAsDataURL(file);
    });

    cropButton.addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
        });

        canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        fetch('https://your-api.com/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            avatar.src = canvas.toDataURL(); // Update avatar preview
            cropContainer.style.display = 'none';
        })
        .catch(error => {
            console.error('Upload failed:', error);
        });
        }, 'image/jpeg');
    });
}

window.addEventListener('widgetLoaded', function(event) {
  checkboxListeners();
  inputListeners();
  avatarEditing();
});