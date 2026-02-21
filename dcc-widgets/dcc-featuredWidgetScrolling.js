// Function for enabling horizontal drag scrolling on the widget container
// Add rubber band effect when reaching the end of the container
// This function allows the user to click and drag to scroll horizontally within a container
// Prevent default behavior of the link when dragging
function enableHorizontalScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mouseup', (e) => {
        isDown = false;
        container.classList.remove('active');
        container.style.transition = 'transform 0.2s ease-out'; // Add transition for smooth effect
        container.style.transform = 'translateX(0)'; // Reset transform to 0 on mouse up

        if (isDragging) {
            e.preventDefault(); // Prevent link activation if dragging occurred
        }
    });

    container.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault(); // Prevent link activation if dragging occurred
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1; // The multiplier controls the scroll speed
        container.scrollLeft = scrollLeft - walk;
        container.style.transition = 'none'; // Disable transition while dragging
        container.style.transform = 'translateX(0)'; // Reset transform to 0 while dragging

        // Add rubber band effect
        if (container.scrollLeft <= 0) {
            container.style.transform = `translateX(${Math.min(-container.scrollLeft, 100)}px)`;
        } else if (container.scrollLeft + container.clientWidth >= container.scrollWidth) {
            const excess = container.scrollLeft + container.clientWidth - container.scrollWidth;
            container.style.transform = `translateX(${-Math.min(excess, 100)}px)`;
        } else {
            container.style.transform = 'translateX(0)';
        }
    });

    container.addEventListener('transitionend', () => {
        container.style.transition = '';
    });

    container.addEventListener('mouseleave', () => {
        container.style.transition = 'transform 0.2s ease-out';
        container.style.transform = 'translateX(0)';
    });
}

// Listen for when the widget has been loaded and call the horizontal scroll function and send event.detail
window.addEventListener('widgetLoaded', function(event) {
  widgetId = event.detail.widgetId; // Get the widget ID from the event detail
  const container = document.querySelector(`#${widgetId}`); // Select the widget container using the widget ID
  // If container loaded and is of type #HighlightedGroupsWidget or #HighlightedEventsWidget
  if (container && (container.id === 'HighlightedGroupsWidget' || container.id === 'HighlightedEventsWidget')) {
  enableHorizontalScroll(container); // Call the function to enable horizontal scroll on the container
  }
});