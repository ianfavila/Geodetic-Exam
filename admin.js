// --- Function Definitions ---

// --- Authentication Functions ---
async function loginToAdmin(event) {
    event.preventDefault();
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const email = emailInput.value;
    const password = passwordInput.value;
    const loginButton = document.querySelector('#login-form .login-button');
    const loginError = document.getElementById('login-error');
    if (!loginButton || !loginError) { console.error("Login UI elements missing"); return; }

    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginError.style.display = 'none';
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful:', userCredential.user.uid);
        // UI update is handled by onAuthStateChanged listener
    } catch (error) {
        console.error("Login failed:", error);
        loginError.textContent = `Login Failed: ${error.message}`;
        loginError.style.display = 'block';
        loginButton.disabled = false;
        loginButton.innerHTML = 'Login';
    }
}

function logoutFromAdmin() {
    auth.signOut().catch((error) => {
        console.error("Logout failed:", error);
        alert("Logout failed: " + error.message); // Simple alert for logout error
    });
}

// --- UI Helper Functions ---
function switchTab(tabId) {
    console.log(`Switching to tab: ${tabId}`);
    try {
        document.querySelectorAll('.tab-nav .tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    } catch (e) { console.error("Error switching tabs:", e); }
}

function updateTopicsBySubject() {
    const questionSubject = document.getElementById('question-subject');
    const questionTopic = document.getElementById('question-topic');
    if (!questionSubject || !questionTopic) { console.error("Subject/Topic dropdown not found (updateTopicsBySubject)"); return; }
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
    console.log("Add Question button clicked - function started."); // DEBUG
    
    try {
        const title = document.getElementById('modal-title');
        const qId = document.getElementById('question-id');
        const form = document.getElementById('question-form');
        const topicSelect = document.getElementById('question-topic');
        const imgPreview = document.getElementById('image-preview');
        const imgFileName = document.getElementById('image-file-name');
        const questionModal = document.getElementById('question-modal');

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

function previewImage(input) {
    const imagePreview = document.getElementById('image-preview');
    const imageFileName = document.getElementById('image-file-name');
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

// --- Firebase CRUD Functions ---
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

        if (!subject || !topic || !questionText || !optionA || !optionB || !optionC || !optionD || !correctOptionRadio) {
            alert('Please fill in all required fields (Subject, Topic, Question, all Options) and select the correct answer.');
            console.warn("Save validation failed."); 
            return;
        }
        const correctOption = parseInt(correctOptionRadio.value);
        console.log("Validation passed. Data ready.");

        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        const questionData = { 
            subject, 
            topic, 
            question: questionText, 
            options: [optionA, optionB, optionC, optionD], 
            correctAnswer: correctOption, 
            explanation: explanation || '', 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        };

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

        alert('Question saved successfully!');
        closeQuestionModal();
        loadQuestionsFromFirebase();

    } catch (error) {
        console.error('Error saving question:', error);
        alert(`Error saving question: ${error.message}\nCheck console (F12) for details.`); // Show error message
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
    if (!tbody) { 
        console.error("Cannot find table body #question-tbody"); 
        return; 
    }
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading questions...</td></tr>';

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

        if (snapshot.empty && !subjectFilter && !topicFilter && !searchInput) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No questions found. Add some questions!</td></tr>'; 
            return;
        } else if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No questions match the current filters.</td></tr>'; 
            return;
        }

        tbody.innerHTML = ''; // Clear loading/previous
        let index = 1;
        let matchFound = false;
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
            tr.innerHTML = `
                <td>${index}</td>
                <td>${data.question ? (data.question.length > 100 ? data.question.substring(0, 100) + '...' : data.question) : 'N/A'}</td>
                <td>${data.subject || 'N/A'}</td>
                <td>${data.topic || 'N/A'}</td>
                <td class="action-cell">
                    <div class="table-action view" title="View"><i class="fas fa-eye"></i></div>
                    <div class="table-action edit" title="Edit"><i class="fas fa-edit"></i></div>
                    <div class="table-action delete" title="Delete"><i class="fas fa-trash-alt"></i></div>
                </td>
            `;
            tbody.appendChild(tr);
            index++;
        });

        if (!matchFound && snapshot.size > 0) { // Filtered locally but no search match
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No questions match the search term.</td></tr>';
        } else if (!matchFound && snapshot.empty) { // Covered above, but for clarity
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No questions match the current filters.</td></tr>';
        }
        console.log(`Displayed ${index - 1} questions.`);

    } catch (error) {
        console.error('Error loading questions:', error);
        if (error.code === 'failed-precondition') {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: Firestore index required. Please check the console (F12) for a link to create the index. Error: ${error.message}</td></tr>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading questions: ${error.message}</td></tr>`;
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
        alert(`Subject: ${data.subject}\nTopic: ${data.topic}\n\nQuestion:\n${data.question}\n\nOptions:\n${optionsString}\n\nCorrect Answer: ${correctAnswerLetter}\n\nExplanation:\n${data.explanation || 'N/A'}\n\n${data.imageUrl ? 'Image URL: ' + data.imageUrl : ''}`);
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


// --- Search/Filter Function ---
function searchQuestions() {
    console.log("Search triggered.");
    loadQuestionsFromFirebase();
}

// --- Initialization & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired.");

    // ------------------ Add clear console call for debugging ------------------
    console.clear(); 
    console.log("ADMIN PANEL INITIALIZATION STARTED");

    // Add extra check for body existence, just in case script runs too early somehow
    if (!document.body) {
        console.error("Document body not found at DOMContentLoaded! Script might be in <head> without defer?");
        return;
    }

    const saveBtnCheck = document.getElementById('save-question-btn'); // Check modal button early
    console.log(`Modal Save button element on DOMContentLoaded: ${saveBtnCheck ? 'FOUND' : 'NOT FOUND - Expected if modal not initially visible'}`);

    // ------------------ Auth Listeners ------------------
    try { 
        const loginForm = document.getElementById('login-form');
        if (loginForm) { 
            loginForm.addEventListener('submit', loginToAdmin); 
            console.log("Login form listener attached."); 
        }
        else { 
            console.error("Login form element NOT FOUND!"); 
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) { 
            logoutBtn.addEventListener('click', logoutFromAdmin); 
            console.log("Logout button listener attached."); 
        }
        else { 
            console.error("Logout button element NOT FOUND!"); 
        }
    } catch (e) { 
        console.error("Error attaching auth listeners:", e); 
    }

    // ------------------ Tab Listeners ------------------
    try { 
        document.querySelectorAll('.tab-nav .tab-item').forEach(tab => { 
            tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab'))); 
        });
        const bulkUploadNavBtn = document.getElementById('bulk-upload-nav-btn');
        if (bulkUploadNavBtn) { 
            bulkUploadNavBtn.addEventListener('click', () => switchTab('upload')); 
        } else { 
            console.error("Bulk upload nav button not found"); 
        }
        console.log("Tab listeners attached.");
    } catch (e) { 
        console.error("Error attaching tab listeners:", e); 
    }

    // ------------------ Filter Listeners ------------------
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
        } else {
            console.error("Subject filter not found");
        }
        
        if (topicFilter) { 
            topicFilter.addEventListener('change', searchQuestions); 
        } else {
            console.error("Topic filter not found");
        }
        
        if (searchInput) { 
            searchInput.addEventListener('input', searchQuestions); 
        } else {
            console.error("Search input not found");
        }
        
        if (searchBtn) { 
            searchBtn.addEventListener('click', searchQuestions); 
        } else {
            console.error("Search button not found");
        }
        
        console.log("Filter listeners attached.");
    } catch (e) { 
        console.error("Error attaching filter listeners:", e); 
    }

    // ------------------ Modal Listeners ------------------
    try { 
        // THIS IS THE CRUCIAL FIX FOR ADD QUESTION BUTTON
        const addQuestionBtn = document.getElementById('add-question-btn');
        console.log("Add Question button found:", addQuestionBtn ? "YES" : "NO");
        
        if(addQuestionBtn) { 
            // Remove any existing event listeners first
            const newAddBtn = addQuestionBtn.cloneNode(true);
            addQuestionBtn.parentNode.replaceChild(newAddBtn, addQuestionBtn);
            
            // Add new event listener and log it
            newAddBtn.addEventListener('click', function() {
                console.log("Add Question button clicked!");
                openAddQuestionModal();
            });
            console.log("Listener attached to Add Question button."); 
        } else { 
            console.error("Add Question button NOT FOUND!"); 
        }
        
        const closeModalBtn = document.getElementById('close-modal-btn');
        if(closeModalBtn) {
            closeModalBtn.addEventListener('click', closeQuestionModal);
        } else {
            console.error("Close Modal button not found");
        }
        
        const cancelQuestionBtn = document.getElementById('cancel-question-btn');
        if(cancelQuestionBtn) {
            cancelQuestionBtn.addEventListener('click', closeQuestionModal);
        } else {
            console.error("Cancel Question button not found");
        }
        
        const questionSubjectSelect = document.getElementById('question-subject');
        if(questionSubjectSelect) {
            questionSubjectSelect.addEventListener('change', updateTopicsBySubject);
        } else {
            console.error("Question Subject select not found");
        }
        
        const questionImageInput = document.getElementById('question-image-input');
        if(questionImageInput) {
            questionImageInput.addEventListener('change', (event) => previewImage(event.target));
        } else {
            console.error("Question Image input not found");
        }

        // Attach listener for Save button
        const saveQuestionBtn = document.getElementById('save-question-btn');
        if (saveQuestionBtn) {
            console.log("Save Question button element FOUND in DOMContentLoaded.");
            // Remove any existing event listeners
            const newSaveBtn = saveQuestionBtn.cloneNode(true);
            saveQuestionBtn.parentNode.replaceChild(newSaveBtn, saveQuestionBtn);
            
            // Add new event listener
            newSaveBtn.addEventListener('click', saveQuestionToFirebase);
            console.log("Listener attached to Save Question button.");
        } else {
            console.error("Save Question button element NOT FOUND in DOMContentLoaded!");
        }
    } catch (e) { 
        console.error("Error attaching modal listeners:", e); 
    }

    // ------------------ Table Action Listener ------------------
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
            console.log("Table action listener attached.");
        } else { 
            console.error("Question table body not found!"); 
        }
    } catch (e) { 
        console.error("Error attaching table action listener:", e); 
    }

    // ------------------ Bulk Upload Listeners ------------------
    try { 
        const fileDropArea = document.getElementById('file-drop-area');
        const fileInput = document.getElementById('file-input');
        const removeFileBtn = document.getElementById('remove-file');
        const startUploadBtn = document.getElementById('start-upload');
        const downloadLink = document.getElementById('download-template-link');

        if (fileDropArea && fileInput) {
            fileDropArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => handleFileSelected(fileInput));
            
            fileDropArea.addEventListener('dragover', (e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                fileDropArea.style.borderColor = '#3498db'; 
            });
            
            fileDropArea.addEventListener('dragleave', (e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                fileDropArea.style.borderColor = '#ccc'; 
            });
            
            fileDropArea.addEventListener('drop', (e) => {
                e.preventDefault(); 
                e.stopPropagation(); 
                fileDropArea.style.borderColor = '#ccc';
                
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const droppedFile = e.dataTransfer.files[0];
                    handleFileSelected(droppedFile);
                    e.dataTransfer.clearData();
                }
            });
        } else { 
            console.error("File drop area or input not found"); 
        }
        
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', removeSelectedFile); 
        } else {
            console.error("Remove file button not found");
        }
        
        if (startUploadBtn) {
            startUploadBtn.addEventListener('click', uploadCSV); 
        } else {
            console.error("Start upload button not found");
        }
        
        if (downloadLink) {
            downloadLink.addEventListener('click', (e) => { 
                e.preventDefault(); 
                downloadTemplate(); 
            }); 
        } else {
            console.error("Download template link not found");
        }
        
        console.log("Bulk upload listeners attached.");
    } catch (e) { 
        console.error("Error attaching bulk upload listeners:", e); 
    }

    // ------------------ Initial setup ------------------
    try { 
        updateFilterTopics();
        console.log("Initial filter topics updated.");
    } catch (e) { 
        console.error("Error during initial setup:", e); 
    }

    console.log("DOMContentLoaded setup complete.");
});

// --- Firebase Firestore References ---
const db = firebase.firestore();
const questionsCollection = db.collection('questions');