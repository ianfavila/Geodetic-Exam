// admin-sequences.js
// Advanced sequence management functionality for the Geodetic Engineering Reviewer

// Global cache of sequence data
let sequenceGroups = {};

// Initialize sequence functionality
function initSequenceManager() {
    console.log("Initializing sequence manager...");
    
    // Add sequence management tab if it doesn't exist
    const tabNav = document.querySelector('.tab-nav');
    if (tabNav && !document.querySelector('[data-tab="sequences"]')) {
        const sequenceTab = document.createElement('div');
        sequenceTab.className = 'tab-item';
        sequenceTab.setAttribute('data-tab', 'sequences');
        sequenceTab.textContent = 'Sequence Management';
        tabNav.appendChild(sequenceTab);
        
        // Add the content tab
        const tabContents = document.querySelector('.tab-content').parentNode;
        const sequencesTab = document.createElement('div');
        sequencesTab.className = 'tab-content';
        sequencesTab.id = 'sequences-tab';
        sequencesTab.innerHTML = `
            <div class="sequence-manager">
                <h3><i class="fas fa-link"></i> Question Sequences</h3>
                <p>Manage sequences of related questions that should be presented together in a specific order.</p>
                
                <div class="sequence-groups" id="sequence-groups-container">
                    <p><i class="fas fa-spinner fa-spin"></i> Loading sequence groups...</p>
                </div>
            </div>
        `;
        tabContents.appendChild(sequencesTab);
        
        // Update tab click handlers
        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                
                // Update active tab
                tabItems.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update active content
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                // If sequences tab is selected, refresh sequence data
                if (tabName === 'sequences') {
                    loadSequenceGroups();
                }
            });
        });
    }
}

// Load all sequence groups from Firestore
async function loadSequenceGroups() {
    console.log("Loading sequence groups...");
    const container = document.getElementById('sequence-groups-container');
    
    if (!container) {
        console.error("Sequence groups container not found");
        return;
    }
    
    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading sequence groups...</p>';
    
    try {
        // Get all questions with isSequenced == true
        const query = questionsCollection.where('isSequenced', '==', true);
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p>No sequence groups found. Create sequences by checking "This question is part of a sequence" when creating or editing questions.</p>';
            return;
        }
        
        // Group questions by sequenceGroup
        sequenceGroups = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            if (data.sequenceGroup) {
                if (!sequenceGroups[data.sequenceGroup]) {
                    sequenceGroups[data.sequenceGroup] = [];
                }
                
                sequenceGroups[data.sequenceGroup].push({
                    id,
                    question: data.question,
                    subject: data.subject,
                    topic: data.topic,
                    sequenceOrder: data.sequenceOrder || 0
                });
            }
        });
        
        // Sort each group by sequenceOrder
        Object.keys(sequenceGroups).forEach(groupId => {
            sequenceGroups[groupId].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        });
        
        console.log("Sequence groups loaded:", sequenceGroups);
        
        // Build the UI
        const groupsHtml = Object.keys(sequenceGroups).map(groupId => {
            const group = sequenceGroups[groupId];
            const questionsHtml = group.map((question, index) => {
                return `
                    <div class="sequence-group-question" data-id="${question.id}" data-order="${question.sequenceOrder}">
                        <div class="sequence-question-order">#${question.sequenceOrder}</div>
                        <div class="sequence-question-text">${question.question.substring(0, 100)}${question.question.length > 100 ? '...' : ''}</div>
                        <div class="sequence-question-actions">
                            <button class="view-sequence-question" title="View Question"><i class="fas fa-eye"></i></button>
                            <button class="edit-sequence-question" title="Edit Question"><i class="fas fa-edit"></i></button>
                            <button class="move-up-sequence-question" title="Move Up" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                            <button class="move-down-sequence-question" title="Move Down" ${index === group.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                            <button class="remove-from-sequence" title="Remove from Sequence"><i class="fas fa-unlink"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="sequence-group-item" data-group-id="${groupId}">
                    <div class="sequence-group-header">
                        <div class="sequence-group-title">Sequence: ${groupId}</div>
                        <div class="sequence-group-count">${group.length} Questions</div>
                    </div>
                    <div class="sequence-group-questions">
                        ${questionsHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = groupsHtml || '<p>No sequence groups found.</p>';
        
        // Add event listeners to the sequence actions
        attachSequenceActionListeners();
        
    } catch (error) {
        console.error("Error loading sequence groups:", error);
        container.innerHTML = `<p class="error">Error loading sequence groups: ${error.message}</p>`;
    }
}

// Attach event listeners to sequence action buttons
function attachSequenceActionListeners() {
    // View question button
    document.querySelectorAll('.view-sequence-question').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const questionId = e.target.closest('.sequence-group-question').getAttribute('data-id');
            viewQuestion(questionId);
        });
    });
    
    // Edit question button
    document.querySelectorAll('.edit-sequence-question').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const questionId = e.target.closest('.sequence-group-question').getAttribute('data-id');
            editQuestion(questionId);
        });
    });
    
    // Move up button
    document.querySelectorAll('.move-up-sequence-question').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btn.disabled) return;
            
            const questionItem = e.target.closest('.sequence-group-question');
            const questionId = questionItem.getAttribute('data-id');
            const groupId = questionItem.closest('.sequence-group-item').getAttribute('data-group-id');
            const currentOrder = parseInt(questionItem.getAttribute('data-order'));
            
            await moveSequenceQuestion(questionId, groupId, currentOrder, 'up');
        });
    });
    
    // Move down button
    document.querySelectorAll('.move-down-sequence-question').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btn.disabled) return;
            
            const questionItem = e.target.closest('.sequence-group-question');
            const questionId = questionItem.getAttribute('data-id');
            const groupId = questionItem.closest('.sequence-group-item').getAttribute('data-group-id');
            const currentOrder = parseInt(questionItem.getAttribute('data-order'));
            
            await moveSequenceQuestion(questionId, groupId, currentOrder, 'down');
        });
    });
    
    // Remove from sequence button
    document.querySelectorAll('.remove-from-sequence').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const questionItem = e.target.closest('.sequence-group-question');
            const questionId = questionItem.getAttribute('data-id');
            
            if (confirm('Are you sure you want to remove this question from the sequence? This will break the sequence flow.')) {
                await removeFromSequence(questionId);
            }
        });
    });
}

// Move a question up or down in the sequence
async function moveSequenceQuestion(questionId, groupId, currentOrder, direction) {
    console.log(`Moving question ${questionId} ${direction} in sequence ${groupId}`);
    
    try {
        const group = sequenceGroups[groupId];
        if (!group) {
            console.error(`Sequence group ${groupId} not found`);
            return;
        }
        
        // Find the question objects (current and target)
        const currentIndex = group.findIndex(q => q.id === questionId);
        if (currentIndex === -1) {
            console.error(`Question ${questionId} not found in sequence ${groupId}`);
            return;
        }
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= group.length) {
            console.error(`Cannot move ${direction}: target index ${targetIndex} is out of bounds`);
            return;
        }
        
        const currentQuestion = group[currentIndex];
        const targetQuestion = group[targetIndex];
        
        // Swap the sequence orders
        const temp = currentQuestion.sequenceOrder;
        currentQuestion.sequenceOrder = targetQuestion.sequenceOrder;
        targetQuestion.sequenceOrder = temp;
        
        // Update in Firestore (both questions)
        await questionsCollection.doc(currentQuestion.id).update({
            sequenceOrder: currentQuestion.sequenceOrder
        });
        
        await questionsCollection.doc(targetQuestion.id).update({
            sequenceOrder: targetQuestion.sequenceOrder
        });
        
        console.log(`Questions reordered successfully`);
        
        // Refresh the sequence display
        loadSequenceGroups();
        
    } catch (error) {
        console.error(`Error moving sequence question:`, error);
        alert(`Error moving question: ${error.message}`);
    }
}

// Remove a question from a sequence
async function removeFromSequence(questionId) {
    console.log(`Removing question ${questionId} from its sequence`);
    
    try {
        // Update the question in Firestore
        await questionsCollection.doc(questionId).update({
            isSequenced: false,
            sequenceGroup: "",
            sequenceOrder: null
        });
        
        console.log(`Question removed from sequence`);
        
        // Refresh the sequence display
        loadSequenceGroups();
        
    } catch (error) {
        console.error(`Error removing question from sequence:`, error);
        alert(`Error removing question from sequence: ${error.message}`);
    }
}

// Event listener function to add to DOMContentLoaded
function setupSequenceListeners() {
    // Initialize the sequence manager
    initSequenceManager();
    
    // Additional initialization can be added here
    console.log("Sequence manager initialized");
}

// Add to the DOMContentLoaded in main script
document.addEventListener('DOMContentLoaded', setupSequenceListeners);