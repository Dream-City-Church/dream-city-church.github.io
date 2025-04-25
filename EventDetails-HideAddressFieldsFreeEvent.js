function updateAddressFields() {
    const eventDetails = document.querySelector('mpp-event-details');
    if (eventDetails && eventDetails.shadowRoot) {
        const shadowRoot = eventDetails.shadowRoot;
        const addressFormWrapper = shadowRoot.querySelector('#addressFormWrapper');
        
        if (addressFormWrapper) {
            // Create a <style> element
            const style = document.createElement('style');
            style.textContent = `
                #addressFormWrapper {
                    display: none !important;
                }
            `;
            // Append the <style> element to the shadow root
            shadowRoot.appendChild(style);
            console.log('Hiding address fields with inline style');
        } else {
            console.error('Element #addressFormWrapper not found');
        }
    } else {
        console.error('Shadow root not found');
    }
}
