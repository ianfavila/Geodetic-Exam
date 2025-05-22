// card-sorter.js

document.addEventListener('DOMContentLoaded', () => {
    const sortOrderSelect = document.getElementById('sortOrder');

    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', (event) => {
            const sortBy = event.target.value;
            applySorting(sortBy);
        });
    } else {
        console.error('Sort order select element (#sortOrder) not found.');
    }
});

/**
 * Applies sorting to the currently loaded cards and re-renders them.
 * @param {string} sortBy - The sorting criteria ('newest', 'oldest', 'default').
 */
function applySorting(sortBy) {
    // --- Integration Point with card-viewer.js ---
    // Ensure 'window.loadedCards' is populated with the array of card objects currently in view.
    // Each card object MUST have a 'createdAt' field, which should be a Firebase Timestamp object
    // or an object with a toMillis() method, or a value that can be converted to milliseconds.
    // Example card object: { id: 'xyz', question: 'Q', answer: 'A', createdAt: firebase.firestore.Timestamp.now() }

    if (!window.loadedCards || !Array.isArray(window.loadedCards)) {
        console.warn("Card sorter: 'window.loadedCards' is not available or not an array. Cannot sort.");
        return;
    }
    if (window.loadedCards.length === 0) {
        // console.log("Card sorter: No cards loaded to sort.");
        return; // Nothing to sort
    }

    let sortedCards = [...window.loadedCards]; // Create a copy to sort

    // Check if cards have a valid timestamp for sorting.
    // Firestore Timestamps have a toMillis() method.
    const hasValidTimestamps = sortedCards.every(card => card && card.createdAt && typeof card.createdAt.toMillis === 'function');

    if (!hasValidTimestamps && (sortBy === 'newest' || sortBy === 'oldest')) {
        console.warn("Card sorter: Some cards are missing a valid 'createdAt' Firestore Timestamp (or toMillis method). Sorting by date might be unreliable. Ensure your cards have a 'createdAt' field populated correctly from Firebase.");
        // Optionally, you could fall back to a default sort or alert the user.
        // For now, we'll proceed, but it might not sort as expected.
    }

    switch (sortBy) {
        case 'newest':
            sortedCards.sort((a, b) => {
                // Handle cases where createdAt might be missing or not a Firestore Timestamp object
                const timeA = (a.createdAt && typeof a.createdAt.toMillis === 'function') ? a.createdAt.toMillis() : 0;
                const timeB = (b.createdAt && typeof b.createdAt.toMillis === 'function') ? b.createdAt.toMillis() : 0;
                return timeB - timeA; // Newest first (descending order of timestamps)
            });
            break;
        case 'oldest':
            sortedCards.sort((a, b) => {
                const timeA = (a.createdAt && typeof a.createdAt.toMillis === 'function') ? a.createdAt.toMillis() : 0;
                const timeB = (b.createdAt && typeof b.createdAt.toMillis === 'function') ? b.createdAt.toMillis() : 0;
                return timeA - timeB; // Oldest first (ascending order of timestamps)
            });
            break;
        case 'default':
            // --- Integration Point with card-viewer.js ---
            // 'window.originalLoadedCards' should be a copy of the cards in their initial fetched order.
            if (window.originalLoadedCards && Array.isArray(window.originalLoadedCards)) {
                sortedCards = [...window.originalLoadedCards];
            } else {
                // Fallback: if no original order saved, maybe sort by ID or do nothing.
                // This depends on what 'default' means for your application.
                // Sorting by an 'id' field if present:
                if (sortedCards.length > 0 && typeof sortedCards[0].id !== 'undefined') {
                    sortedCards.sort((a, b) => String(a.id).localeCompare(String(b.id)));
                }
                console.warn("Card sorter: 'window.originalLoadedCards' not found for default sort. Cards may not be in their initial order.");
            }
            break;
        default:
            console.warn(`Card sorter: Unknown sort criteria: ${sortBy}`);
            return; // Do nothing if criteria is unknown
    }

    // --- Integration Point with card-viewer.js ---
    // After sorting, re-render the cards using a function from card-viewer.js.
    // This function should clear the existing cards and display the sorted ones.
    // It also needs the current subject and topic name, which should be available globally or passed.
    // e.g., window.currentSubject, window.currentTopicName
    if (typeof window.displayCardsInContainer === 'function') {
        // These global variables currentSubject and currentTopicName must be set by card-viewer.js
        const subject = window.currentSubject || ''; 
        const topicName = window.currentTopicName || '';
        
        window.displayCardsInContainer(sortedCards, subject, topicName);
        
        // Update the globally accessible list of currently displayed cards
        window.loadedCards = sortedCards; // Update with the sorted list

        // --- Integration Point with card-viewer.js ---
        // Reset card navigation if it exists (e.g., current card index)
        if (typeof window.updateCardNavigation === 'function' && typeof window.currentCardIndex !== 'undefined') {
            window.currentCardIndex = 0; // Reset to the first card
            window.updateCardNavigation(); // Update the navigation display (e.g., "Card 1 of X")
        }
         // If you have a function to update the card counter specifically
        if (typeof window.updateCardCounter === 'function' && typeof window.currentCardIndex !== 'undefined') {
            window.updateCardCounter(sortedCards.length, window.currentCardIndex);
        }


    } else {
        console.error('Card sorter: `window.displayCardsInContainer` function is not defined. Cannot re-render sorted cards.');
    }
}
