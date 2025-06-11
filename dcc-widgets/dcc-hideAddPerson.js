// Get the value of "id" parameter from the URL
const urlIdParams = new URLSearchParams(window.location.search);
const id = urlIdParams.get('id');

const blockedIds = ['90893', '456', '789'];

console.log('ID from URL:', id);

// Check if the "id" parameter is present and not empty
if (id) {
    // If the ID value is in the blocked ID list, add a css style to the head of the page to hide the div with id "addAnotherButton"
    if (blockedIds.includes(id)) {
        const style = document.createElement('style');
        style.innerHTML = `
            #addAnotherButton {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}
// If the ID value is not in the blocked ID list, do nothing