// Function for enabling horizontal drag scrolling on the widget container
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
    const walk = (x - startX) * 2; // The multiplier controls the scroll speed
    container.scrollLeft = scrollLeft - walk;
  });
}

// Listen for when the widget has been loaded and call the horizontal scroll function and send event.detail.widgetId
window.addEventListener('widgetLoaded', function(event) {
  const widgetId = event.detail.widgetId; // Get the widget ID from the event detail
  console.log('Widget loaded:', widgetId); // Log the widget ID for debugging
  const container = document.querySelector(`#${widgetId}`); // Select the widget container using the widget ID
  // If container loaded and is of type #HighlightedGroupsWidget or #HighlightedEventsWidget
  if (container && (container.id === 'HighlightedGroupsWidget' || container.id === 'HighlightedEventsWidget')) {
    enableHorizontalScroll(container); // Call the function to enable horizontal scroll on the container
  }
});