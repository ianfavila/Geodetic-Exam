// modal-fix.js
// This script ensures the Add Question modal and bulk upload work properly
// Place this script at the end of your HTML file

document.addEventListener('DOMContentLoaded', function() {
    console.clear();
    console.log("=== MODAL & BULK UPLOAD FIX SCRIPT LOADED ===");
    
    // 1. Get references to important elements
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionModal = document.getElementById('question-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelQuestionBtn = document.getElementById('cancel-question-btn');
    const saveQuestionBtn = document.getElementById('save-question-btn');
    const startUploadBtn = document.getElementById('start-upload');
    
    console.log("Add Question Button:", addQuestionBtn ? "Found ✓" : "Not Found ✗");
    console.log("Question Modal:", questionModal ? "Found ✓" : "Not Found ✗");
    console.log("Upload Button:", startUploadBtn ? "Found ✓" : "Not Found ✗");
    
    // 2. Direct event handler for Add Question button
    if (addQuestionBtn) {
        console.log("Setting up direct click handler for Add Question button");
        
        // Remove any existing event listeners to prevent conflicts
        const newBtn = addQuestionBtn.cloneNode(true);
        addQuestionBtn.parentNode.replaceChild(newBtn, addQuestionBtn);
        
        // Add direct click handler with debugging
        newBtn.addEventListener('click', function(e) {
            console.log("ADD QUESTION BUTTON CLICKED!");
            
            // Prevent default if this is a link
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            
            if (questionModal) {
                console.log("Opening modal...");
                
                // Reset form and prepare modal
                prepareAddQuestionModal();
                
                // Try multiple display methods
                questionModal.style.display = 'flex';
                questionModal.classList.add('active');
                
                console.log("Modal should be visible now");
            } else {
                console.error("Modal element not found!");
            }
        });
        
        console.log("Direct click handler attached to Add Question button");
    }
    
    // 3. Improved close modal handlers
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            console.log("Close button clicked");
            closeModal();
        });
    }
    
    if (cancelQuestionBtn) {
        cancelQuestionBtn.addEventListener('click', function() {
            console.log("Cancel button clicked");
            closeModal();
        });
    }
    
    // 4. Helper function to close the modal
    function closeModal() {
        if (questionModal) {
            questionModal.style.display = 'none';
            questionModal.classList.remove('active');
        }
    }
    
    // 5. Helper function to prepare the modal for a new question
    function prepareAddQuestionModal() {
        const title = document.getElementById('modal-title');
        const qId = document.getElementById('question-id');
        const form = document.getElementById('question-form');
        const topicSelect = document.getElementById('question-topic');
        const imgPreview = document.getElementById('image-preview');
        const imgFileName = document.getElementById('image-file-name');
        
        if (title) title.textContent = 'Add New Question';
        if (qId) qId.value = '';
        if (form) form.reset();
        if (topicSelect) {
            topicSelect.disabled = true;
            topicSelect.innerHTML = '<option value="">Select Subject First</option>';
        }
        if (imgPreview) {
            imgPreview.style.display = 'none';
            imgPreview.src = '';
        }
        if (imgFileName) imgFileName.textContent = 'No image selected';
    }
    
    // 6. Add X button to modal if not already present
    function addModalXButton() {
        const modalHeader = document.querySelector('.modal-header');
        if (!modalHeader) return;
        
        // Check if X button already exists
        if (!document.querySelector('.modal-close-x')) {
            console.log("Adding X close button to modal");
            
            const closeX = document.createElement('span');
            closeX.className = 'modal-close-x';
            closeX.innerHTML = '&times;';
            closeX.addEventListener('click', closeModal);
            
            modalHeader.appendChild(closeX);
        }
    }
    
    // Call to add the X button
    addModalXButton();
    
    // 7. Fix the bulk upload functionality
    function fixBulkUploadFunctionality() {
        console.log("Setting up bulk upload fix");
        
        // Ensure the file input and button work together
        const fileInput = document.getElementById('file-input');
        const fileDropArea = document.getElementById('file-drop-area');
        const startUploadBtn = document.getElementById('start-upload');
        const removeFileBtn = document.getElementById('remove-file');
        
        if (fileDropArea && fileInput) {
            // Clear any existing listeners
            const newFileDropArea = fileDropArea.cloneNode(true);
            fileDropArea.parentNode.replaceChild(newFileDropArea, fileDropArea);
            
            // Add new event listeners
            newFileDropArea.addEventListener('click', function(e) {
                e.preventDefault();
                if (fileInput) fileInput.click();
            });
            
            newFileDropArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newFileDropArea.style.borderColor = '#3498db';
            });
            
            newFileDropArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newFileDropArea.style.borderColor = '#ccc';
            });
            
            newFileDropArea.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newFileDropArea.style.borderColor = '#ccc';
                
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    if (fileInput) {
                        fileInput.files = e.dataTransfer.files;
                        handleFileSelected(fileInput);
                    }
                }
            });
            
            console.log("Drop area event listeners attached");
        }
        
        if (fileInput) {
            // Clear any existing listeners
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            
            // Add new event listener
            newFileInput.addEventListener('change', function() {
                console.log("File input changed");
                handleFileSelected(this);
            });
            
            console.log("File input event listener attached");
        }
        
        if (startUploadBtn) {
            // Clear any existing listeners
            const newStartUploadBtn = startUploadBtn.cloneNode(true);
            startUploadBtn.parentNode.replaceChild(newStartUploadBtn, startUploadBtn);
            
            // Add new event listener
            newStartUploadBtn.addEventListener('click', function() {
                console.log("Upload button clicked");
                if (typeof uploadCSV === 'function') {
                    uploadCSV();
                } else {
                    console.error("uploadCSV function not found!");
                    alert("Error: Upload functionality not available. Please check the console.");
                }
            });
            
            console.log("Start upload button event listener attached");
        }
        
        if (removeFileBtn) {
            // Clear any existing listeners
            const newRemoveFileBtn = removeFileBtn.cloneNode(true);
            removeFileBtn.parentNode.replaceChild(newRemoveFileBtn, removeFileBtn);
            
            // Add new event listener
            newRemoveFileBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof removeSelectedFile === 'function') {
                    removeSelectedFile();
                } else {
                    console.error("removeSelectedFile function not found!");
                    // Basic implementation if function not found
                    if (fileInput) fileInput.value = '';
                    const selectedFileDiv = document.getElementById('selected-file');
                    if (selectedFileDiv) selectedFileDiv.style.display = 'none';
                    if (startUploadBtn) startUploadBtn.disabled = true;
                }
            });
            
            console.log("Remove file button event listener attached");
        }
    }
    
    // Call to fix bulk upload functionality
    fixBulkUploadFunctionality();
    
    // 8. Override the saveQuestionToFirebase function for better error handling
    if (typeof window.saveQuestionToFirebase === 'function') {
        console.log("Original saveQuestionToFirebase function found - creating wrapper");
        
        const originalSaveFunction = window.saveQuestionToFirebase;
        
        window.saveQuestionToFirebase = async function() {
            console.log("Enhanced save function called");
            
            const saveButton = document.getElementById('save-question-btn');
            let originalText = saveButton ? saveButton.innerHTML : 'Save Question';
            
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                saveButton.disabled = true;
            }
            
            try {
                // Additional validation
                const subject = document.getElementById('question-subject')?.value;
                const topic = document.getElementById('question-topic')?.value;
                const questionText = document.getElementById('question-text')?.value;
                const optionA = document.getElementById('option-a')?.value;
                const optionB = document.getElementById('option-b')?.value;
                const optionC = document.getElementById('option-c')?.value;
                const optionD = document.getElementById('option-d')?.value;
                const correctOptionRadio = document.querySelector('input[name="correct-option"]:checked');
                
                if (!subject || !topic || !questionText || !optionA || !optionB || !optionC || !optionD || !correctOptionRadio) {
                    alert('Please fill in all required fields (Subject, Topic, Question, all Options) and select the correct answer.');
                    if (saveButton) {
                        saveButton.innerHTML = originalText;
                        saveButton.disabled = false;
                    }
                    return;
                }
                
                // Call original function's code
                await originalSaveFunction();
                
                // Success handling is in the original function
                
            } catch (error) {
                console.error("Error in enhanced save function:", error);
                alert(`Error saving question: ${error.message}\nCheck console (F12) for details.`);
                if (saveButton) {
                    saveButton.innerHTML = originalText;
                    saveButton.disabled = false;
                }
            }
        };
        
        console.log("Function wrapper complete");
    }
    
    // 9. Enhance CSV parsing with better error messages
    if (typeof window.uploadCSV === 'function') {
        console.log("Original uploadCSV function found - creating improved version");
        
        const originalUploadFunction = window.uploadCSV;
        
        window.uploadCSV = async function() {
            console.log("Enhanced uploadCSV function called");
            
            const fileInput = document.getElementById('file-input');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                alert('Please select a CSV file first using the browse or drop area.');
                return;
            }
            
            const file = fileInput.files[0];
            if (!file.name.toLowerCase().endsWith('.csv')) {
                alert('The selected file must be a CSV file (.csv).');
                return;
            }
            
            const startUploadBtn = document.getElementById('start-upload');
            const originalUploadBtnText = startUploadBtn?.innerHTML || '<i class="fas fa-upload"></i> Upload Questions';
            
            if (startUploadBtn) {
                startUploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Reading file...`;
                startUploadBtn.disabled = true;
            }
            
            try {
                // Call the original function
                await originalUploadFunction();
                
            } catch (error) {
                console.error("Error in enhanced uploadCSV function:", error);
                alert(`Error uploading CSV: ${error.message}\nCheck console (F12) for details.`);
                
                if (startUploadBtn) {
                    startUploadBtn.innerHTML = originalUploadBtnText;
                    startUploadBtn.disabled = true; // Keep disabled until new file selected
                }
                
                // Clear selection
                if (typeof removeSelectedFile === 'function') {
                    removeSelectedFile();
                } else {
                    if (fileInput) fileInput.value = '';
                    const selectedFileDiv = document.getElementById('selected-file');
                    if (selectedFileDiv) selectedFileDiv.style.display = 'none';
                }
            }
        };
        
        console.log("CSV upload function enhancement complete");
    }
    
    console.log("=== MODAL & BULK UPLOAD FIX SCRIPT COMPLETED ===");
});