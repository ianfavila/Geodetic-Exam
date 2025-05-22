// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhHCA9CF_9D_2d-cD7B7S3YlT1NqtF6aI",
    projectId: "geodetic-online-examination",
    authDomain: "geodetic-online-examination.firebaseapp.com",
    storageBucket: "geodetic-online-examination-storage.appspot.com",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage(); // Add storage reference

// DOM Elements
const loginModal = document.getElementById("loginModal");
const editPasswordModal = document.getElementById("editPasswordModal");
const addTopicModal = document.getElementById("addTopicModal");
const loginBtn = document.getElementById("loginBtn");
const loginClose = document.getElementsByClassName("close")[0];
const editPasswordClose = document.getElementById("editPasswordClose");
const addTopicClose = document.getElementById("addTopicClose");
const loginForm = document.getElementById("loginForm");
const editPasswordForm = document.getElementById("editPasswordForm");
const addTopicForm = document.getElementById("addTopicForm");

// Create access denied modal dynamically
const accessDeniedModal = document.createElement("div");
accessDeniedModal.id = "accessDeniedModal";
accessDeniedModal.className = "modal";
accessDeniedModal.innerHTML = `
    <div class="access-denied-content">
        <h2>Access Denied</h2>
        <p>Invalid password. Please try again with the correct password.</p>
        <button class="try-again-btn" onclick="showEditPasswordModal()">Try Again</button>
    </div>
`;
document.body.appendChild(accessDeniedModal);

// Constants
const EDIT_PASSWORD = "IWILLTOPGELE2025";
const EDIT_ACCESS_KEY = "geodetic_edit_access";

// Check if edit access is already granted
const checkEditAccess = () => {
    return sessionStorage.getItem(EDIT_ACCESS_KEY) === "granted";
};

// Display access denied modal
const showAccessDeniedModal = () => {
    accessDeniedModal.style.display = "block";
};

// Event Handlers for Modals
// When the user clicks the login button, open the login modal 
if (loginBtn) {
    loginBtn.onclick = function() {
        loginModal.style.display = "block";
    };
}

// When the user clicks on <span> (x), close the modals
if (loginClose) {
    loginClose.onclick = function() {
        loginModal.style.display = "none";
    };
}

if (editPasswordClose) {
    editPasswordClose.onclick = function() {
        editPasswordModal.style.display = "none";
    };
}

if (addTopicClose) {
    addTopicClose.onclick = function() {
        addTopicModal.style.display = "none";
    };
}

// When the user clicks anywhere outside of the modals, close them
window.onclick = function(event) {
    if (loginModal && event.target == loginModal) {
        loginModal.style.display = "none";
    }
    if (editPasswordModal && event.target == editPasswordModal) {
        editPasswordModal.style.display = "none";
    }
    if (addTopicModal && event.target == addTopicModal) {
        addTopicModal.style.display = "none";
    }
    if (event.target == accessDeniedModal) {
        accessDeniedModal.style.display = "none";
    }
};

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        // Check if it's an admin email
        if (email.endsWith("gmail.com")) {
            // Redirect directly to admin page without password check
            window.location.href = "admin.html";
        } else if (email === "geodeticeexam.gmail.com" && password === "shamgod1062") {
            // Original admin credentials still work too
            window.location.href = "admin.html";
        } else {
            // For non-admin users or incorrect credentials
            alert("Invalid credentials. Please try again.");
        }
    });
}

// Handle edit password form submission
if (editPasswordForm) {
    editPasswordForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const editPassword = document.getElementById("editPassword").value;
        
        // Check if password is valid
        if (editPassword === EDIT_PASSWORD) {
            // Grant edit access
            sessionStorage.setItem(EDIT_ACCESS_KEY, "granted");
            editPasswordModal.style.display = "none";
            
            // Enable edit controls
            enableEditControls();
            
            // If there was a pending edit action, execute it
            const pendingAction = sessionStorage.getItem('pendingEditAction');
            if (pendingAction) {
                sessionStorage.removeItem('pendingEditAction');
                // Execute the pending action
                executePendingAction(pendingAction);
            }
        } else {
            // Show access denied modal
            editPasswordModal.style.display = "none";
            showAccessDeniedModal();
        }
    });
}

// Function to show edit password modal
function showEditPasswordModal() {
    if (editPasswordModal) {
        editPasswordModal.style.display = "block";
        accessDeniedModal.style.display = "none";
    } else {
        console.error("Edit password modal not found in the DOM");
    }
}

// Function to show add topic modal
function showAddTopicModal() {
    if (!checkEditAccess()) {
        showEditPasswordModal();
        return;
    }
    
    if (addTopicModal) {
        addTopicModal.style.display = "block";
        // Focus on input field
        document.getElementById("topicName").focus();
    } else {
        console.error("Add topic modal not found in the DOM");
    }
}

// Function to hide add topic modal
function hideAddTopicModal() {
    if (addTopicModal) {
        addTopicModal.style.display = "none";
    }
}

// Function to open index card folder
function openIndexCardFolder(subject) {
    console.log("Opening folder: " + subject); // Debug log
    
    // Store the selected subject in local storage
    localStorage.setItem('selectedCardFolder', subject);
    
    if (subject === 'AddNew') {
        // Check if user has edit access before redirecting to add new cards
        if (checkEditAccess()) {
            window.location.href = 'add-cards.html';
        } else {
            // Store the pending action and show password modal
            sessionStorage.setItem('pendingEditAction', 'addNew');
            showEditPasswordModal();
        }
    } else {
        // Redirect to the folder view page for that subject
        window.location.href = 'card-viewer.html?folder=' + encodeURIComponent(subject);
    }
}

// Function to enable edit controls
function enableEditControls() {
    const editControls = document.querySelectorAll('.edit-control');
    editControls.forEach(control => {
        control.classList.remove('disabled');
        control.removeAttribute('disabled');
    });
    
    // Show any hidden edit buttons
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.style.display = 'block';
    });
    
    // Update UI to show edit mode is active
    const editStatusIndicator = document.getElementById('editStatusIndicator');
    if (editStatusIndicator) {
        editStatusIndicator.textContent = 'Edit Mode: Active';
        editStatusIndicator.classList.remove('edit-locked');
        editStatusIndicator.classList.add('edit-active');
    }
}

// Function to validate edit access
function validateEditAccess(action, cardId) {
    if (checkEditAccess()) {
        // If edit access is granted, allow the edit action
        return true;
    } else {
        // Store the pending edit action and show password modal
        sessionStorage.setItem('pendingEditAction', JSON.stringify({action, cardId}));
        showEditPasswordModal();
        return false;
    }
}

// Function to execute pending action
function executePendingAction(pendingActionStr) {
    try {
        // For simple actions
        if (pendingActionStr === 'addNew') {
            window.location.href = 'add-cards.html';
            return;
        }
        
        // For complex actions
        const pendingAction = JSON.parse(pendingActionStr);
        
        switch(pendingAction.action) {
            case 'edit':
                showInlineEditForm(pendingAction.cardId);
                break;
            case 'delete':
                deleteCard(pendingAction.cardId);
                break;
            case 'add':
                addIndexCard(pendingAction.data);
                break;
            case 'createTopic':
                createTopic(pendingAction.subject, pendingAction.topic);
                break;
            case 'createSubtopic':
                createSubtopic(pendingAction.subject, pendingAction.parentTopic, pendingAction.subtopic);
                break;
            case 'deleteTopic':
                deleteTopic(pendingAction.subject, pendingAction.topic);
                break;
            default:
                console.error("Unknown pending action:", pendingAction.action);
        }
    } catch (e) {
        console.error("Error executing pending action:", e);
    }
}

// Function to get all topics for a subject
function getTopics(subject) {
    console.log("Getting topics for subject:", subject); // Debug log
    
    return db.collection('topics')
        .where('subject', '==', subject)
        .get()
        .then((querySnapshot) => {
            const topics = [];
            console.log("Query snapshot size:", querySnapshot.size); // Debug log
            
            querySnapshot.forEach((doc) => {
                console.log("Topic data:", doc.id, doc.data()); // Debug log
                topics.push(doc.data().name);
            });
            
            console.log("Fetched topics:", topics.length); // Debug log
            return topics;
        })
        .catch((error) => {
            console.error("Error fetching topics:", error);
            return [];
        });
}

// Function to create a new topic
function createTopic(subject, topicName) {
    console.log("Creating topic:", topicName, "for subject:", subject); // Debug log
    
    // Check edit access before creating
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'createTopic',
            subject: subject,
            topic: topicName
        }));
        showEditPasswordModal();
        return Promise.reject("Edit access required");
    }
    
    // Create topic data
    const topicData = {
        subject: subject,
        name: topicName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    return db.collection('topics').add(topicData)
        .then(docRef => {
            console.log("Topic created with ID:", docRef.id); // Debug log
            return docRef;
        })
        .catch(error => {
            console.error("Error creating topic:", error);
            throw error;
        });
}

// Function to fetch cards by topic
function fetchCardsByTopic(subject, topic) {
    console.log("Fetching cards for subject:", subject, "and topic:", topic); // Debug log
    
    return db.collection('indexCards')
        .where('subject', '==', subject)
        .where('topic', '==', topic)
        .get()
        .then((querySnapshot) => {
            const cards = [];
            console.log("Query snapshot size:", querySnapshot.size); // Debug log
            
            querySnapshot.forEach((doc) => {
                console.log("Card data:", doc.id, doc.data()); // Debug log
                cards.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log("Fetched cards:", cards.length); // Debug log
            return cards;
        })
        .catch((error) => {
            console.error("Error fetching cards:", error);
            return [];
        });
}

// Function to upload card image to Firebase Storage
function uploadCardImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        
        console.log("Uploading image:", file.name);
        
        // Create a storage reference
        const storageRef = storage.ref();
        
        // Create a unique filename
        const filename = `question-images/${Date.now()}_${file.name}`;
        const imageRef = storageRef.child(filename);
        
        // Upload the file
        const uploadTask = imageRef.put(file);
        
        // Listen for state changes, errors, and completion
        uploadTask.on('state_changed',
            (snapshot) => {
                // Get upload progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                
                // Update UI with progress if needed
                const progressElement = document.getElementById('uploadProgress');
                if (progressElement) {
                    progressElement.style.width = progress + '%';
                }
            },
            (error) => {
                // Handle unsuccessful uploads
                console.error('Error uploading image:', error);
                reject(error);
            },
            () => {
                // Handle successful uploads
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    resolve(downloadURL);
                });
            }
        );
    });
}

// Function to add a new index card to Firebase
function addIndexCard(cardData) {
    console.log("Adding new card with data:", cardData); // Debug log
    
    // Check edit access before adding
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'add',
            data: cardData
        }));
        showEditPasswordModal();
        return Promise.reject("Edit access required");
    }
    
    // If there's an image file to upload
    if (cardData.imageFile) {
        return uploadCardImage(cardData.imageFile)
            .then(imageUrl => {
                // Remove the file object and add the URL
                const { imageFile, ...dataWithoutFile } = cardData;
                const dataToSave = {
                    ...dataWithoutFile,
                    imageUrl: imageUrl,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add the card to Firestore
                return db.collection('indexCards').add(dataToSave);
            })
            .then(docRef => {
                console.log("Card added with ID:", docRef.id); // Debug log
                return docRef;
            })
            .catch(error => {
                console.error("Error adding card:", error);
                throw error;
            });
    } else {
        // Ensure cardData includes all required fields without image
        const data = {
            subject: cardData.subject,
            question: cardData.question,
            answer: cardData.answer,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add image URL if provided
        if (cardData.imageUrl) {
            data.imageUrl = cardData.imageUrl;
        }
        
        // Add topic if provided
        if (cardData.topic) {
            data.topic = cardData.topic;
        }
        
        return db.collection('indexCards').add(data)
            .then(docRef => {
                console.log("Card added with ID:", docRef.id); // Debug log
                return docRef;
            })
            .catch(error => {
                console.error("Error adding card:", error);
                throw error;
            });
    }
}

// Function to update an existing index card
function updateIndexCard(cardData) {
    console.log("Updating card:", cardData.id, "with data:", cardData); // Debug log
    
    // Check edit access before updating
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'edit',
            cardId: cardData.id
        }));
        showEditPasswordModal();
        return Promise.reject("Edit access required");
    }
    
    // If there's a new image file to upload
    if (cardData.imageFile) {
        return uploadCardImage(cardData.imageFile)
            .then(imageUrl => {
                // Remove the file object and add the URL
                const { id, imageFile, ...dataWithoutFile } = cardData;
                const updateData = {
                    ...dataWithoutFile,
                    imageUrl: imageUrl,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Update the card in Firestore
                return db.collection('indexCards').doc(id).update(updateData);
            })
            .then(() => {
                console.log("Card updated successfully"); // Debug log
                return true;
            })
            .catch(error => {
                console.error("Error updating card:", error);
                throw error;
            });
    } else {
        // Extract ID from cardData
        const { id, imageFile, ...updateData } = cardData;
        
        // Add updatedAt timestamp
        updateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        return db.collection('indexCards').doc(id).update(updateData)
            .then(() => {
                console.log("Card updated successfully"); // Debug log
                return true;
            })
            .catch(error => {
                console.error("Error updating card:", error);
                throw error;
            });
    }
}

// Function to delete an index card
function deleteIndexCard(cardId) {
    console.log("Deleting card:", cardId); // Debug log
    
    // Check edit access before deleting
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'delete',
            cardId: cardId
        }));
        showEditPasswordModal();
        return Promise.reject("Edit access required");
    }
    
    // Get the card first to check if it has an image
    return db.collection('indexCards').doc(cardId).get()
        .then(doc => {
            if (doc.exists) {
                const cardData = doc.data();
                const promises = [db.collection('indexCards').doc(cardId).delete()];
                
                // If the card has an image, delete it from storage
                if (cardData.imageUrl) {
                    try {
                        // Extract the path from the URL
                        const url = new URL(cardData.imageUrl);
                        const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);
                        
                        if (pathMatch && pathMatch[1]) {
                            const path = decodeURIComponent(pathMatch[1]);
                            const imageRef = storage.ref(path);
                            promises.push(imageRef.delete());
                        }
                    } catch (e) {
                        console.error("Error parsing image URL:", e);
                    }
                }
                
                return Promise.all(promises);
            }
            return Promise.resolve();
        })
        .then(() => {
            console.log("Card deleted successfully"); // Debug log
            return true;
        })
        .catch(error => {
            console.error("Error deleting card:", error);
            throw error;
        });
}

// Function to get a single card by ID
function getCardById(cardId) {
    console.log("Getting card by ID:", cardId); // Debug log
    
    return db.collection('indexCards').doc(cardId).get()
        .then(doc => {
            if (doc.exists) {
                console.log("Card found:", doc.data()); // Debug log
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                console.log("No card found with ID:", cardId); // Debug log
                return null;
            }
        })
        .catch(error => {
            console.error("Error getting card:", error);
            throw error;
        });
}

// Function to edit a card
function editCard(cardId) {
    // Use inline editing if available
    if (typeof showInlineEditForm === 'function') {
        showInlineEditForm(cardId);
    } else {
        // Redirect to edit page or open edit modal
        window.location.href = `edit-card.html?id=${cardId}`;
    }
}

// Function to delete a card with confirmation
function deleteCard(cardId) {
    if (confirm("Are you sure you want to delete this card?")) {
        deleteIndexCard(cardId)
            .then(() => {
                alert("Card deleted successfully");
                // Refresh the page or update the UI
                location.reload();
            })
            .catch(error => {
                console.error("Error deleting card:", error);
                alert("Failed to delete card: " + error.message);
            });
    }
}

// Function to flip card (for card-viewer.html)
function flipCard(button) {
    const cardContent = button.parentElement.previousElementSibling;
    const frontSide = cardContent.querySelector('.card-front');
    const backSide = cardContent.querySelector('.card-back');
    
    if (backSide.style.display === 'none') {
        frontSide.style.display = 'none';
        backSide.style.display = 'block';
        button.textContent = 'Show Question';
    } else {
        frontSide.style.display = 'block';
        backSide.style.display = 'none';
        button.textContent = 'Show Answer';
    }
}

// Function to get folder description based on folder name
function getFolderDescription(folderName) {
    switch(folderName) {
        case 'Geodesy':
            return 'Flashcards on Geodetic Surveying, Geodetic Astronomy, Triangulation, Leveling, Gravity Measurement, and more.';
        case 'Mathematics':
            return 'Flashcards on Algebra, Geometry, Trigonometry, Calculus, Engineering Economics, Mechanics, and more.';
        case 'Theory':
            return 'Flashcards on Property Surveying, Land Surveying, Astronomy, Engineering Surveys, and more.';
        case 'Laws':
            return 'Flashcards on Public Land Laws, Property Laws, Land Reform, Professional Ethics, and more.';
        case 'Cartography':
            return 'Flashcards on Plotting, Mapping, Surveys, Map Projections, and more.';
        default:
            return 'Study and review index cards for Geodetic Engineering.';
    }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to go back to previous page
function goBack() {
    // Get the previously selected folder from local storage
    const previousFolder = localStorage.getItem('selectedCardFolder');
    if (previousFolder) {
        window.location.href = 'card-viewer.html?folder=' + encodeURIComponent(previousFolder);
    } else {
        window.location.href = 'indexcards.html';
    }
}

// Initialize edit status indicator and check page type on document load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded"); // Debug log
    
    // Initialize edit status indicator
    const editStatusIndicator = document.getElementById('editStatusIndicator');
    if (editStatusIndicator) {
        if (checkEditAccess()) {
            editStatusIndicator.textContent = 'Edit Mode: Active';
            editStatusIndicator.classList.remove('edit-locked');
            editStatusIndicator.classList.add('edit-active');
            enableEditControls();
        } else {
            editStatusIndicator.textContent = 'Edit Mode: Locked';
            editStatusIndicator.classList.add('edit-locked');
        }
    }
    
    // Initialize image upload preview if on the add card or edit card page
    const imageUploadInput = document.getElementById('cardImageUpload');
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const imagePreview = document.getElementById('imagePreview');
            
            if (file && imagePreview) {
                // Show preview of the image
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `
                        <div class="image-preview-container">
                            <img src="${e.target.result}" alt="Card image preview" class="image-preview">
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
});

// Function to remove image preview and clear the file input
function removeImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
    const imageUploadInput = document.getElementById('cardImageUpload');
    const imageUrlInput = document.getElementById('cardImageUrl');
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (imageUploadInput) {
        imageUploadInput.value = '';
    }
    
    if (imageUrlInput) {
        imageUrlInput.value = '';
    }
}

// Function to delete a topic
function deleteTopic(subject, topicName) {
    console.log("Deleting topic:", topicName, "from subject:", subject);
    
    // Check edit access before deleting
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'deleteTopic',
            subject: subject,
            topic: topicName
        }));
        showEditPasswordModal();
        return Promise.reject("Edit access required");
    }
    
    // Confirm topic deletion
    if (!confirm(`Are you sure you want to delete the topic "${topicName}"? This will also delete all cards in this topic. This action cannot be undone.`)) {
        return Promise.resolve(false);
    }
    
    // We need to:
    // 1. Find the topic document ID
    // 2. Delete all cards in the topic
    // 3. Delete the topic itself
    return db.collection('topics')
        .where('subject', '==', subject)
        .where('name', '==', topicName)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                throw new Error("Topic not found");
            }
            
            // Get the topic ID
            const topicId = querySnapshot.docs[0].id;
            
            // Create a batch operation
            const batch = db.batch();
            
            // First, get all cards in the topic
            return db.collection('indexCards')
                .where('subject', '==', subject)
                .where('topic', '==', topicName)
                .get()
                .then((cardsSnapshot) => {
                    // Delete all cards in the topic
                    cardsSnapshot.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    
                    // Delete the topic
                    batch.delete(db.collection('topics').doc(topicId));
                    
                    // Commit the batch
                    return batch.commit();
                });
        })
        .then(() => {
            console.log("Topic and all its cards deleted successfully");
            return true;
        })
        .catch(error => {
            console.error("Error deleting topic:", error);
            throw error;
        });
}

// Function to create a subtopic
function createSubtopic(subject, parentTopic, subtopicName) {
    console.log("Creating subtopic:", subtopicName, "under parent topic:", parentTopic, "for subject:", subject);
    
    // Check edit access before creating
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'createSubtopic',
            subject: subject,
            parentTopic: parentTopic,
            subtopic: subtopicName
        }));
        showEditPasswordModal();
        return Promise.reject("Edit access required");
    }
    
    // Create subtopic data
    // Format: "parentTopic/subtopicName" to create a hierarchical structure
    const fullTopicPath = parentTopic ? `${parentTopic}/${subtopicName}` : subtopicName;
    
    const topicData = {
        subject: subject,
        name: fullTopicPath,
        displayName: subtopicName,
        parentTopic: parentTopic || null,
        isSubtopic: !!parentTopic,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    return db.collection('topics').add(topicData)
        .then(docRef => {
            console.log("Subtopic created with ID:", docRef.id);
            return docRef;
        })
        .catch(error => {
            console.error("Error creating subtopic:", error);
            throw error;
        });
}

// Enhanced function to get all topics with hierarchy and card counts
function getTopicsWithCounts(subject) {
    console.log("Getting topics with card counts for subject:", subject);
    
    const topicsPromise = db.collection('topics')
        .where('subject', '==', subject)
        .get()
        .then((querySnapshot) => {
            const topics = [];
            querySnapshot.forEach((doc) => {
                topics.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return topics;
        });
    
    const countsPromise = db.collection('indexCards')
        .where('subject', '==', subject)
        .get()
        .then((querySnapshot) => {
            const counts = {};
            querySnapshot.forEach((doc) => {
                const topic = doc.data().topic;
                if (topic) {
                    counts[topic] = (counts[topic] || 0) + 1;
                }
            });
            return counts;
        });
    
    return Promise.all([topicsPromise, countsPromise])
        .then(([topics, counts]) => {
            // Return both topics and counts
            return [topics, counts];
        })
        .catch((error) => {
            console.error("Error fetching topics with counts:", error);
            return [[], {}];
        });
}

// Function to show inline card edit form with image support
function showInlineEditForm(cardId) {
    console.log("Showing inline edit form for card:", cardId);
    
    // Check edit access
    if (!checkEditAccess()) {
        sessionStorage.setItem('pendingEditAction', JSON.stringify({
            action: 'edit',
            cardId: cardId
        }));
        showEditPasswordModal();
        return;
    }
    
    // Get the card data
    getCardById(cardId)
        .then(card => {
            if (!card) {
                throw new Error("Card not found");
            }
            
            // Find the card element
            let cardElement;
            
            // Different selection based on view mode
            if (document.getElementById('cardNavigation') && document.getElementById('cardNavigation').style.display === 'flex') {
                // Single card view
                cardElement = document.querySelector('.single-card');
            } else {
                // Grid view
                cardElement = document.querySelector(`.index-card[data-id="${cardId}"]`);
            }
            
            if (!cardElement) {
                throw new Error("Card element not found in DOM");
            }
            
            // Add edit mode class
            cardElement.classList.add('edit-mode');
            
            // Store the original content so we can restore it if cancelled
            cardElement.dataset.originalContent = cardElement.innerHTML;
            
            // Create image preview HTML
            const imagePreviewHtml = card.imageUrl ? 
                `<div class="image-preview-container">
                    <img src="${card.imageUrl}" alt="Card image" class="image-preview">
                    <button type="button" class="remove-image-btn" onclick="removeCurrentImage('${cardId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>` : '';
            
            // Create edit form with image upload
            cardElement.innerHTML = `
                <div class="edit-card-form">
                    <div class="form-row">
                        <label for="editCardQuestion">Question</label>
                        <textarea id="editCardQuestion" placeholder="Enter the front side (question) of the card" required>${escapeHtml(card.question || '')}</textarea>
                    </div>
                    <div class="form-row">
                        <label for="editCardAnswer">Answer</label>
                        <textarea id="editCardAnswer" placeholder="Enter the back side (answer) of the card" required>${escapeHtml(card.answer || '')}</textarea>
                    </div>
                    <div class="form-row">
                        <label for="editCardImage">Card Image (Optional)</label>
                        <input type="file" id="editCardImage" accept="image/*" class="image-upload-input">
                        <input type="hidden" id="editCardImageUrl" value="${card.imageUrl || ''}">
                        <div id="editImagePreview">${imagePreviewHtml}</div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="cancelInlineEdit('${cardId}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="save-btn" onclick="saveInlineEdit('${cardId}')">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            `;
            
            // Set up image preview for new uploads
            const imageInput = cardElement.querySelector('#editCardImage');
            if (imageInput) {
                imageInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    const imagePreview = cardElement.querySelector('#editImagePreview');
                    
                    if (file && imagePreview) {
                        // Show preview of the image
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            imagePreview.innerHTML = `
                                <div class="image-preview-container">
                                    <img src="${e.target.result}" alt="Card image preview" class="image-preview">
                                    <button type="button" class="remove-image-btn" onclick="removeEditImagePreview()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
            
            // Focus on the question field
            cardElement.querySelector('#editCardQuestion').focus();
        })
        .catch(error => {
            console.error("Error preparing inline edit:", error);
            alert("Error preparing edit form: " + error.message);
        });
}

// Function to remove current image from a card being edited
function removeCurrentImage(cardId) {
    const imagePreview = document.querySelector('#editImagePreview');
    const imageUrlInput = document.querySelector('#editCardImageUrl');
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (imageUrlInput) {
        imageUrlInput.value = 'DELETE'; // Special value to indicate image should be deleted
    }
}

// Function to remove edit image preview
function removeEditImagePreview() {
    const imagePreview = document.querySelector('#editImagePreview');
    const imageInput = document.querySelector('#editCardImage');
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (imageInput) {
        imageInput.value = '';
    }
}

// Function to cancel inline edit
function cancelInlineEdit(cardId) {
    console.log("Cancelling inline edit for card:", cardId);
    
    // Find the card element
    let cardElement;
    
    // Different selection based on view mode
    if (document.getElementById('cardNavigation') && document.getElementById('cardNavigation').style.display === 'flex') {
        // Single card view
        cardElement = document.querySelector('.single-card');
    } else {
        // Grid view
        cardElement = document.querySelector(`.index-card[data-id="${cardId}"]`);
    }
    
    if (cardElement && cardElement.dataset.originalContent) {
        // Remove edit mode class
        cardElement.classList.remove('edit-mode');
        
        // Restore original content
        cardElement.innerHTML = cardElement.dataset.originalContent;
        delete cardElement.dataset.originalContent;
    }
}

// Function to save inline edit
function saveInlineEdit(cardId) {
    console.log("Saving inline edit for card:", cardId);
    
    // Find the card element
    let cardElement;
    
    // Different selection based on view mode
    if (document.getElementById('cardNavigation') && document.getElementById('cardNavigation').style.display === 'flex') {
        // Single card view
        cardElement = document.querySelector('.single-card');
    } else {
        // Grid view
        cardElement = document.querySelector(`.index-card[data-id="${cardId}"]`);
    }
    
    if (!cardElement) {
        console.error("Card element not found");
        return;
    }
    
    // Get updated values
    const question = cardElement.querySelector('#editCardQuestion').value;
    const answer = cardElement.querySelector('#editCardAnswer').value;
    const imageFile = cardElement.querySelector('#editCardImage').files[0];
    const currentImageUrl = cardElement.querySelector('#editCardImageUrl').value;
    
    // Validate
    if (!question || !answer) {
        alert("Please enter both question and answer.");
        return;
    }
    
    // Show saving indicator
    const saveBtn = cardElement.querySelector('.save-btn');
    const originalSaveBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    
    // Get the card data to update
    getCardById(cardId)
        .then(card => {
            if (!card) {
                throw new Error("Card not found");
            }
            
            // Prepare update data
            const updateData = {
                id: cardId,
                subject: card.subject,
                topic: card.topic,
                question: question,
                answer: answer
            };
            
            // Handle image updates
            if (imageFile) {
                // New image uploaded
                updateData.imageFile = imageFile;
            } else if (currentImageUrl === 'DELETE') {
                // Image should be deleted
                updateData.imageUrl = null;
            } else if (currentImageUrl) {
                // Keep existing image
                updateData.imageUrl = currentImageUrl;
            }
            
            // Update the card
            return updateIndexCard(updateData);
        })
        .then(() => {
            // Remove edit mode class
            cardElement.classList.remove('edit-mode');
            
            // Show success message
            alert("Card updated successfully!");
            
            // Update the card in memory and UI
            if (document.getElementById('cardNavigation') && document.getElementById('cardNavigation').style.display === 'flex') {
                // Update in single card view
                allCards[currentCardIndex].question = question;
                allCards[currentCardIndex].answer = answer;
                
                // If we modified the image, reload the page to show changes
                if (imageFile || currentImageUrl === 'DELETE') {
                    location.reload();
                } else {
                    updateCardView();
                }
            } else {
                // Update in grid view - reload to ensure image changes are shown
                location.reload();
            }
        })
        .catch(error => {
            console.error("Error updating card:", error);
            alert("Error updating card: " + error.message);
        })
        .finally(() => {
            // Reset save button
            if (saveBtn) {
                saveBtn.innerHTML = originalSaveBtnText;
                saveBtn.disabled = false;
            }
        });
}

// Function to refresh a card view after editing without reloading
function refreshCardView(cardId, updatedData) {
    const cardElement = document.querySelector(`.index-card[data-id="${cardId}"]`);
    if (!cardElement) {
        console.error("Card element not found for refresh");
        return;
    }
    
    // Create image HTML if card has an image
    const imageHtml = updatedData.imageUrl ? 
        `<div class="card-image">
            <img src="${updatedData.imageUrl}" alt="Card image" class="card-image-content">
        </div>` : '';
    
    // Update the card in the DOM
    cardElement.innerHTML = `
        <div class="card-content">
            <div class="card-front">
                <h3>${escapeHtml(updatedData.question || 'Question')}</h3>
                ${imageHtml}
            </div>
            <div class="card-back" style="display: none;">
                <p>${escapeHtml(updatedData.answer || 'Answer')}</p>
            </div>
        </div>
        <div class="card-tools">
            <button class="flip-btn" onclick="flipCard(this)">Show Answer</button>
            <a href="card-viewer.html?folder=${encodeURIComponent(currentSubject)}&topic=${encodeURIComponent(currentTopic)}&card=${getCardIndex(cardId)}" class="view-single-btn">View Card</a>
            <button class="edit-button edit-control" onclick="showInlineEditForm('${cardId}')" title="Edit card">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn edit-control" onclick="deleteCard('${cardId}')" title="Delete card">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Add highlight animation
    cardElement.classList.add('highlight-new');
    setTimeout(() => {
        cardElement.classList.remove('highlight-new');
    }, 2000);
}

// Helper function to get card index by ID
function getCardIndex(cardId) {
    if (!allCards || !allCards.length) return 0;
    const index = allCards.findIndex(card => card.id === cardId);
    return index >= 0 ? index : 0;
}

// Function to show Add/Create Subtopic Modal
function showAddSubtopicModal(parentTopic) {
    if (!checkEditAccess()) {
        showEditPasswordModal();
        return;
    }
    
    // If no modal exists, create one
    let addSubtopicModal = document.getElementById('addSubtopicModal');
    if (!addSubtopicModal) {
        addSubtopicModal = document.createElement('div');
        addSubtopicModal.id = 'addSubtopicModal';
        addSubtopicModal.className = 'modal';
        
        // Create modal content
        addSubtopicModal.innerHTML = `
            <div class="modal-content">
                <span class="close" id="addSubtopicClose">&times;</span>
                <h2>Add New Subtopic</h2>
                <p>Enter a name for the new subtopic:</p>
                <form id="addSubtopicForm">
                    <input type="hidden" id="parentTopicInput" value="">
                    <div class="form-group">
                        <label for="subtopicName">Subtopic Name</label>
                        <input type="text" id="subtopicName" placeholder="Enter subtopic name" required>
                    </div>
                    <button type="submit" class="login-submit">Add Subtopic</button>
                </form>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(addSubtopicModal);
        
        // Add close handler
        document.getElementById('addSubtopicClose').onclick = function() {
            addSubtopicModal.style.display = 'none';
        };
        
        // Handle clicks outside modal
        window.addEventListener('click', function(event) {
            if (event.target == addSubtopicModal) {
                addSubtopicModal.style.display = 'none';
            }
        });
        
        // Handle form submission
        document.getElementById('addSubtopicForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const parentTopic = document.getElementById('parentTopicInput').value;
            const subtopicName = document.getElementById('subtopicName').value;
            
            // Validate
            if (!subtopicName) {
                alert('Please enter a subtopic name.');
                return;
            }
            
            // Show loading
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Adding...';
            submitBtn.disabled = true;
            
            // Create subtopic
            createSubtopic(currentSubject, parentTopic, subtopicName)
                .then(() => {
                    // Reset form and hide modal
                    e.target.reset();
                    addSubtopicModal.style.display = 'none';
                    
                    // Show success message
                    alert('Subtopic added successfully!');
                    
                    // Reload topics
                    loadTopicsWithHierarchy(currentSubject);
                })
                .catch(error => {
                    console.error('Error creating subtopic:', error);
                    alert('Error creating subtopic: ' + error.message);
                })
                .finally(() => {
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }
    
    // Set parent topic in form
    document.getElementById('parentTopicInput').value = parentTopic || '';
    
    // Update modal title and description based on whether we're adding a subtopic
    const modalTitle = addSubtopicModal.querySelector('h2');
    const modalDescription = addSubtopicModal.querySelector('p');
    
    if (parentTopic) {
        modalTitle.textContent = 'Add New Subtopic';
        modalDescription.textContent = `Enter a name for the new subtopic under "${parentTopic}":`;
    } else {
        modalTitle.textContent = 'Add New Topic';
        modalDescription.textContent = 'Enter a name for the new topic:';
    }
    
    // Show the modal
    addSubtopicModal.style.display = 'block';
    document.getElementById('subtopicName').focus();
}

// Function to hide Add Subtopic modal
function hideAddSubtopicModal() {
    const addSubtopicModal = document.getElementById('addSubtopicModal');
    if (addSubtopicModal) {
        addSubtopicModal.style.display = 'none';
    }
}

// Function to show delete topic dialog
function showDeleteTopicDialog(subject, topicName) {
    // Check edit access
    if (!checkEditAccess()) {
        showEditPasswordModal();
        return;
    }
    
    // Create the dialog if it doesn't exist
    let deleteTopicDialog = document.getElementById('deleteTopicDialog');
    let confirmationOverlay = document.getElementById('confirmationOverlay');
    
    if (!deleteTopicDialog) {
        // Create dialog
        deleteTopicDialog = document.createElement('div');
        deleteTopicDialog.id = 'deleteTopicDialog';
        deleteTopicDialog.className = 'confirmation-dialog';
        deleteTopicDialog.innerHTML = `
            <h3>Delete Topic?</h3>
            <p>Are you sure you want to delete this topic and all its cards? This action cannot be undone.</p>
            <input type="hidden" id="deleteTopicSubject">
            <input type="hidden" id="deleteTopicName">
            <div class="actions">
                <button class="cancel-btn" onclick="closeDeleteTopicDialog()">Cancel</button>
                <button class="confirm-btn" onclick="executeDeleteTopic()">Delete</button>
            </div>
        `;
        document.body.appendChild(deleteTopicDialog);
        
        // Create overlay
        confirmationOverlay = document.createElement('div');
        confirmationOverlay.id = 'confirmationOverlay';
        confirmationOverlay.className = 'confirmation-overlay';
        document.body.appendChild(confirmationOverlay);
        
        // Add event listener for overlay click
        confirmationOverlay.addEventListener('click', closeDeleteTopicDialog);
    }
    
    // Set delete topic details
    document.getElementById('deleteTopicSubject').value = subject;
    document.getElementById('deleteTopicName').value = topicName;
    
    // Update dialog text
    const dialogMessage = document.querySelector('#deleteTopicDialog p');
    dialogMessage.textContent = `Are you sure you want to delete the topic "${topicName}" and all its cards? This action cannot be undone.`;
    
    // Show dialog and overlay
    deleteTopicDialog.style.display = 'block';
    confirmationOverlay.style.display = 'block';
}

// Function to close delete topic dialog
function closeDeleteTopicDialog() {
    const deleteTopicDialog = document.getElementById('deleteTopicDialog');
    const confirmationOverlay = document.getElementById('confirmationOverlay');
    
    if (deleteTopicDialog) deleteTopicDialog.style.display = 'none';
    if (confirmationOverlay) confirmationOverlay.style.display = 'none';
}

// Function to execute topic deletion
function executeDeleteTopic() {
    const subject = document.getElementById('deleteTopicSubject').value;
    const topicName = document.getElementById('deleteTopicName').value;
    
    // Close dialog
    closeDeleteTopicDialog();
    
    // Delete topic
    deleteTopic(subject, topicName)
        .then(success => {
            if (success) {
                alert(`Topic "${topicName}" and all its cards have been deleted.`);
                
                // Reload topics or redirect as appropriate
                if (window.location.href.includes('card-viewer.html') && 
                    window.location.href.includes(`topic=${encodeURIComponent(topicName)}`)) {
                    // If we're currently viewing the deleted topic, go back to folder view
                    window.location.href = `card-viewer.html?folder=${encodeURIComponent(subject)}`;
                } else if (typeof loadTopicsWithHierarchy === 'function') {
                    // If we're in the folder view, reload topics
                    loadTopicsWithHierarchy(subject);
                } else if (typeof loadTopics === 'function') {
                    // Fallback to original loadTopics if available
                    loadTopics(subject);
                } else {
                    // Last resort: reload the page
                    location.reload();
                }
            }
        })
        .catch(error => {
            console.error('Error deleting topic:', error);
            alert('Error deleting topic: ' + error.message);
        });
}

// Enhanced loadTopicsWithHierarchy implementation
function loadTopicsWithHierarchy(subject) {
    const topicsContainer = document.getElementById('topicsContainer');
    const cardContainer = document.getElementById('cardContainer');
    const noTopicsMessage = document.getElementById('noTopicsMessage');
    const cardNavigation = document.getElementById('cardNavigation');
    
    // Hide cards container and navigation, show topics container
    if (cardContainer) cardContainer.style.display = 'none';
    if (cardNavigation) cardNavigation.style.display = 'none';
    if (topicsContainer) topicsContainer.style.display = 'block';
    
    // Show loading message
    if (topicsContainer) {
        topicsContainer.innerHTML = '<div class="loading-message">Loading topics...</div>';
    }
    
    // Get topics with card counts
    getTopicsWithCounts(subject)
        .then(([topics, cardCounts]) => {
            console.log("Loaded topics with counts:", topics, cardCounts);
            
            // Update statistics
            updateStatistics(topics, cardCounts);
            
            // Clear loading message
            if (topicsContainer) {
                topicsContainer.innerHTML = '';
            }
            
            if (topics.length === 0) {
                // Show no topics message
                if (noTopicsMessage) {
                    noTopicsMessage.style.display = 'block';
                }
            } else {
                // Hide no topics message
                if (noTopicsMessage) {
                    noTopicsMessage.style.display = 'none';
                }
                
                // Organize topics into a hierarchy
                const topicHierarchy = organizeTopicsHierarchy(topics, cardCounts);
                
                // Render the topic hierarchy
                renderTopicHierarchy(topicHierarchy, topicsContainer);
            }
            
            // Check if edit mode is active
            if (checkEditAccess()) {
                enableEditControls();
            }
        })
        .catch(error => {
            console.error('Error loading topics:', error);
            if (topicsContainer) {
                topicsContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error loading topics</h3>
                        <p>There was a problem loading topics. Please try again later.</p>
                        <p>Error details: ${error.message}</p>
                    </div>
                `;
            }
        });
}

// Function to organize topics into a hierarchy
function organizeTopicsHierarchy(topics, cardCounts) {
    const mainTopics = [];
    const subtopicMap = {};
    
    // First pass: Separate main topics and create subtopic map
    topics.forEach(topic => {
        const topicPath = topic.name;
        const pathParts = topicPath.split('/');
        
        if (pathParts.length === 1) {
            // This is a main topic
            mainTopics.push({
                ...topic,
                displayName: topicPath,
                cardCount: cardCounts[topicPath] || 0,
                subtopics: []
            });
        } else {
            // This is a subtopic
            const parentPath = pathParts.slice(0, -1).join('/');
            const displayName = pathParts[pathParts.length - 1];
            
            if (!subtopicMap[parentPath]) {
                subtopicMap[parentPath] = [];
            }
            
            subtopicMap[parentPath].push({
                ...topic,
                displayName: displayName,
                cardCount: cardCounts[topicPath] || 0,
                subtopics: []
            });
        }
    });
    
    // Second pass: Build hierarchy by attaching subtopics to parents
    function attachSubtopics(topicsList) {
        topicsList.forEach(topic => {
            if (subtopicMap[topic.name]) {
                topic.subtopics = subtopicMap[topic.name];
                // Recursively process deeper levels
                attachSubtopics(topic.subtopics);
            }
        });
    }
    
    // Attach subtopics starting from main topics
    attachSubtopics(mainTopics);
    
    return mainTopics;
}

// Function to render the topic hierarchy
function renderTopicHierarchy(topics, container, level = 0) {
    topics.forEach(topic => {
        // Create topic element
        const topicElement = document.createElement('div');
        topicElement.className = 'folder-item topic-folder';
        if (topic.subtopics && topic.subtopics.length > 0) {
            topicElement.classList.add('has-subtopics');
        }
        
        // Set data attributes
        topicElement.setAttribute('data-topic-id', topic.id);
        topicElement.setAttribute('data-topic-name', topic.name);
        
        // Set indentation based on level
        if (level > 0) {
            topicElement.style.marginLeft = `${level * 20}px`;
        }
        
        // Handle click to open topic
        topicElement.onclick = function(e) {
            // Only navigate if we didn't click a button
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                window.location.href = `card-viewer.html?folder=${encodeURIComponent(currentSubject)}&topic=${encodeURIComponent(topic.name)}`;
            }
        };
        
        // Create topic content
        topicElement.innerHTML = `
            <div class="folder-icon">
                <i class="${topic.subtopics && topic.subtopics.length > 0 ? 'fas fa-folder-open' : 'fas fa-folder'}"></i>
                <span class="topic-card-count">${topic.cardCount}</span>
            </div>
            <div class="folder-content">
                <h3>${escapeHtml(topic.displayName)}</h3>
                <span class="card-count">${topic.cardCount} card${topic.cardCount !== 1 ? 's' : ''}</span>
                <a href="#" class="folder-link">Open Topic</a>
            </div>
            <div class="topic-actions">
                <button class="add-subtopic-btn edit-control disabled" onclick="showAddSubtopicModal('${topic.name}'); event.stopPropagation();" disabled title="Add Subtopic">
                    <i class="fas fa-folder-plus"></i>
                </button>
                <button class="delete-topic-btn edit-control disabled" onclick="showDeleteTopicDialog('${currentSubject}', '${topic.name}'); event.stopPropagation();" disabled title="Delete Topic">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Add topic to container
        container.appendChild(topicElement);
        
        // If topic has subtopics, add them recursively
        if (topic.subtopics && topic.subtopics.length > 0) {
            const subtopicsContainer = document.createElement('div');
            subtopicsContainer.className = 'subtopics-container';
            container.appendChild(subtopicsContainer);
            
            // Add subtopics recursively
            renderTopicHierarchy(topic.subtopics, subtopicsContainer, level + 1);
        }
    });
}

// Function to update statistics display
function updateStatistics(topics, cardCounts) {
    // Check if the statistics elements exist
    const totalTopicsElement = document.getElementById('totalTopicsCount');
    const totalCardsElement = document.getElementById('totalCardsCount');
    const avgCardsPerTopicElement = document.getElementById('avgCardsPerTopic');
    
    if (!totalTopicsElement || !totalCardsElement || !avgCardsPerTopicElement) {
        return;
    }
    
    const totalTopics = topics.length;
    const totalCards = Object.values(cardCounts).reduce((sum, count) => sum + count, 0);
    const avgCardsPerTopic = totalTopics > 0 ? (totalCards / totalTopics).toFixed(1) : 0;
    
    totalTopicsElement.textContent = totalTopics;
    totalCardsElement.textContent = totalCards;
    avgCardsPerTopicElement.textContent = avgCardsPerTopic;
}
document.addEventListener('DOMContentLoaded', function() {
    // Create hamburger button if it doesn't exist yet
    if (!document.querySelector('.hamburger-menu')) {
        const headerContent = document.querySelector('.header-content');
        const nav = document.querySelector('nav');
        
        // Create hamburger button
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.className = 'hamburger-menu';
        hamburgerBtn.setAttribute('aria-label', 'Toggle navigation menu');
        hamburgerBtn.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Insert hamburger button before nav
        headerContent.insertBefore(hamburgerBtn, nav);
    }
    
    // Get hamburger button and nav elements
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('nav');
    
    // Toggle navigation menu when hamburger is clicked
    hamburgerBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
        
        // Change icon based on menu state
        const icon = hamburgerBtn.querySelector('i');
        if (nav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = nav.contains(event.target);
        const isClickOnHamburger = hamburgerBtn.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnHamburger && nav.classList.contains('active')) {
            nav.classList.remove('active');
            const icon = hamburgerBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Close menu when clicking on a nav link
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                nav.classList.remove('active');
                const icon = hamburgerBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });
    
    // Close menu when window is resized above mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && nav.classList.contains('active')) {
            nav.classList.remove('active');
            const icon = hamburgerBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
});