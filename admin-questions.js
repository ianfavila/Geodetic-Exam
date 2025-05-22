// admin-questions.js
// Question management functionality for the Geodetic Engineering Reviewer Admin Panel

function updateTopicsBySubject() {
    const questionSubject = document.getElementById('question-subject');
    const questionTopic = document.getElementById('question-topic');
    
    if (!questionSubject || !questionTopic) { 
        console.error("Subject/Topic dropdown not found (updateTopicsBySubject)"); 
        return; 
    }
    
    const selectedSubject = questionSubject.value;
    questionTopic.innerHTML = ''; // Clear
    
    if (!selectedSubject) {
        questionTopic.innerHTML = '<option value="">Select Subject First</option>'; 
        questionTopic.disabled = true; 
        return;
    }
    
    questionTopic.disabled = false;
    questionTopic.innerHTML = '<option value="">Select Topic</option>';
    const topics = topicsBySubject[selectedSubject] || [];
    
    topics.forEach(topic => { 
        const opt = document.createElement('option'); 
        opt.value = topic; 
        opt.textContent = topic; 
        questionTopic.appendChild(opt); 
    });
}

function updateFilterTopics() {
    const subjectFilter = document.getElementById('subject-filter');
    const topicFilter = document.getElementById('topic-filter');
    
    if (!subjectFilter || !topicFilter) { 
        console.error("Subject/Topic filter dropdown not found (updateFilterTopics)"); 
        return; 
    }
    
    const selectedSubject = subjectFilter.value;
    topicFilter.innerHTML = '<option value="">All Topics</option>'; // Reset
    
    if (!selectedSubject) return;
    
    const topics = topicsBySubject[selectedSubject] || [];
    topics.forEach(topic => { 
        const opt = document.createElement('option'); 
        opt.value = topic; 
        opt.textContent = topic; 
        topicFilter.appendChild(opt); 
    });
}

function openAddQuestionModal() {
    console.log("Add Question button clicked - function started.");
    
    try {
        const title = document.getElementById('modal-title');
        const qId = document.getElementById('question-id');
        const form = document.getElementById('question-form');
        const topicSelect = document.getElementById('question-topic');
        const imgPreview = document.getElementById('image-preview');
        const imgFileName = document.getElementById('image-file-name');
        const questionModal = document.getElementById('question-modal');
        const isSequencedCheckbox = document.getElementById('is-sequenced');
        const sequenceDetailsDiv = document.getElementById('sequence-details');
        const sequenceGroupInput = document.getElementById('sequence-group');
        const sequenceOrderInput = document.getElementById('sequence-order');

        // Check if elements exist before using them
        if (!title || !qId || !form || !topicSelect || !imgPreview || !imgFileName || !questionModal) {
            console.error("One or more modal elements not found!");
            alert("Error: Could not open the Add Question form correctly. Check console.");
            return;
        }

        title.textContent = 'Add New Question';
        qId.value = '';
        form.reset(); // Reset all form fields
        topicSelect.disabled = true;
        topicSelect.innerHTML = '<option value="">Select Subject First</option>';
        imgPreview.style.display = 'none'; 
        imgPreview.src = '';
        imgFileName.textContent = 'No image selected';
        
        // Reset sequence fields
        if (isSequencedCheckbox && sequenceDetailsDiv) {
            isSequencedCheckbox.checked = false;
            sequenceDetailsDiv.style.display = 'none';
        }
        if (sequenceGroupInput) sequenceGroupInput.value = '';
        if (sequenceOrderInput) sequenceOrderInput.value = '';
        
        questionModal.classList.add('active'); // Display the modal
        
        console.log("Modal opened successfully");
    } catch (e) {
        console.error("Error opening add question modal:", e);
        alert("An unexpected error occurred while opening the form.");
    }
}

function closeQuestionModal() {
    console.log("Closing Question Modal");
    const questionModal = document.getElementById('question-modal');
    
    if(questionModal) {
        questionModal.classList.remove('active');
    } else {
        console.error("Question modal overlay not found when trying to close.");
    }
}

function previewImage(input, previewElementId, fileNameElementId) {
    const imagePreview = document.getElementById(previewElementId || 'image-preview');
    const imageFileName = document.getElementById(fileNameElementId || 'image-file-name');
    
    if (!imagePreview || !imageFileName) { 
        console.error("Image preview elements not found"); 
        return; 
    }

    if (input && input.files && input.files[0]) {
        const file = input.files[0];
        imageFileName.textContent = file.name;
        const reader = new FileReader();
        
        reader.onload = (e) => { 
            imagePreview.src = e.target.result; 
            imagePreview.style.display = 'block'; 
        };
        
        reader.onerror = () => { 
            console.error("Error reading image file."); 
            alert("Error previewing image.");
        };
        
        reader.readAsDataURL(file);
    } else {
        imageFileName.textContent = 'No image selected';
        imagePreview.style.display = 'none'; 
        imagePreview.src = '';
    }
}

async function saveQuestionToFirebase() {
    console.log("Save Question button clicked - function started.");
    const saveButton = document.getElementById('save-question-btn');
    let originalText = 'Save Question';
    
    if (saveButton) { 
        originalText = saveButton.innerHTML; 
    } else { 
        console.error("Save button missing!"); 
        return; 
    }

    try {
        console.log("Getting form values for save...");
        const questionId = document.getElementById('question-id')?.value;
        const subject = document.getElementById('question-subject')?.value;
        const topic = document.getElementById('question-topic')?.value;
        const questionText = document.getElementById('question-text')?.value;
        const optionA = document.getElementById('option-a')?.value;
        const optionB = document.getElementById('option-b')?.value;
        const optionC = document.getElementById('option-c')?.value;
        const optionD = document.getElementById('option-d')?.value;
        const correctOptionRadio = document.querySelector('input[name="correct-option"]:checked');
        const explanation = document.getElementById('question-explanation')?.value;
        const imageInput = document.getElementById('question-image-input');
        // --- Sequencing fields ---
        const isSequenced = document.getElementById('is-sequenced')?.checked;
        const sequenceGroup = document.getElementById('sequence-group')?.value;
        const sequenceOrder = document.getElementById('sequence-order')?.value;

        if (!subject || !topic || !questionText || !optionA || !optionB || !optionC || !optionD || !correctOptionRadio) {
            alert('Please fill in all required fields (Subject, Topic, Question, all Options) and select the correct answer.');
            console.warn("Save validation failed."); 
            return;
        }
        
        // Validate sequence data if checked
        if (isSequenced && (!sequenceGroup || !sequenceOrder)) {
            alert('If this question is part of a sequence, you must provide both a Sequence Group ID and Display Order.');
            console.warn("Sequence data validation failed.");
            return;
        }
        
        const correctOption = parseInt(correctOptionRadio.value);
        console.log("Validation passed. Data ready.");

        // Prepare options array
        const optionsArray = [optionA, optionB, optionC, optionD];

        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        const questionData = { 
            subject, 
            topic, 
            question: questionText, 
            options: optionsArray, 
            originalOptions: optionsArray, // Store the unshuffled original options
            correctAnswer: correctOption, 
            explanation: explanation || '', 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        };

        // --- Add sequencing fields if applicable ---
        if (isSequenced) {
            questionData.isSequenced = true;
            questionData.sequenceGroup = sequenceGroup || "";
            questionData.sequenceOrder = parseInt(sequenceOrder) || 1;
        } else {
            questionData.isSequenced = false;
            questionData.sequenceGroup = "";
            questionData.sequenceOrder = null;
        }

        console.log("Sequence data being saved:", isSequenced, sequenceGroup, sequenceOrder);
        console.log("Question data:", questionData);

        console.log("Checking image...");
        let imageUrl = document.getElementById('image-preview')?.src;
        
        if (imageInput && imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`question-images/${Date.now()}_${file.name}`);
            console.log(`Uploading image: ${file.name}...`);
            await fileRef.put(file);
            imageUrl = await fileRef.getDownloadURL();
            questionData.imageUrl = imageUrl;
            console.log('Image uploaded:', imageUrl);
        } else if (questionId && imageUrl && imageUrl.startsWith('https://firebasestorage')) {
            console.log("Keeping existing image.");
            questionData.imageUrl = imageUrl;
        } else {
            console.log("No new or existing image URL.");
            questionData.imageUrl = null;
        }

        if (questionId) {
            console.log(`Updating question ${questionId}...`);
            await questionsCollection.doc(questionId).update(questionData);
            console.log(`Question ${questionId} updated.`);
        } else {
            console.log('Adding new question...');
            const docRef = await questionsCollection.add(questionData);
            console.log(`New question added with ID: ${docRef.id}`);
        }

        // Update the questions table without closing the modal
        loadQuestionsFromFirebase();
        
        // Save current subject and topic for reuse
        const currentSubject = subject;
        const currentTopic = topic;
        
        // Clear form fields except subject and topic
        // We'll keep the modal open for adding another question
        document.getElementById('question-id').value = '';
        document.getElementById('question-text').value = '';
        document.getElementById('option-a').value = '';
        document.getElementById('option-b').value = '';
        document.getElementById('option-c').value = '';
        document.getElementById('option-d').value = '';
        document.getElementById('question-explanation').value = '';
        
        // Reset radio buttons (uncheck all)
        document.querySelectorAll('input[name="correct-option"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Reset image
        if (imageInput) imageInput.value = '';
        const imagePreview = document.getElementById('image-preview');
        const imageFileName = document.getElementById('image-file-name');
        if (imagePreview) {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
        }
        if (imageFileName) imageFileName.textContent = 'No image selected';
        
        // Reset sequence fields if they exist
        const isSequencedCheckbox = document.getElementById('is-sequenced');
        const sequenceDetailsDiv = document.getElementById('sequence-details');
        const sequenceGroupInput = document.getElementById('sequence-group');
        const sequenceOrderInput = document.getElementById('sequence-order');
        
        if (isSequencedCheckbox && sequenceDetailsDiv) {
            isSequencedCheckbox.checked = false;
            sequenceDetailsDiv.style.display = 'none';
        }
        if (sequenceGroupInput) sequenceGroupInput.value = '';
        if (sequenceOrderInput) sequenceOrderInput.value = '';
        
        // Restore subject and topic
        document.getElementById('question-subject').value = currentSubject;
        updateTopicsBySubject(); // Update topic dropdown based on subject
        
        // Wait a bit for the topic dropdown to populate before setting the value
        setTimeout(() => {
            document.getElementById('question-topic').value = currentTopic;
        }, 150);
        
        alert('Question saved successfully! You can add another question.');

    } catch (error) {
        console.error('Error saving question:', error);
        alert(`Error saving question: ${error.message}\nCheck console (F12) for details.`);
    } finally {
        console.log("saveQuestion finally block.");
        if(saveButton) { 
            saveButton.innerHTML = originalText; 
            saveButton.disabled = false; 
        }
    }
}

async function loadQuestionsFromFirebase() {
    console.log("Loading questions from Firebase...");
    const tbody = document.getElementById('question-tbody');
    const totalCountElement = document.getElementById('total-question-count');
    
    if (!tbody) { 
        console.error("Cannot find table body #question-tbody"); 
        return; 
    }
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading questions...</td></tr>';

    try {
        const subjectFilter = document.getElementById('subject-filter')?.value;
        const topicFilter = document.getElementById('topic-filter')?.value;
        const searchInput = document.getElementById('search-input')?.value.toLowerCase().trim() || "";
        console.log(`Filters - Subject: ${subjectFilter || 'All'}, Topic: ${topicFilter || 'All'}, Search: '${searchInput}'`);

        let query = questionsCollection;
        
        if (subjectFilter) { 
            query = query.where('subject', '==', subjectFilter); 
        }
        if (topicFilter) { 
            query = query.where('topic', '==', topicFilter); 
        }
        
        query = query.orderBy('timestamp', 'desc'); // Assumes index exists

        const snapshot = await query.get();
        console.log(`Query returned ${snapshot.size} documents before local search.`);

        // Get total count for display (regardless of filters)
        let totalCount = 0;
        if (!subjectFilter && !topicFilter && !searchInput) {
            totalCount = snapshot.size;
        } else {
            // If filters are applied, get the total count separately
            const totalSnapshot = await questionsCollection.get();
            totalCount = totalSnapshot.size;
        }
        
        // Update the total count display
        if (totalCountElement) {
            totalCountElement.textContent = totalCount;
        } else {
            // If the element doesn't exist yet, create it
            const questionTableHeader = document.querySelector('.question-filters');
            if (questionTableHeader) {
                const totalCountDisplay = document.createElement('div');
                totalCountDisplay.id = 'total-question-count-container';
                totalCountDisplay.className = 'total-count-display';
                totalCountDisplay.innerHTML = `Total Questions: <span id="total-question-count">${totalCount}</span>`;
                questionTableHeader.appendChild(totalCountDisplay);
            }
        }

        if (snapshot.empty && !subjectFilter && !topicFilter && !searchInput) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No questions found. Add some questions!</td></tr>'; 
            return;
        } else if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No questions match the current filters.</td></tr>'; 
            return;
        }

        tbody.innerHTML = ''; // Clear loading/previous
        let matchFound = false;
        
        // Group questions by sequence
        const sequenceGroups = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isSequenced && data.sequenceGroup) {
                if (!sequenceGroups[data.sequenceGroup]) {
                    sequenceGroups[data.sequenceGroup] = [];
                }
                sequenceGroups[data.sequenceGroup].push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        // Sort each sequence group by order
        Object.keys(sequenceGroups).forEach(group => {
            sequenceGroups[group].sort((a, b) => {
                return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
            });
        });
        
        console.log("Sequence groups:", sequenceGroups);
        
        // Process all documents with numbering
        let questionNumber = 1;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data) return; // Skip if data is somehow missing

            // Local search filtering
            if (searchInput && !( 
                data.question?.toLowerCase().includes(searchInput) || 
                data.subject?.toLowerCase().includes(searchInput) || 
                data.topic?.toLowerCase().includes(searchInput) 
            )) {
                return; // Skip row if search doesn't match
            }
            
            matchFound = true;

            const tr = document.createElement('tr');
            tr.setAttribute('data-id', doc.id);
            
            // Add a CSS class if this is part of a sequence
            if (data.isSequenced && data.sequenceGroup) {
                tr.classList.add('sequence-question');
                tr.setAttribute('data-sequence-group', data.sequenceGroup);
                tr.setAttribute('data-sequence-order', data.sequenceOrder || 0);
            }
            
            // Format the question text, adding sequence information if applicable
            let questionDisplay = data.question ? 
                (data.question.length > 100 ? data.question.substring(0, 100) + '...' : data.question) : 'N/A';
                
            if (data.isSequenced && data.sequenceGroup) {
                // Find this question's position in the sequence
                const sequenceInfo = sequenceGroups[data.sequenceGroup];
                const totalInSequence = sequenceInfo ? sequenceInfo.length : 0;
                questionDisplay = `<span class="sequence-tag">[SEQUENCE ${data.sequenceOrder || '?'}/${totalInSequence}]</span> ${questionDisplay}`;
            }
            
            tr.innerHTML = `
                <td class="question-number">${questionNumber}</td>
                <td>${doc.id}</td>
                <td>${questionDisplay}</td>
                <td>${data.subject || 'N/A'}</td>
                <td>${data.topic || 'N/A'}</td>
                <td class="action-cell">
                    <div class="table-action view" title="View"><i class="fas fa-eye"></i></div>
                    <div class="table-action edit" title="Edit"><i class="fas fa-edit"></i></div>
                    <div class="table-action delete" title="Delete"><i class="fas fa-trash-alt"></i></div>
                </td>
            `;
            tbody.appendChild(tr);
            questionNumber++;
        });

        if (!matchFound && snapshot.size > 0) { // Filtered locally but no search match
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No questions match the search term.</td></tr>';
        } else if (!matchFound && snapshot.empty) { // Covered above, but for clarity
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No questions match the current filters.</td></tr>';
        }
        
        console.log(`Displayed questions.`);

        // Add styles for sequence items and question count
        const style = document.createElement('style');
        style.textContent = `
            .sequence-question { background-color: #f8f9ff; }
            .sequence-tag { 
                display: inline-block;
                background-color: #6c7ae0;
                color: white;
                padding: 2px 5px;
                border-radius: 3px;
                margin-right: 5px;
                font-size: 0.8em;
            }
            .question-number {
                font-weight: bold;
                text-align: center;
            }
            .total-count-display {
                background-color: #f1f1f1;
                padding: 8px 12px;
                border-radius: 4px;
                margin-top: 10px;
                text-align: right;
                font-weight: bold;
            }
            #total-question-count {
                color: #3498db;
                font-size: 1.1em;
            }
        `;
        document.head.appendChild(style);
        
    } catch (error) { 
        console.error('Error loading questions:', error); 
        if (error.code === 'failed-precondition') {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error: Firestore index required. Please check the console (F12) for a link to create the index. Error: ${error.message}</td></tr>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading questions: ${error.message}</td></tr>`;
        }
    }
}

async function viewQuestion(id) {
    console.log(`Viewing question ${id}`);
    try {
        const doc = await questionsCollection.doc(id).get();
        if (!doc.exists) { 
            alert('Question not found'); 
            return; 
        }
        
        const data = doc.data();
        const optionsString = (data.options || []).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
        const correctAnswerLetter = data.correctAnswer !== undefined ? String.fromCharCode(65 + data.correctAnswer) : 'N/A';
        
        let sequenceInfo = '';
        if (data.isSequenced && data.sequenceGroup) {
            sequenceInfo = `\nSequence Group: ${data.sequenceGroup}\nSequence Order: ${data.sequenceOrder || 'Not specified'}`;
        }
        
        alert(`Subject: ${data.subject}\nTopic: ${data.topic}${sequenceInfo}\n\nQuestion:\n${data.question}\n\nOptions:\n${optionsString}\n\nCorrect Answer: ${correctAnswerLetter}\n\nExplanation:\n${data.explanation || 'N/A'}\n\n${data.imageUrl ? 'Image URL: ' + data.imageUrl : ''}`);
    } catch (error) { 
        console.error('Error viewing question:', error); 
        alert('Error viewing question: ' + error.message); 
    }
}

async function editQuestion(id) {
    console.log(`Editing question ${id}`);
    try {
        const doc = await questionsCollection.doc(id).get();
        if (!doc.exists) { 
            alert('Question not found'); 
            return; 
        }
        
        const data = doc.data();

        document.getElementById('modal-title').textContent = 'Edit Question';
        document.getElementById('question-id').value = id;
        document.getElementById('question-subject').value = data.subject;
        updateTopicsBySubject();
        
        // Delay setting topic slightly to allow dropdown to populate
        setTimeout(() => { 
            document.getElementById('question-topic').value = data.topic; 
        }, 150);

        document.getElementById('question-text').value = data.question || '';
        document.getElementById('option-a').value = data.options?.[0] || '';
        document.getElementById('option-b').value = data.options?.[1] || '';
        document.getElementById('option-c').value = data.options?.[2] || '';
        document.getElementById('option-d').value = data.options?.[3] || '';
        
        const correctRadio = document.querySelector(`input[name="correct-option"][value="${data.correctAnswer}"]`);
        if (correctRadio) correctRadio.checked = true; 
        else console.warn("Could not find correct option radio for", data.correctAnswer);
        
        document.getElementById('question-explanation').value = data.explanation || '';

        // --- Handle sequencing fields when editing ---
        const isSequencedCheckbox = document.getElementById('is-sequenced');
        const sequenceDetailsDiv = document.getElementById('sequence-details');
        const sequenceGroupInput = document.getElementById('sequence-group');
        const sequenceOrderInput = document.getElementById('sequence-order');
        
        if (isSequencedCheckbox && sequenceDetailsDiv && sequenceGroupInput && sequenceOrderInput) {
            console.log("Setting sequence fields:", data.isSequenced, data.sequenceGroup, data.sequenceOrder);
            
            if (data.isSequenced) {
                isSequencedCheckbox.checked = true;
                sequenceDetailsDiv.style.display = 'block';
                sequenceGroupInput.value = data.sequenceGroup || '';
                sequenceOrderInput.value = data.sequenceOrder != null ? data.sequenceOrder : '';
            } else {
                isSequencedCheckbox.checked = false;
                sequenceDetailsDiv.style.display = 'none';
                sequenceGroupInput.value = '';
                sequenceOrderInput.value = '';
            }
        }

        const imagePreview = document.getElementById('image-preview');
        const imageFileName = document.getElementById('image-file-name');
        const imageInput = document.getElementById('question-image-input');
        
        if (imageInput) imageInput.value = ''; // Clear file input
        
        if (data.imageUrl) {
            if (imagePreview) { 
                imagePreview.src = data.imageUrl; 
                imagePreview.style.display = 'block'; 
            }
            if (imageFileName) imageFileName.textContent = 'Current image';
        } else {
            if (imagePreview) { 
                imagePreview.src = ''; 
                imagePreview.style.display = 'none'; 
            }
            if (imageFileName) imageFileName.textContent = 'No image selected';
        }
        
        document.getElementById('question-modal').classList.add('active');
    } catch (error) { 
        console.error('Error preparing edit:', error); 
        alert('Error loading question for editing: ' + error.message); 
    }
}

async function deleteQuestion(id) {
    console.log(`Attempting to delete question ${id}`);
    if (!confirm(`Are you sure you want to delete this question (${id})? This cannot be undone.`)) return;

    try {
        const doc = await questionsCollection.doc(id).get();
        const data = doc.data();
        
        // Check if this is part of a sequence and warn the user
        if (data && data.isSequenced && data.sequenceGroup) {
            if (!confirm(`Warning: This question is part of a sequence (${data.sequenceGroup}). Deleting it may affect the sequence. Continue?`)) {
                return;
            }
        }
        
        if (doc.exists && doc.data().imageUrl) {
            console.log("Question has image, attempting to delete from storage...");
            try {
                const imageRef = storage.refFromURL(doc.data().imageUrl);
                await imageRef.delete();
                console.log("Storage image deleted.");
            } catch (storageError) {
                console.error("Could not delete storage image (may not exist or permissions issue):", storageError);
                if (!confirm("Could not delete associated image. Still delete question data?")) return;
            }
        }
        
        await questionsCollection.doc(id).delete();
        console.log("Question deleted from Firestore.");
        alert('Question deleted successfully');
        loadQuestionsFromFirebase(); // Refresh
    } catch (error) { 
        console.error('Error deleting question:', error); 
        alert('Error deleting question: ' + error.message); 
    }
}

function searchQuestions() {
    console.log("Search triggered.");
    loadQuestionsFromFirebase();
}

// --- Questions Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Update the column headers to include the number column
    const questionTable = document.querySelector('.question-table');
    if (questionTable && questionTable.querySelector('thead tr')) {
        // Check if the number column already exists to avoid duplicating
        if (!questionTable.querySelector('thead tr th:first-child').textContent.includes('#')) {
            // Insert the number column as the first column
            const headerRow = questionTable.querySelector('thead tr');
            headerRow.insertBefore(document.createElement('th'), headerRow.firstChild).textContent = '#';
        }
    }
    
    // --- Question Tab Listeners ---
    try { 
        const subjectFilter = document.getElementById('subject-filter'); 
        const topicFilter = document.getElementById('topic-filter');
        const searchInput = document.getElementById('search-input'); 
        const searchBtn = document.getElementById('search-btn');
        
        if (subjectFilter) { 
            subjectFilter.addEventListener('change', () => { 
                updateFilterTopics(); 
                searchQuestions(); 
            });
        }
        
        if (topicFilter) { 
            topicFilter.addEventListener('change', searchQuestions); 
        }
        
        if (searchInput) { 
            searchInput.addEventListener('input', searchQuestions); 
        }
        
        if (searchBtn) { 
            searchBtn.addEventListener('click', searchQuestions); 
        }
        
        console.log("Question filter listeners attached.");
    } catch (e) { 
        console.error("Error attaching question filter listeners:", e); 
    }

    // --- Question Modal Listeners ---
    try { 
        const addQuestionBtn = document.getElementById('add-question-btn');
        
        if(addQuestionBtn) { 
            addQuestionBtn.addEventListener('click', openAddQuestionModal);
            console.log("Listener attached to Add Question button.");
        } else { 
            console.error("Add Question button NOT FOUND!"); 
        }
        
        const closeModalBtn = document.getElementById('close-modal-btn');
        if(closeModalBtn) {
            closeModalBtn.addEventListener('click', closeQuestionModal);
        }
        
        const cancelQuestionBtn = document.getElementById('cancel-question-btn');
        if(cancelQuestionBtn) {
            cancelQuestionBtn.addEventListener('click', closeQuestionModal);
        }
        
        const questionSubjectSelect = document.getElementById('question-subject');
        if(questionSubjectSelect) {
            questionSubjectSelect.addEventListener('change', updateTopicsBySubject);
        }
        
        const questionImageInput = document.getElementById('question-image-input');
        if(questionImageInput) {
            questionImageInput.addEventListener('change', (event) => previewImage(event.target, 'image-preview', 'image-file-name'));
        }

        const saveQuestionBtn = document.getElementById('save-question-btn');
        if (saveQuestionBtn) {
            saveQuestionBtn.addEventListener('click', saveQuestionToFirebase);
        }

        // --- Sequence options listeners ---
        const isSequencedCheckbox = document.getElementById('is-sequenced');
        const sequenceDetailsDiv = document.getElementById('sequence-details');
        if (isSequencedCheckbox && sequenceDetailsDiv) {
            isSequencedCheckbox.addEventListener('change', function() {
                if (isSequencedCheckbox.checked) {
                    sequenceDetailsDiv.style.display = 'block';
                } else {
                    sequenceDetailsDiv.style.display = 'none';
                    // Optionally clear values when unchecked
                    const sequenceGroupInput = document.getElementById('sequence-group');
                    const sequenceOrderInput = document.getElementById('sequence-order');
                    if (sequenceGroupInput) sequenceGroupInput.value = '';
                    if (sequenceOrderInput) sequenceOrderInput.value = '';
                }
            });
        }
    } catch (e) { 
        console.error("Error attaching question modal listeners:", e); 
    }

    // --- Question Table Action Listener ---
    try { 
        const questionTbody = document.getElementById('question-tbody');
        if (questionTbody) {
            questionTbody.addEventListener('click', (event) => {
                const target = event.target.closest('.table-action'); 
                if (!target) return;
                
                const action = Array.from(target.classList).find(cls => 
                    ['view', 'edit', 'delete'].includes(cls)
                );
                const row = target.closest('tr'); 
                const id = row?.getAttribute('data-id'); 
                
                if (!id) return;
                
                switch (action) {
                    case 'view': 
                        viewQuestion(id); 
                        break; 
                    case 'edit': 
                        editQuestion(id); 
                        break; 
                    case 'delete': 
                        deleteQuestion(id); 
                        break;
                }
            });
            console.log("Question table action listener attached.");
        } else { 
            console.error("Question table body not found!"); 
        }
    } catch (e) { 
        console.error("Error attaching question table action listener:", e); 
    }

    // --- Initial setup ---
    try { 
        updateFilterTopics();
        console.log("Initial filter topics updated.");
        // Load questions on page load to display the total count
        loadQuestionsFromFirebase();
    } catch (e) { 
        console.error("Error during initial setup:", e); 
    }
});