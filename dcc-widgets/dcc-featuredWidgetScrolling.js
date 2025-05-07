// Function for enabling horizontal drag scrolling on the widget container
// Add rubber band effect when reaching the end of the container
// This function allows the user to click and drag to scroll horizontally within a container
function enableHorizontalScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1; // The multiplier controls the scroll speed
        container.scrollLeft = scrollLeft - walk;

        // Add rubber band effect
        if (container.scrollLeft <= 0) {
            container.style.transform = `translateX(${Math.min(-container.scrollLeft, 50)}px)`;
        } else if (container.scrollLeft + container.clientWidth >= container.scrollWidth) {
            const excess = container.scrollLeft + container.clientWidth - container.scrollWidth;
            container.style.transform = `translateX(${-Math.min(excess, 50)}px)`;
        } else {
            container.style.transform = 'translateX(0)';
        }
    });

    container.addEventListener('transitionend', () => {
        container.style.transition = '';
    });

    container.addEventListener('mouseup', () => {
        container.style.transition = 'transform 0.2s ease-out';
        container.style.transform = 'translateX(0)';
    });

    container.addEventListener('mouseleave', () => {
        container.style.transition = 'transform 0.2s ease-out';
        container.style.transform = 'translateX(0)';
    });
}

// Listen for when the widget has been loaded and call the horizontal scroll function and send event.detail.widgetId
window.addEventListener('widgetLoaded', function(event) {
  console.log(event);
  const widgetId = event.detail; // Get the widget ID from the event detail
  console.log('Widget loaded:', widgetId); // Log the widget ID for debugging
  const container = document.querySelector(`#${widgetId}`); // Select the widget container using the widget ID
  // If container loaded and is of type #HighlightedGroupsWidget or #HighlightedEventsWidget
  if (container && (container.id === 'HighlightedGroupsWidget' || container.id === 'HighlightedEventsWidget')) {
    enableHorizontalScroll(container); // Call the function to enable horizontal scroll on the container
  }
});