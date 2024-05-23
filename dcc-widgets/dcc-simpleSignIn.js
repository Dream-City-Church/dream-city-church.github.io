class SimpleSignIn extends HTMLElement {

    connectedCallback() {
        // Attach CSS file to page
        var cssLocation='dcc-simpleSignIn.css';

        // Check if a CSS file was provided
        if (this.hasAttribute('customcss')) {
            cssLocation = this.getAttribute('customcss');
        }

        this.innerHTML = `
        <link rel="stylesheet" href="${cssLocation}">
            <div class="ssi-container">
                <div class="spinner-container">
                    <sl-spinner class="loading-spinner"></sl-spinner>
                </div>
                <div class="skeleton-container">
                    <sl-skeleton effect="sheen" class="header-image"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="description-text"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="description-text"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="form-field form-first-name"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="form-field form-last-name"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="form-field form-email-address"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="form-field form-mobile-phone"></sl-skeleton>
                    <sl-skeleton effect="sheen" class="form-button form-submit"></sl-skeleton>
                </div>
            </div>
        `;
    }

}

customElements.define('dcc-simple-sign-in', SimpleSignIn);