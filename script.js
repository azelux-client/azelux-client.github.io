// Get the element
const onlineCountEl = document.getElementById('online-count');

// Function to generate a random integer between min and max (inclusive)
function getRandomCount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to update the online count
function updateOnlineCount() {
    // Generate a random number from 120 to 160
    const newCount = getRandomCount(120, 160);

    // Update the element text
    onlineCountEl.textContent = `${newCount} online`;
}

// Update count every 2 seconds
setInterval(updateOnlineCount, 2000);

// Optional: initialize immediately
updateOnlineCount();
