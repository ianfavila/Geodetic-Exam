// Current folder, topic, and card variables
let currentSubject = '';
let currentTopic = '';
let currentCardIndex = 0;
let allCards = []; // This remains the primary array for internal logic, especially single card view
let isFullscreen = false;

// --- ADDITIONS FOR SORTER ---
// These will be populated when cards are loaded for the current view
window.loadedCards = [];
window.originalLoadedCards = [];
// Expose current subject and topic for the sorter
// These will be updated in loadCards and loadSingleCard
window.currentSubject = currentSubject;
window.currentTopicName = currentTopic; // Sorter expects currentTopicName
window.currentCardIndex = currentCardIndex; // Sorter uses this
// --- END ADDITIONS FOR SORTER ---


// Constants for mastery status
const MASTERY_STATUS = {
    UNKNOWN: 0,
    NEEDS_PRACTICE: 1,
    MASTERED: 2
};

// Local storage key for mastery data
const MASTERY_STORAGE_KEY = "geodetic_card_mastery";

// Current study session variables
let masteryMode = false;
let currentMasteryCards = [];
let masteryStats = {
    mastered: 0,
    needsPractice: 0,
    unknown: 0
};

// DOM elements
const urlParams = new URLSearchParams(window.location.search);
const folderName = urlParams.get('folder');
const topicName = urlParams.get('topic');
const cardIndex = urlParams.get('card') !== null ? parseInt(urlParams.get('card')) : null;

// Initialize page when loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Enhanced card viewer loaded with image support and sorter integration.");

    // Set global variables from URL
    currentSubject = folderName;
    currentTopic = topicName;
    window.currentSubject = currentSubject; // Update window version
    window.currentTopicName = currentTopic; // Update window version


    // Setup fullscreen functionality
    setupFullscreenMode();

    // Setup touch swipe functionality
    setupTouchSwipe();

    // Setup keyboard navigation
    setupKeyboardNavigation();

    // Setup mastery swipe gestures
    setupMasterySwipeGestures();

    // Setup mastery keyboard shortcuts
    setupMasteryKeyboardShortcuts();

    // Initialize UI elements
    initializeUI();

    // Setup delete topic dialog
    setupDeleteTopicDialog();

    // Handle Add Subtopic form submission
    setupAddSubtopicForm();

    // Handle inline add card form submission with image support
    setupInlineAddCardForm();

    // Add mastery mode button click handler
    const masteryModeBtn = document.getElementById('masteryModeBtn');
    if (masteryModeBtn) {
        masteryModeBtn.addEventListener('click', toggleMasteryMode);
    }

    // Add reset mastery data button click handler
    const resetMasteryBtn = document.getElementById('resetMasteryBtn');
    if (resetMasteryBtn) {
        resetMasteryBtn.addEventListener('click', resetMasteryData);
    }

    // Set up image upload preview
    const imageUploadInput = document.getElementById('cardImageUpload');
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const imagePreviewContainer = document.getElementById('imagePreview'); // Ensure this ID matches HTML

            if (file && imagePreviewContainer) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreviewContainer.innerHTML = `
                        <div class="image-preview-container">
                            <img src="${event.target.result}" alt="Card image preview" class="image-preview">
                            <button type="button" class="remove-image-btn" onclick="removeImagePreview()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Load content based on URL parameters
    loadContent();
});

// --- NEW FUNCTION FOR SORTER ---
// Function to display cards in the grid container (called by card-sorter.js and loadCards)
function displayCardsInContainer(cardsToDisplay, subjectForDisplay, topicForDisplay) {
    const cardContainer = document.getElementById('cardContainer');
    const noCardsMessage = document.getElementById('noCardsMessage');
    const cardNavigation = document.getElementById('cardNavigation');


    if (!cardContainer) {
        console.error("displayCardsInContainer: cardContainer element not found.");
        return;
    }
    cardContainer.innerHTML = ''; // Clear existing cards from grid

    // Hide single card navigation when displaying grid
    if (cardNavigation) cardNavigation.style.display = 'none';


    if (!cardsToDisplay || cardsToDisplay.length === 0) {
        if (noCardsMessage) noCardsMessage.style.display = 'block';
        allCards = []; // Update internal allCards
    } else {
        if (noCardsMessage) noCardsMessage.style.display = 'none';
        allCards = [...cardsToDisplay]; // Update internal allCards to reflect the sorted/current grid

        cardsToDisplay.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'index-card';
            cardElement.setAttribute('data-id', card.id);

            const imageHtml = card.imageUrl ?
                `<div class="card-image"><img src="${card.imageUrl}" alt="Card image" class="card-image-content" onerror="this.style.display='none'"></div>` : '';

            cardElement.innerHTML = `
                <div class="card-content" onclick="flipCardContent(this.parentElement)"> <div class="card-front"><h3>${escapeHtml(card.question || 'Question')}</h3>${imageHtml}</div>
                    <div class="card-back" style="display: none;"><p>${escapeHtml(card.answer || 'Answer')}</p></div>
                </div>
                <div class="card-tools">
                    <button class="flip-btn" onclick="flipCard(this.closest('.index-card').querySelector('.flip-btn')); event.stopPropagation();">Show Answer</button>
                    <a href="card-viewer.html?folder=${encodeURIComponent(subjectForDisplay)}&topic=${encodeURIComponent(topicForDisplay)}&card=${index}" class="view-single-btn">View Card</a>
                    <button class="edit-button edit-control disabled" onclick="showInlineEditForm('${card.id}'); event.stopPropagation();" disabled>Edit</button>
                    <button class="delete-btn edit-control disabled" onclick="deleteCard('${card.id}'); event.stopPropagation();" disabled title="Delete card"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            cardContainer.appendChild(cardElement);
        });
    }

    if (checkEditAccess()) {
        enableEditControls();
    }
    // Reset currentCardIndex as the grid view doesn't use it in the same way as single card view.
    // Or, if you want "View Card" to pick the right one from the sorted list, `allCards` is now sorted.
    currentCardIndex = 0; // Reset for safety if user switches to single view later.
    window.currentCardIndex = currentCardIndex;
}
window.displayCardsInContainer = displayCardsInContainer; // Expose to sorter
// --- END NEW FUNCTION FOR SORTER ---

// --- FUNCTIONS EXPOSED/WRAPPED FOR SORTER ---
window.updateCardNavigation = function() {
    if (document.getElementById('cardNavigation').style.display === 'flex') {
        updateNavigationButtons(); // Uses global allCards and currentCardIndex
        // The internal updateCardCounter will be called by updateNavigationButtons or separately
        // For the sorter, we provide a more direct way:
        const internalCardCounter = document.getElementById('cardCounter');
        if (internalCardCounter && allCards.length > 0) {
             internalCardCounter.textContent = `Card ${currentCardIndex + 1} of ${allCards.length}`;
        } else if (internalCardCounter) {
            internalCardCounter.textContent = '';
        }
    }
};

window.updateCardCounter = function(total, currentIndexFromSorter) {
    // This is specifically for the sorter's call.
    // It updates the counter if in single card view.
    // The sorter calls this after displayCardsInContainer, so cardNavigation might be hidden.
    // We should only update if cardNavigation is visible.
    const cardCounterElement = document.getElementById('cardCounter');
    const cardNavigationElement = document.getElementById('cardNavigation');

    if (cardCounterElement && cardNavigationElement && cardNavigationElement.style.display === 'flex') {
        if (typeof total === 'number' && total > 0 && typeof currentIndexFromSorter === 'number') {
            cardCounterElement.textContent = `Card ${currentIndexFromSorter + 1} of ${total}`;
        } else if (allCards.length > 0) { // Fallback to globals if sorter didn't provide specifics
             cardCounterElement.textContent = `Card ${currentCardIndex + 1} of ${allCards.length}`;
        }
         else {
            cardCounterElement.textContent = '';
        }
    }
};
// --- END FUNCTIONS EXPOSED/WRAPPED FOR SORTER ---


// Function to initialize UI elements
function initializeUI() {
    // Initialize edit status indicator
    const editStatusIndicator = document.getElementById('editStatusIndicator');
    if (editStatusIndicator) {
        if (checkEditAccess()) {
            editStatusIndicator.innerHTML = '<i class="fas fa-unlock"></i> Edit Mode: Active';
            editStatusIndicator.classList.remove('edit-locked');
            editStatusIndicator.classList.add('edit-active'); // Make sure this class exists or is styled
            enableEditControls();
        } else {
            editStatusIndicator.innerHTML = '<i class="fas fa-lock"></i> Edit Mode: Locked';
            editStatusIndicator.classList.add('edit-locked');
            // disableEditControls(); // Ensure controls are disabled if not active
        }
    }

    // Update folder title and description
    if (folderName) {
        document.getElementById('currentFolderName').textContent = folderName;
        document.getElementById('folderTitle').textContent = folderName;
        // document.getElementById('folderDescription').textContent = getFolderDescription(folderName); // Ensure getFolderDescription exists
    }

    // Update topic breadcrumb if on a topic
    if (topicName) {
        const displayTopicName = topicName.includes('/') ? topicName.split('/').pop() : topicName;
        document.getElementById('currentTopicName').textContent = displayTopicName;
        document.getElementById('topicBreadcrumb').style.display = 'inline';
        document.getElementById('folderTitle').textContent = `${folderName} / ${displayTopicName}`;
    }

    // Setup view cards button
    setupViewCardsButton();

    // Show/hide shuffle button based on context
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        if (topicName) { // Only show shuffle if in a topic (where cards are)
            shuffleBtn.style.display = 'flex';
        } else {
            shuffleBtn.style.display = 'none';
        }
    }
}

// Function to load content based on URL parameters
function loadContent() {
    if (!folderName) {
        window.location.href = 'indexcards.html';
        return;
    }

    // Update global subject/topic references for sorter and internal use
    currentSubject = folderName;
    currentTopic = topicName;
    window.currentSubject = currentSubject;
    window.currentTopicName = currentTopic;


    if (topicName) {
        if (cardIndex !== null) {
            loadSingleCard(folderName, topicName, cardIndex);
            setupCardNavigation(); // This shows the navigation
        } else {
            loadCards(folderName, topicName); // Loads grid view
        }
    } else {
        loadTopicsWithHierarchy(folderName); // Loads topic list
    }
}

// Function to setup Add Subtopic form submission
function setupAddSubtopicForm() {
    const addSubtopicForm = document.getElementById('addSubtopicForm');
    if (addSubtopicForm) {
        addSubtopicForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const parentTopicPath = document.getElementById('parentTopicInput').value; // This might be a path
            const newSubtopicName = document.getElementById('subtopicName').value;
            if (!newSubtopicName) { alert('Please enter a subtopic name.'); return; }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Adding...'; submitBtn.disabled = true;

            createSubtopic(currentSubject, parentTopicPath, newSubtopicName) // Ensure createSubtopic handles paths
                .then(() => {
                    e.target.reset(); hideAddSubtopicModal();
                    alert('Subtopic added successfully!');
                    loadTopicsWithHierarchy(currentSubject);
                })
                .catch(error => { console.error('Error creating subtopic:', error); alert('Error: ' + error.message); })
                .finally(() => { submitBtn.textContent = originalText; submitBtn.disabled = false; });
        });
    }
}

// Enhanced version of setupInlineAddCardForm with image support
function setupInlineAddCardForm() {
    const inlineAddCardForm = document.getElementById('inlineAddCardForm');
    if (inlineAddCardForm) {
        inlineAddCardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const subject = document.getElementById('cardSubject').value;
            const topic = document.getElementById('cardTopic').value; // This should be the full topic path
            const question = document.getElementById('cardQuestion').value;
            const answer = document.getElementById('cardAnswer').value;
            const imageFile = document.getElementById('cardImageUpload').files[0];

            if (!question || !answer) { alert('Please enter both question and answer.'); return; }

            const submitBtn = inlineAddCardForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...'; submitBtn.disabled = true;

            const cardData = { subject, topic, question, answer, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp() // IMPORTANT for sorting
            };
            const progressContainer = document.querySelector('.upload-progress-container');

            if (imageFile) {
                cardData.imageFile = imageFile;
                if (progressContainer) progressContainer.style.display = 'block';
            }

            addIndexCard(cardData) // Ensure addIndexCard handles imageFile and createdAt
                .then(() => {
                    inlineAddCardForm.reset(); hideAddCardForm(); removeImagePreview();
                    alert('Card added successfully!');
                    loadCards(subject, topic); // Reload cards for the current topic
                })
                .catch(error => { console.error('Error adding card:', error); alert('Error: ' + error.message); })
                .finally(() => {
                    submitBtn.textContent = originalText; submitBtn.disabled = false;
                    if (progressContainer) progressContainer.style.display = 'none';
                });
        });
    }
}

// Function to setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        const cardNavVisible = document.getElementById('cardNavigation').style.display === 'flex';
        if (cardNavVisible && !masteryMode) { // Only if single card nav is visible and not in mastery
            switch(e.key) {
                case 'ArrowLeft':
                    if (!document.getElementById('prevCardBtn').disabled) showPreviousCard();
                    break;
                case 'ArrowRight':
                    if (!document.getElementById('nextCardBtn').disabled) showNextCard();
                    break;
                case ' ':
                    e.preventDefault();
                    const currentCardElement = document.querySelector('.index-card.single-card');
                    if (currentCardElement) {
                         const flipButton = currentCardElement.querySelector('.flip-btn');
                         if (flipButton) flipCard(flipButton);
                    }
                    break;
                // 'e' for edit can be added here if needed, checking checkEditAccess()
            }
        }
    });
}

// Function to setup mastery keyboard shortcuts (remains mostly the same)
function setupMasteryKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (!masteryMode || !currentMasteryCards.length || !currentMasteryCards[currentCardIndex]) return;
        const card = currentMasteryCards[currentCardIndex];
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); markMasteryStatus(card.id, MASTERY_STATUS.MASTERED); break;
            case 'ArrowDown': e.preventDefault(); markMasteryStatus(card.id, MASTERY_STATUS.NEEDS_PRACTICE); break;
        }
    });
}

// Function to setup delete topic dialog (remains the same)
function setupDeleteTopicDialog() {
    window.addEventListener('click', function(event) {
        const dialog = document.getElementById('deleteTopicDialog');
        const overlay = document.getElementById('confirmationOverlay');
        if (event.target === overlay && dialog && dialog.style.display !== 'none') {
            closeDeleteTopicDialog();
        }
    });
}

// Function to setup fullscreen mode (remains mostly the same)
function setupFullscreenMode() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    // const mainFooter = document.getElementById('mainFooter'); // If you have a footer to hide

    if (fullscreenBtn) fullscreenBtn.addEventListener('click', enterFullscreen);
    if (exitFullscreenBtn) exitFullscreenBtn.addEventListener('click', exitFullscreen);

    function handleFullscreenChange() {
        const inFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        isFullscreen = !!inFullscreen;
        if (exitFullscreenBtn) exitFullscreenBtn.style.display = isFullscreen ? 'block' : 'none';
        if (fullscreenBtn) fullscreenBtn.style.display = isFullscreen ? 'none' : 'block';
        // if (mainFooter) mainFooter.style.display = isFullscreen ? 'none' : 'block';
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

function enterFullscreen() {
    const cardsSection = document.getElementById('cardsSection');
    if (cardsSection) {
        if (cardsSection.requestFullscreen) cardsSection.requestFullscreen();
        else if (cardsSection.webkitRequestFullscreen) cardsSection.webkitRequestFullscreen();
        else if (cardsSection.msRequestFullscreen) cardsSection.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
}


// Function to setup view cards button (remains mostly the same)
function setupViewCardsButton() {
    const viewCardsBtn = document.getElementById('viewCardsBtn');
    if (viewCardsBtn) {
        viewCardsBtn.style.display = 'none'; // Initially hide
        if (cardIndex !== null && topicName && folderName) { // Only show in single card view
            viewCardsBtn.style.display = 'flex';
            viewCardsBtn.href = `card-viewer.html?folder=${encodeURIComponent(folderName)}&topic=${encodeURIComponent(topicName)}`;
        }
    }
}

// Function to setup touch swipe for card navigation (remains mostly the same)
function setupTouchSwipe() {
    const cardContainer = document.getElementById('cardContainer');
    if (!cardContainer) return;
    let touchStartX = 0;
    cardContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    cardContainer.addEventListener('touchend', e => {
        if (masteryMode) return;
        const touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        if (document.getElementById('cardNavigation').style.display !== 'flex') return;

        if (touchEndX < touchStartX - swipeThreshold && !document.getElementById('nextCardBtn').disabled) showNextCard();
        if (touchEndX > touchStartX + swipeThreshold && !document.getElementById('prevCardBtn').disabled) showPreviousCard();
    }, { passive: true });
}

// Function to setup mastery swipe gestures (remains mostly the same)
function setupMasterySwipeGestures() {
    const cardContainer = document.getElementById('cardContainer');
    if (!cardContainer) return;
    let touchStartY = 0;
    cardContainer.addEventListener('touchstart', e => { touchStartY = e.changedTouches[0].screenY; }, { passive: true });
    cardContainer.addEventListener('touchend', e => {
        if (!masteryMode || !currentMasteryCards[currentCardIndex]) return;
        const touchEndY = e.changedTouches[0].screenY;
        const swipeThreshold = 50;
        const cardId = currentMasteryCards[currentCardIndex].id;
        if (touchEndY < touchStartY - swipeThreshold) markMasteryStatus(cardId, MASTERY_STATUS.MASTERED);
        if (touchEndY > touchStartY + swipeThreshold) markMasteryStatus(cardId, MASTERY_STATUS.NEEDS_PRACTICE);
    }, { passive: true });
}

// Mastery mode functions (toggleMasteryMode, startMasterySession, showMasteryCard, etc.)
// remain largely the same. Ensure fetchCardsByTopic is robust.

function toggleMasteryMode() {
    masteryMode = !masteryMode;
    const masteryModeBtn = document.getElementById('masteryModeBtn');
    const masteryControls = document.getElementById('masteryControls');
    const shuffleBtn = document.getElementById('shuffleBtn'); // Hide shuffle in mastery
    const sortControls = document.querySelector('.sort-controls'); // Hide sort in mastery

    if (masteryMode) {
        masteryModeBtn.classList.add('active');
        masteryModeBtn.innerHTML = '<i class="fas fa-brain"></i> Exit Mastery';
        if (masteryControls) masteryControls.style.display = 'flex';
        if (shuffleBtn) shuffleBtn.style.display = 'none';
        if (sortControls) sortControls.style.display = 'none';
        startMasterySession();
    } else {
        masteryModeBtn.classList.remove('active');
        masteryModeBtn.innerHTML = '<i class="fas fa-brain"></i> Mastery Mode';
        if (masteryControls) masteryControls.style.display = 'none';
        if (shuffleBtn && topicName) shuffleBtn.style.display = 'flex'; // Show if in topic
        if (sortControls && topicName) sortControls.style.display = 'flex'; // Show if in topic

        if (cardIndex !== null && currentTopic) {
            loadSingleCard(currentSubject, currentTopic, currentCardIndex);
        } else if (currentTopic) {
            loadCards(currentSubject, currentTopic);
        } else {
            loadTopicsWithHierarchy(currentSubject);
        }
    }
}

function startMasterySession() {
    if (!currentSubject || !currentTopic) {
        alert("Please select a topic first.");
        toggleMasteryMode(); return;
    }
    fetchCardsByTopic(currentSubject, currentTopic)
        .then(cards => {
            if (cards.length === 0) {
                alert('No cards for mastery.'); toggleMasteryMode(); return;
            }
            const masteryData = getMasteryData();
            currentMasteryCards = cards.map(card => ({
                ...card,
                masteryStatus: masteryData[card.id] || MASTERY_STATUS.UNKNOWN
            })).sort((a, b) => a.masteryStatus - b.masteryStatus);
            
            updateMasteryStats();
            currentCardIndex = 0;
            window.currentCardIndex = currentCardIndex;
            showMasteryCard();
        })
        .catch(error => { console.error('Mastery session error:', error); alert('Error starting mastery.'); toggleMasteryMode(); });
}

function showMasteryCard() {
    const cardContainer = document.getElementById('cardContainer');
    const cardNav = document.getElementById('cardNavigation'); // Hide normal nav
    if (cardNav) cardNav.style.display = 'none';

    if (!cardContainer || currentMasteryCards.length === 0 || !currentMasteryCards[currentCardIndex]) {
        cardContainer.innerHTML = '<div class="no-cards-message">No mastery cards.</div>';
        return;
    }
    const card = currentMasteryCards[currentCardIndex];
    let statusClass = '', statusLabel = '';
    switch (card.masteryStatus) {
        case MASTERY_STATUS.MASTERED: statusClass = 'mastered'; statusLabel = 'Mastered'; break;
        case MASTERY_STATUS.NEEDS_PRACTICE: statusClass = 'needs-practice'; statusLabel = 'Needs Practice'; break;
        default: statusClass = 'unknown'; statusLabel = 'Not Reviewed';
    }
    const imageHtml = card.imageUrl ? `<div class="card-image"><img src="${card.imageUrl}" alt="Image" class="card-image-content" onerror="this.style.display='none'"></div>` : '';
    cardContainer.innerHTML = `
        <div class="index-card single-card mastery-card ${statusClass}" data-id="${card.id}">
            <div class="mastery-status-indicator"><span>${statusLabel}</span></div>
            <div class="card-content" onclick="flipCardContent(this.parentElement)">
                <div class="card-front"><h3>${escapeHtml(card.question)}</h3>${imageHtml}</div>
                <div class="card-back" style="display: none;"><p>${escapeHtml(card.answer)}</p></div>
            </div>
            <div class="card-tools mastery-card-tools">
                <button class="flip-btn" onclick="flipCard(this.closest('.index-card').querySelector('.flip-btn')); event.stopPropagation();"><i class="fas fa-sync-alt"></i></button>
                <button class="mastery-btn needs-practice-btn" onclick="markMasteryStatus('${card.id}', ${MASTERY_STATUS.NEEDS_PRACTICE}); event.stopPropagation();"><i class="fas fa-arrow-down"></i> Needs Practice</button>
                <button class="mastery-btn mastered-btn" onclick="markMasteryStatus('${card.id}', ${MASTERY_STATUS.MASTERED}); event.stopPropagation();"><i class="fas fa-arrow-up"></i> Mastered</button>
            </div>
        </div>`;
    updateMasteryCounter(); // Ensure this exists and works for mastery
}

function updateMasteryCounter() {
    const masteryCounterDisplay = document.getElementById('masteryCounterDisplay'); // Assuming a new element for mastery
    if (masteryCounterDisplay) {
        masteryCounterDisplay.textContent = `Card ${currentCardIndex + 1} of ${currentMasteryCards.length}`;
    }
    // Also update the main mastery stats display
    const masteredCountEl = document.getElementById('masteredCount');
    const needsPracticeCountEl = document.getElementById('needsPracticeCount');
    const unknownCountEl = document.getElementById('unknownCount');
    if (masteredCountEl) masteredCountEl.textContent = masteryStats.mastered;
    if (needsPracticeCountEl) needsPracticeCountEl.textContent = masteryStats.needsPractice;
    if (unknownCountEl) unknownCountEl.textContent = masteryStats.unknown;
    updateMasteryProgressBar();
}


function markMasteryStatus(cardId, status) {
    const cardIdx = currentMasteryCards.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    currentMasteryCards[cardIdx].masteryStatus = status;
    const masteryData = getMasteryData();
    masteryData[cardId] = status;
    saveMasteryData(masteryData);
    updateMasteryStats(); // This will recount and update display

    if (currentCardIndex < currentMasteryCards.length - 1) {
        currentCardIndex++;
    } else { // End of list, re-sort and find next unmastered or show complete
        currentMasteryCards.sort((a, b) => a.masteryStatus - b.masteryStatus);
        const nextUnmasteredIdx = currentMasteryCards.findIndex(c => c.masteryStatus !== MASTERY_STATUS.MASTERED);
        currentCardIndex = nextUnmasteredIdx !== -1 ? nextUnmasteredIdx : 0;
        if (nextUnmasteredIdx === -1) showMasteryCompleteMessage();
    }
    window.currentCardIndex = currentCardIndex;
    showMasteryCard();
}


function showMasteryCompleteMessage() { /* ... remains same ... */ }
function updateMasteryStats() { /* ... remains same, ensure it calls updateMasteryCounter ... */
    masteryStats = { mastered: 0, needsPractice: 0, unknown: 0 };
    currentMasteryCards.forEach(card => {
        if (card.masteryStatus === MASTERY_STATUS.MASTERED) masteryStats.mastered++;
        else if (card.masteryStatus === MASTERY_STATUS.NEEDS_PRACTICE) masteryStats.needsPractice++;
        else masteryStats.unknown++;
    });
    updateMasteryCounter(); // This will update the UI elements for counts and progress bar
}
function updateMasteryProgressBar() { /* ... remains same ... */ }
function getMasteryData() { /* ... remains same ... */ }
function saveMasteryData(data) { /* ... remains same ... */ }
function resetMasteryData() { /* ... remains same, ensure it calls updateMasteryStats and showMasteryCard ... */ }


// Function to handle showing add card form
function showAddCardForm() {
    if (!checkEditAccess()) { showEditPasswordModal(); return; }
    document.getElementById('cardSubject').value = currentSubject;
    document.getElementById('cardTopic').value = currentTopic; // Ensure currentTopic is the full path
    removeImagePreview(); // Clear previous preview
    document.getElementById('inlineAddCardSection').style.display = 'block';
    document.getElementById('cardQuestion').focus();
}

function hideAddCardForm() {
    document.getElementById('inlineAddCardSection').style.display = 'none';
    document.getElementById('inlineAddCardForm').reset();
    removeImagePreview();
}

// Function to setup card navigation (for single card view)
function setupCardNavigation() {
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    const cardNavElement = document.getElementById('cardNavigation');

    if (cardNavElement) cardNavElement.style.display = 'flex'; // Show it

    if (prevCardBtn) prevCardBtn.addEventListener('click', showPreviousCard);
    if (nextCardBtn) nextCardBtn.addEventListener('click', showNextCard);

    // Initial update of buttons and counter
    updateNavigationButtons();
    updateCardCounter(); // The internal one for single card view
}

function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        window.currentCardIndex = currentCardIndex;
        updateCardView(); // Uses allCards[currentCardIndex]
        updateCardCounter();
        updateNavigationButtons();
        updateUrlForSingleCard();
    }
}

function showNextCard() {
    if (currentCardIndex < allCards.length - 1) {
        currentCardIndex++;
        window.currentCardIndex = currentCardIndex;
        updateCardView();
        updateCardCounter();
        updateNavigationButtons();
        updateUrlForSingleCard();
    }
}

function updateUrlForSingleCard() {
    const newUrl = `card-viewer.html?folder=${encodeURIComponent(currentSubject)}&topic=${encodeURIComponent(currentTopic)}&card=${currentCardIndex}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}


function updateNavigationButtons() {
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    if (prevCardBtn) prevCardBtn.disabled = (currentCardIndex === 0 || allCards.length === 0);
    if (nextCardBtn) nextCardBtn.disabled = (currentCardIndex >= allCards.length - 1 || allCards.length === 0);
}

// Internal function to update card counter for single card view
function updateCardCounter() {
    const cardCounterElement = document.getElementById('cardCounter');
    if (cardCounterElement) {
        if (allCards.length > 0) {
            cardCounterElement.textContent = `Card ${currentCardIndex + 1} of ${allCards.length}`;
        } else {
            cardCounterElement.textContent = ''; // Or "No cards"
        }
    }
}


function updateCardView() { // For single card view
    const cardContainer = document.getElementById('cardContainer');
    if (!cardContainer || allCards.length === 0 || currentCardIndex < 0 || currentCardIndex >= allCards.length) {
        if (cardContainer) cardContainer.innerHTML = '<div class="no-cards-message">Card not found.</div>';
        return;
    }
    const card = allCards[currentCardIndex];
    const imageHtml = card.imageUrl ? `<div class="card-image"><img src="${card.imageUrl}" alt="Image" class="card-image-content" onerror="this.style.display='none'"></div>` : '';
    cardContainer.innerHTML = `
        <div class="index-card single-card" data-id="${card.id}">
            <div class="card-content" onclick="flipCardContent(this.parentElement)">
                <div class="card-front"><h3>${escapeHtml(card.question)}</h3>${imageHtml}</div>
                <div class="card-back" style="display: none;"><p>${escapeHtml(card.answer)}</p></div>
            </div>
            <div class="card-tools">
                <button class="flip-btn" onclick="flipCard(this); event.stopPropagation();">Show Answer</button>
                <button class="edit-button edit-control disabled" onclick="showInlineEditForm('${card.id}'); event.stopPropagation();" disabled>Edit</button>
                <button class="delete-btn edit-control disabled" onclick="deleteCard('${card.id}'); event.stopPropagation();" disabled><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>`;
    if (checkEditAccess()) enableEditControls();
    // Auto-flip logic can remain if desired
}


function flipCardContent(cardElement) { // cardElement is the .index-card
    if (!cardElement) return;
    const cardFront = cardElement.querySelector('.card-front');
    const cardBack = cardElement.querySelector('.card-back');
    const flipBtn = cardElement.querySelector('.flip-btn'); // The button inside .card-tools

    if (cardFront && cardBack && flipBtn) {
        const isBackVisible = cardBack.style.display !== 'none';
        cardFront.style.display = isBackVisible ? 'block' : 'none';
        cardBack.style.display = isBackVisible ? 'none' : 'block';
        flipBtn.innerHTML = isBackVisible ? 'Show Answer' : '<i class="fas fa-sync-alt fa-rotate-180"></i> Show Question';
        // Update icon if present
        const icon = flipBtn.querySelector('i');
        if (icon) {
            if (isBackVisible) icon.classList.remove('fa-rotate-180');
            else icon.classList.add('fa-rotate-180');
        }
    }
}
// Global flipCard function for buttons
function flipCard(buttonElement) {
    const cardElement = buttonElement.closest('.index-card');
    if (cardElement) {
        flipCardContent(cardElement);
    }
}


function shuffleCards() {
    if (allCards.length <= 1) return;
    for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }
    // Update window.loadedCards as well, as `allCards` is now the shuffled list
    window.loadedCards = [...allCards];
    // window.originalLoadedCards remains the initial fetch order for "default" sort

    currentCardIndex = 0;
    window.currentCardIndex = currentCardIndex;

    if (document.getElementById('cardNavigation').style.display === 'flex') { // Single card view
        updateCardView();
        updateCardCounter();
        updateNavigationButtons();
    } else { // Grid view
        displayCardsInContainer(allCards, currentSubject, currentTopic);
    }
    alert("Cards have been shuffled!");
}


function loadSingleCard(subject, topic, index) {
    const cardContainer = document.getElementById('cardContainer');
    const topicsContainer = document.getElementById('topicsContainer');
    const cardNav = document.getElementById('cardNavigation');

    if (topicsContainer) topicsContainer.style.display = 'none';
    if (cardContainer) cardContainer.style.display = 'block';
    if (cardNav) cardNav.style.display = 'flex'; // Show navigation for single card

    if (cardContainer) cardContainer.innerHTML = '<div class="loading-message">Loading card...</div>';

    currentSubject = subject; currentTopic = topic; currentCardIndex = index || 0;
    window.currentSubject = currentSubject; window.currentTopicName = currentTopic; window.currentCardIndex = currentCardIndex;

    fetchCardsByTopic(subject, topic)
        .then(cards => {
            console.log("Fetched cards (single view):", cards.length, cards);
            allCards = cards; // Primary internal array for navigation
            window.loadedCards = [...cards]; // For sorter
            window.originalLoadedCards = [...cards]; // For sorter's default

            if (cards.length === 0) {
                if (cardContainer) cardContainer.innerHTML = `<div class="no-cards-message"><h3>No cards in this topic</h3></div>`;
                updateNavigationButtons(); updateCardCounter(); // Update to show 0 of 0 or similar
                return;
            }
            if (currentCardIndex < 0 || currentCardIndex >= cards.length) currentCardIndex = 0;
            window.currentCardIndex = currentCardIndex;

            updateCardView();
            updateCardCounter();
            updateNavigationButtons();

            const shuffleBtn = document.getElementById('shuffleBtn');
            if (shuffleBtn) shuffleBtn.style.display = cards.length > 1 ? 'flex' : 'none';
        })
        .catch(error => {
            console.error('Error loading single card:', error);
            if (cardContainer) cardContainer.innerHTML = `<div class="error-message"><h3>Error loading card</h3><p>${error.message}</p></div>`;
        });
}

function loadCards(subject, topic) { // For grid view
    const topicsContainer = document.getElementById('topicsContainer');
    const cardContainer = document.getElementById('cardContainer');
    const cardNav = document.getElementById('cardNavigation');

    if (topicsContainer) topicsContainer.style.display = 'none';
    if (cardNav) cardNav.style.display = 'none'; // Hide single card nav
    if (cardContainer) {
        cardContainer.style.display = 'grid'; // Ensure it's grid for multiple cards
        cardContainer.innerHTML = '<div class="loading-message">Loading cards...</div>';
    }

    currentSubject = subject; currentTopic = topic;
    window.currentSubject = currentSubject; window.currentTopicName = currentTopic;

    fetchCardsByTopic(subject, topic)
        .then(cards => {
            console.log("Fetched cards (grid view):", cards.length, cards);
            // `allCards` will be set by displayCardsInContainer
            window.loadedCards = [...cards]; // For sorter
            window.originalLoadedCards = [...cards]; // For sorter's default

            displayCardsInContainer(cards, subject, topic); // This will set allCards

            const shuffleBtn = document.getElementById('shuffleBtn');
            if (shuffleBtn) shuffleBtn.style.display = cards.length > 1 ? 'flex' : 'none';
            
            // Show sort controls if cards are present
            const sortControls = document.querySelector('.sort-controls');
            if (sortControls) {
                sortControls.style.display = cards.length > 0 ? 'flex' : 'none';
            }

        })
        .catch(error => {
            console.error('Error loading cards for grid:', error);
            if (cardContainer) cardContainer.innerHTML = `<div class="error-message"><h3>Error loading cards</h3><p>${error.message}</p></div>`;
        });
}


function removeImagePreview() {
    const imagePreviewContainer = document.getElementById('imagePreview'); // Ensure this ID matches HTML
    const imageUploadInput = document.getElementById('cardImageUpload');
    if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
    if (imageUploadInput) imageUploadInput.value = ''; // Reset file input
}

// Utility to escape HTML (if not already available)
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Ensure other functions like loadTopicsWithHierarchy, fetchCardsByTopic, createSubtopic, 
// addIndexCard, checkEditAccess, enableEditControls, etc. are defined elsewhere in your script or in indexcards.js
// and that fetchCardsByTopic returns cards with an `id` and `createdAt` (Firebase Timestamp).