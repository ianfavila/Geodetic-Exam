// admin-protests.js
// Protest management functionality for the Geodetic Engineering Reviewer Admin Panel

function updateProtestTopicsBySubject() {
    const protestSubject = document.getElementById('protest-subject-filter');
    const protestTopic = document.getElementById('protest-topic-filter');
    
    if (!protestSubject || !protestTopic) {
        console.error("Subject/Topic dropdown not found (updateProtestTopicsBySubject)");
        return;
    }
    
    const selectedSubject = protestSubject.value;
    protestTopic.innerHTML = ''; // Clear
    
    if (!selectedSubject) {
        protestTopic.innerHTML = '<option value="">All Topics</option>';
        return;
    }
    
    protestTopic.innerHTML = '<option value="">All Topics</option>';
    const topics = topicsBySubject[selectedSubject] || [];
    
    topics.forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic;
        opt.textContent = topic;
        protestTopic.appendChild(opt);
    });
}

function getProtestReasonDisplay(reasonCode) {
    const reasonMap = {
        'incorrect-answer': 'Incorrect Answer Key',
        'multiple-answers': 'Multiple Correct Answers',
        'unclear-question': 'Unclear/Ambiguous Question',
        'outdated-content': 'Outdated Information',
        'factual-error': 'Factual Error',
        'other': 'Other'
    };
    
    return reasonMap[reasonCode] || reasonCode;
}

function openProtestDetailModal(id) {
    console.log(`Opening protest details for ID: ${id}`);
    
    try {
        const detailModal = document.getElementById('protest-detail-modal');
        if (!detailModal) {
            console.error("Protest detail modal not found");
            return;
        }
        
        // Store the protest ID on the modal for later use
        detailModal.setAttribute('data-id', id);
        
        // Get protest data from Firestore
        protestCollection.doc(id).get().then(doc => {
            if (!doc.exists) {
                alert('Protest not found!');
                return;
            }
            
            const data = doc.data();
            
            // Set values in the modal
            document.getElementById('protest-modal-title').textContent = 'Protest Details';
            document.getElementById('protest-author').textContent = data.name || 'Anonymous';
            document.getElementById('protest-date').textContent = formatDate(data.timestamp);
            document.getElementById('protest-subject').textContent = data.subject || 'No Subject';
            document.getElementById('protest-question-id').textContent = data.questionId || 'Not specified';
            document.getElementById('protest-reason').textContent = getProtestReasonDisplay(data.protestReason);
            document.getElementById('protest-explanation').textContent = data.explanation || '';
            document.getElementById('protest-correct-answer').textContent = data.correctAnswer || 'Not provided';
            document.getElementById('protest-references').textContent = data.references || 'None provided';
            
            // Set up buttons based on current status
            const approveBtn = document.getElementById('approve-protest-btn');
            const rejectBtn = document.getElementById('reject-protest-btn');
            const reasonContainer = document.getElementById('rejection-reason-container');
            
            if (data.status === 'pending') {
                approveBtn.style.display = 'inline-block';
                rejectBtn.style.display = 'inline-block';
                approveBtn.onclick = () => approveProtest(id);
                rejectBtn.onclick = () => {
                    reasonContainer.style.display = 'block';
                    rejectBtn.textContent = 'Confirm Rejection';
                    rejectBtn.onclick = () => rejectProtest(id);
                };
            } else {
                approveBtn.style.display = 'none';
                rejectBtn.style.display = 'none';
                
                // Show rejection reason if available
                if (data.status === 'rejected' && data.rejectionReason) {
                    reasonContainer.style.display = 'block';
                    document.getElementById('rejection-reason').value = data.rejectionReason;
                    document.getElementById('rejection-reason').disabled = true;
                } else {
                    reasonContainer.style.display = 'none';
                }
            }
            
            // Show the modal
            detailModal.classList.add('active');
        }).catch(error => {
            console.error("Error fetching protest:", error);
            alert(`Error loading protest: ${error.message}`);
        });
    } catch (e) {
        console.error("Error opening protest detail modal:", e);
    }
}

function closeProtestModal() {
    console.log("Closing Protest Modal");
    const protestModal = document.getElementById('protest-detail-modal');
    const reasonContainer = document.getElementById('rejection-reason-container');
    
    if(protestModal) {
        protestModal.classList.remove('active');
        if(reasonContainer) {
            reasonContainer.style.display = 'none';
            const reasonInput = document.getElementById('rejection-reason');
            if (reasonInput) {
                reasonInput.value = '';
                reasonInput.disabled = false;
            }
        }
    } else {
        console.error("Protest modal overlay not found when trying to close.");
    }
}

async function loadProtestsFromFirebase() {
    console.log("Loading protests from Firebase...");
    const protestList = document.getElementById('protest-tbody');
    
    if (!protestList) {
        console.error("Cannot find protest list container");
        return;
    }
    
    protestList.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading protests...</td></tr>';
    
    try {
        const subjectFilter = document.getElementById('protest-subject-filter')?.value;
        const topicFilter = document.getElementById('protest-topic-filter')?.value;
        const statusFilter = document.getElementById('protest-status-filter')?.value;
        const searchInput = document.getElementById('protest-search-input')?.value.toLowerCase().trim() || "";

        let query = protestCollection.orderBy('timestamp', 'desc');

        if (statusFilter) {
            query = query.where('status', '==', statusFilter);
        }
        
        if (subjectFilter) {
            query = query.where('subject', '==', subjectFilter);
        }
        
        if (topicFilter) {
            query = query.where('topic', '==', topicFilter);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            protestList.innerHTML = '<tr><td colspan="7" style="text-align: center;">No protests found.</td></tr>';
            return;
        }

        protestList.innerHTML = ''; // Clear loading message
        let protestCount = 1;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data) return;

            // Apply search filter
            if (searchInput && !(
                data.name?.toLowerCase().includes(searchInput) ||
                data.email?.toLowerCase().includes(searchInput) ||
                data.subject?.toLowerCase().includes(searchInput) ||
                data.questionId?.toLowerCase().includes(searchInput) ||
                data.explanation?.toLowerCase().includes(searchInput)
            )) {
                return; // Skip if doesn't match search
            }

            // Get proper display name for reason code
            const reasonDisplay = getProtestReasonDisplay(data.protestReason);

            // Create protest table row
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', doc.id);
            tr.innerHTML = `
                <td>${protestCount}</td>
                <td>${data.questionId || 'N/A'}</td>
                <td>${data.name || 'Anonymous'}</td>
                <td>${data.subject || 'N/A'}</td>
                <td>${reasonDisplay}</td>
                <td>${data.status || 'pending'}</td>
                <td class="action-cell">
                    <button class="dashboard-button view-protest-btn"><i class="fas fa-eye"></i></button>
                    <button class="dashboard-button delete-protest-btn"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            // Add event listeners
            const viewBtn = tr.querySelector('.view-protest-btn');
            const deleteBtn = tr.querySelector('.delete-protest-btn');

            if (viewBtn) viewBtn.addEventListener('click', () => openProtestDetailModal(doc.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => deleteProtest(doc.id));

            protestList.appendChild(tr);
            protestCount++;
        });

        // If no rows matched after filtering
        if (protestList.children.length === 0) {
            if (searchInput) {
                protestList.innerHTML = '<tr><td colspan="7" style="text-align: center;">No protests match your search.</td></tr>';
            } else if (statusFilter || subjectFilter || topicFilter) {
                protestList.innerHTML = `<tr><td colspan="7" style="text-align: center;">No protests match the current filters.</td></tr>`;
            } else {
                protestList.innerHTML = '<tr><td colspan="7" style="text-align: center;">No protests found.</td></tr>';
            }
        }

    } catch (error) {
        console.error('Error loading protests:', error);
        protestList.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error loading protests: ${error.message}</td></tr>`;
    }
}

async function approveProtest(id) {
    console.log(`Approving protest: ${id}`);
    
    try {
        await protestCollection.doc(id).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Protest approved successfully!');
        closeProtestModal();
        loadProtestsFromFirebase(); // Refresh the list
        
    } catch (error) {
        console.error('Error approving protest:', error);
        alert(`Error approving protest: ${error.message}`);
    }
}

async function rejectProtest(id) {
    console.log(`Rejecting protest: ${id}`);
    
    try {
        const rejectionReason = document.getElementById('rejection-reason')?.value || '';
        
        await protestCollection.doc(id).update({
            status: 'rejected',
            rejectionReason: rejectionReason,
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Protest rejected successfully.');
        closeProtestModal();
        loadProtestsFromFirebase(); // Refresh the list
        
    } catch (error) {
        console.error('Error rejecting protest:', error);
        alert(`Error rejecting protest: ${error.message}`);
    }
}

async function deleteProtest(id) {
    console.log(`Attempting to delete protest: ${id}`);
    
    if (!confirm('Are you sure you want to delete this protest? This cannot be undone.')) {
        return;
    }
    
    try {
        await protestCollection.doc(id).delete();
        alert('Protest deleted successfully');
        loadProtestsFromFirebase(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting protest:', error);
        alert(`Error deleting protest: ${error.message}`);
    }
}

function searchProtests() {
    console.log("Protest search triggered.");
    loadProtestsFromFirebase();
}

// --- Protest Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Protest Tab Listeners ---
    try {
        const protestSubjectFilter = document.getElementById('protest-subject-filter');
        const protestTopicFilter = document.getElementById('protest-topic-filter');
        const protestStatusFilter = document.getElementById('protest-status-filter');
        const protestSearchInput = document.getElementById('protest-search-input');
        const protestSearchBtn = document.getElementById('protest-search-btn');
        
        if (protestSubjectFilter) {
            protestSubjectFilter.addEventListener('change', () => {
                updateProtestTopicsBySubject();
                searchProtests();
            });
        }
        
        if (protestTopicFilter) {
            protestTopicFilter.addEventListener('change', searchProtests);
        }
        
        if (protestStatusFilter) {
            protestStatusFilter.addEventListener('change', searchProtests);
        }
        
        if (protestSearchInput) {
            protestSearchInput.addEventListener('input', searchProtests);
        }
        
        if (protestSearchBtn) {
            protestSearchBtn.addEventListener('click', searchProtests);
        }
        
        console.log("Protest filter listeners attached.");
    } catch (e) {
        console.error("Error attaching protest filter listeners:", e);
    }

    // --- Protest Modal Listeners ---
    try {
        const closeProtestModalBtn = document.getElementById('close-protest-modal-btn');
        if(closeProtestModalBtn) {
            closeProtestModalBtn.addEventListener('click', closeProtestModal);
        }
        
        const closeProtestBtn = document.getElementById('close-protest-btn');
        if(closeProtestBtn) {
            closeProtestBtn.addEventListener('click', closeProtestModal);
        }
        
        const approveProtestBtn = document.getElementById('approve-protest-btn');
        if(approveProtestBtn) {
            approveProtestBtn.addEventListener('click', () => {
                const protestId = document.querySelector('#protest-detail-modal').getAttribute('data-id');
                if (protestId) {
                    approveProtest(protestId);
                }
            });
        }
        
        const rejectProtestBtn = document.getElementById('reject-protest-btn');
        if(rejectProtestBtn) {
            rejectProtestBtn.addEventListener('click', () => {
                const reasonContainer = document.getElementById('rejection-reason-container');
                if(reasonContainer) {
                    reasonContainer.style.display = 'block';
                    rejectProtestBtn.textContent = 'Confirm Rejection';
                    rejectProtestBtn.onclick = () => {
                        const protestId = document.querySelector('#protest-detail-modal').getAttribute('data-id');
                        if (protestId) {
                            rejectProtest(protestId);
                        }
                    };
                }
            });
        }

        console.log("Protest modal listeners attached.");
    } catch (e) {
        console.error("Error attaching protest modal listeners:", e);
    }

    // Load protests when protests tab is clicked
    document.querySelectorAll('.tab-nav .tab-item').forEach(tab => {
        if (tab.getAttribute('data-tab') === 'protests') {
            tab.addEventListener('click', () => {
                loadProtestsFromFirebase();
            });
        }
    });
});