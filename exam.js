// Exam related variables
let currentQuestionIndex = 0;
let questions = [];
let answers = [];
let examDuration = 120 * 60; // 120 minutes in seconds
let timerInterval;
let timeLeft = examDuration;
let examStarted = false;
let examEnded = false;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    document.getElementById('next-btn').addEventListener('click', goToNextQuestion);
    document.getElementById('prev-btn').addEventListener('click', goToPreviousQuestion);
    document.getElementById('submit-btn').addEventListener('click', showSubmitModal);
    document.getElementById('close-modal').addEventListener('click', hideSubmitModal);
    document.getElementById('cancel-submit').addEventListener('click', hideSubmitModal);
    document.getElementById('confirm-submit').addEventListener('click', submitExam);
    document.getElementById('question-jump-btn').addEventListener('click', jumpToQuestion);
    document.getElementById('start-exam-btn').addEventListener('click', () => {
        enterFullscreen(); // Moved here to meet user gesture requirement
        showCountdown();
    });
    
    // Get the subject parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const subjectFromUrl = urlParams.get('subject');
    
    // If no subject in URL, check localStorage, otherwise default to 'Geodesy'
    const examSubject = subjectFromUrl || localStorage.getItem('selectedSubject') || 'Geodesy';
    
    // Save to localStorage for persistence
    localStorage.setItem('selectedSubject', examSubject);
    
    // Update all subject displays
    updateSubjectDisplays(examSubject);
    
    // Load questions from database
    loadQuestions();
});

// Function to update all subject displays
function updateSubjectDisplays(subject) {
    // Update instruction subject
    const instructionSubjectElems = document.querySelectorAll('.subject-display');
    instructionSubjectElems.forEach(elem => {
        elem.textContent = subject;
    });
    
    // Update specific elements
    document.getElementById('instruction-subject').textContent = subject;
    document.getElementById('instruction-subject-value').textContent = subject;
    document.getElementById('exam-subject').textContent = `Subject: ${subject}`;
}

// Show countdown after instructions
function showCountdown() {
    // Hide instructions modal
    document.getElementById('instructions-modal').classList.remove('active');
    
    // Reset loading progress animation
    const loadingProgress = document.getElementById('loading-progress');
    if (loadingProgress) {
        loadingProgress.style.animation = 'none';
        void loadingProgress.offsetWidth; // Force reflow
        loadingProgress.style.animation = 'progress 10s linear forwards';
    }
    
    // Show countdown overlay
    const countdownOverlay = document.getElementById('countdown-overlay');
    countdownOverlay.style.display = 'flex';
    
    // Start countdown
    startCountdown();
}

// Start countdown before exam
function startCountdown() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    const loadingStatusText = document.getElementById('loading-status-text');
    
    // Starting countdown number
    let count = 10;
    countdownNumber.textContent = count;
    
    // Status messages to cycle through
    const statusMessages = [
        'Loading and shuffling questions...',
        'Preparing exam materials...',
        'Organizing subject-specific content...',
        'Randomizing question order...',
        'Setting up timer and navigation...',
        'Finalizing exam preparation...'
    ];
    
    // Update status message
    let messageIndex = 0;
    
    // Set initial message
    loadingStatusText.textContent = statusMessages[messageIndex];
    loadingStatusText.style.width = '0';
    void loadingStatusText.offsetWidth; // Force reflow
    loadingStatusText.classList.add('typing-animation');
    
    // Change status message every 4.5 seconds
    const statusInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % statusMessages.length;
        loadingStatusText.textContent = statusMessages[messageIndex];
        loadingStatusText.style.width = '0';
        void loadingStatusText.offsetWidth; // Force reflow
        loadingStatusText.classList.remove('typing-animation');
        void loadingStatusText.offsetWidth; // Force reflow
        loadingStatusText.classList.add('typing-animation');
    }, 4500);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
        count--;
        countdownNumber.textContent = count;
        
        // Add pulse effect when count is low
        if (count <= 3) {
            countdownNumber.style.animation = 'pulse 0.5s infinite';
        }
        
        if (count <= 0) {
            // Clear intervals
            clearInterval(countdownInterval);
            clearInterval(statusInterval);
            
            // Hide countdown overlay and start exam
            countdownOverlay.style.display = 'none';
            startExam();
        }
    }, 1000);
    
    // Random movement of blurred question cards in background
    animateBackgroundCards();
}

// Function to animate background cards for a shuffling effect
function animateBackgroundCards() {
    const cards = document.querySelectorAll('.bg-question-card');
    
    cards.forEach(card => {
        // Set initial random position
        const randomX = Math.random() * 20 - 10;
        const randomY = Math.random() * 20 - 10;
        const randomRotate = Math.random() * 10 - 5;
        
        // Apply animation
        setInterval(() => {
            const newX = Math.random() * 20 - 10;
            const newY = Math.random() * 20 - 10;
            const newRotate = Math.random() * 10 - 5;
            
            card.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px)) rotate(calc(var(--rotation) + ${newRotate}deg))`;
        }, 2000);
    });
}

// Start the exam
function startExam() {
    examStarted = true;
    startTimer();
    
    // Initialize answers array with null values
    for (let i = 0; i < questions.length; i++) {
        answers.push(null);
    }
    
    // Display first question
    displayQuestion(0);
}

// Enter fullscreen mode - simplified and more reliable
function enterFullscreen() {
    // Request fullscreen on the document element
    const elem = document.documentElement;
    
    try {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
        
        // Add fullscreen class to body when successful
        setTimeout(() => {
            if (document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.mozFullScreenElement || 
                document.msFullscreenElement) {
                document.body.classList.add('fullscreen-mode');
                console.log("Fullscreen mode activated");
            } else {
                console.log("Failed to enter fullscreen mode");
                // If fullscreen failed, at least apply the styling
                document.body.classList.add('fullscreen-mode');
            }
        }, 100);
        
    } catch (err) {
        console.error("Error attempting to enable fullscreen:", err.message);
        // If error occurs, still apply fullscreen styling
        document.body.classList.add('fullscreen-mode');
    }
    
    // Add fullscreen change listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

// Handle fullscreen change
function handleFullscreenChange() {
    if (examStarted && !examEnded) {
        // Check if we're no longer in fullscreen
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            
            // If exam is active and user exits fullscreen
            const confirmExit = confirm("WARNING: You are attempting to exit fullscreen mode. This may be considered as cheating. Continue in windowed mode?");
            
            if (!confirmExit) {
                // User wants to return to fullscreen
                setTimeout(() => {
                    enterFullscreen();
                }, 100);
            } else {
                // User confirmed exit, but keep fullscreen styling
                document.body.classList.add('fullscreen-mode');
            }
        } else {
            // We are in fullscreen, ensure styling is applied
            document.body.classList.add('fullscreen-mode');
        }
    }
}

// Start the timer
function startTimer() {
    const timerElement = document.getElementById('exam-timer');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        
        // Format time
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Warning when less than 30 minutes left
        if (timeLeft <= 30 * 60 && timeLeft > 10 * 60) {
            timerElement.classList.add('warning');
        }
        
        // Danger when less than 10 minutes left
        if (timeLeft <= 10 * 60) {
            timerElement.classList.remove('warning');
            timerElement.classList.add('danger');
        }
        
        // Time's up
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time\'s up! Your exam will be submitted automatically.');
            submitExam();
        }
    }, 1000);
}

// Load questions from Firebase
function loadQuestions() {
    // Show loading spinner
    document.getElementById('loading-questions').style.display = 'flex';
    document.getElementById('question-content').style.display = 'none';
    
    // Get the subject from URL parameter, then localStorage, then default to 'Geodesy'
    const urlParams = new URLSearchParams(window.location.search);
    const examSubject = urlParams.get('subject') || localStorage.getItem('selectedSubject') || 'Geodesy';
    
    // Update all subject displays to ensure consistency
    updateSubjectDisplays(examSubject);
    
    // Query Firestore for questions in this subject
    const db = firebase.firestore();
    const questionsCollection = db.collection('questions');
    questionsCollection.where('subject', '==', examSubject)
        .limit(80) // Limit to 80 questions for the exam
        .get()
        .then((querySnapshot) => {
            console.log(`Found ${querySnapshot.size} questions for subject: ${examSubject}`);
            // Check if we have enough questions
            if (querySnapshot.size === 0) {
                alert('No questions found for this subject. Please try another subject.');
                window.location.href = 'index.html';
                return;
            }
            
            // Convert query results to array
            questions = [];
            querySnapshot.forEach((doc) => {
                const questionData = doc.data();
                // Console log to inspect Firestore data
                console.log("Question document data:", questionData);
                // Add document ID to each question
            const originalOptionsCopy = [...(questionData.options || [])];
            const shuffledOptions = shuffleArray([...originalOptionsCopy]);
            questions.push({
                id: doc.id,
                subject: questionData.subject,
                topic: questionData.topic,
                text: questionData.question,
                options: shuffledOptions,
                originalOptions: originalOptionsCopy,
                correctAnswer: questionData.correctAnswer,
                explanation: questionData.explanation || '',
                image: questionData.imageUrl || null,
                // Add sequenced fields if present in Firestore
                isSequenced: questionData.isSequenced || false,
                sequenceGroup: questionData.sequenceGroup || null,
                sequenceOrder: questionData.sequenceOrder
            });
            });

            // Insert sequenced question grouping and ordering logic here
            console.log("Processing sequenced questions...");
            let sequenceGroups = {};
            let nonSequencedQuestions = [];

            questions.forEach(question => {
                if (question.isSequenced && question.sequenceGroup) {
                    if (!sequenceGroups[question.sequenceGroup]) {
                        sequenceGroups[question.sequenceGroup] = [];
                    }
                    sequenceGroups[question.sequenceGroup].push(question);
                } else {
                    nonSequencedQuestions.push(question);
                }
            });

            Object.keys(sequenceGroups).forEach(groupId => {
                sequenceGroups[groupId].sort((a, b) => {
                    const orderA = a.sequenceOrder !== undefined ? a.sequenceOrder : 999;
                    const orderB = b.sequenceOrder !== undefined ? b.sequenceOrder : 999;
                    return orderA - orderB;
                });
                console.log(`Sequence group ${groupId} has ${sequenceGroups[groupId].length} questions`);
            });

            nonSequencedQuestions = shuffleArray(nonSequencedQuestions);
            console.log(`${nonSequencedQuestions.length} non-sequenced questions after shuffle`);

            questions = [];
            Object.values(sequenceGroups).forEach(group => {
                questions = questions.concat(group);
            });
            questions = questions.concat(nonSequencedQuestions);
            console.log(`Total of ${questions.length} questions (sequenced + non-sequenced)`);

            // Limit to 80 questions if we have more
            if (questions.length > 80) {
                questions = questions.slice(0, 80);
            }

            // Update total questions display
            document.getElementById('total-questions').textContent = questions.length;

            // Hide spinner
            document.getElementById('loading-questions').style.display = 'none';
            document.getElementById('question-content').style.display = 'block';

            // Update exam subject one more time to be sure
            document.getElementById('exam-subject').textContent = `Subject: ${examSubject}`;

            // Initialize answers array
            answers = new Array(questions.length).fill(null);

            // Start displaying the first question
            displayQuestion(0);
        })
        .catch((error) => {
            console.error("Error loading questions: ", error);
            alert('Error loading questions. Please try again later.');
            // Redirect to index page on error
            window.location.href = 'index.html';
        });
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Display current question
function displayQuestion(index) {
    if (!questions.length) return;

    const question = questions[index];
    currentQuestionIndex = index;

    // Update question number
    document.getElementById('question-number').textContent = `Question ${index + 1} of ${questions.length}`;

    // Update question topic
    document.getElementById('question-topic').textContent = question.topic;

    // Update question text with fallback for different field names
    document.getElementById('question-text').textContent =
        question.text || question.questionText || question.question || question.question_text || "Question not available.";

    // Display question image if available
    const imageContainer = document.getElementById('question-image-container');
    const questionImage = document.getElementById('question-image');

    if (question.image) {
        questionImage.src = question.image;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }

    // Display sequence badge if sequenced
    const sequenceBadge = document.getElementById('sequence-badge');
    if (question.isSequenced && question.sequenceGroup) {
        if (sequenceBadge) {
            sequenceBadge.style.display = 'inline-block';
            sequenceBadge.textContent = `Sequence: ${question.sequenceGroup}`;
        }
    } else {
        if (sequenceBadge) sequenceBadge.style.display = 'none';
    }

    // Generate options
    generateOptions(question.options, index);

    // Update navigation buttons
    document.getElementById('prev-btn').disabled = index === 0;

    // Show both next and submit buttons on all questions
    document.getElementById('next-btn').style.display = index === questions.length - 1 ? 'none' : 'flex';
    document.getElementById('submit-btn').style.display = 'flex';

    // Highlight navigation for sequenced questions
    const navList = document.getElementById('question-nav-list');
    if (navList) {
        // Remove all highlights
        Array.from(navList.children).forEach((li, idx) => {
            li.classList.remove('sequenced-highlight');
            li.classList.remove('current-question');
            // Highlight if this is the current question
            if (idx === index) li.classList.add('current-question');
            // Highlight sequenced questions
            if (questions[idx].isSequenced && questions[idx].sequenceGroup) {
                li.classList.add('sequenced-highlight');
            }
        });
    }

    // Update progress
    updateProgress();
}

// Generate answer options
function generateOptions(options, questionIndex) {
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    options.forEach((option, index) => {
        const optionItem = document.createElement('li');
        optionItem.className = 'option-item';
        
        // Add selected class if this option is selected
        if (answers[questionIndex] === index) {
            optionItem.classList.add('selected');
        }
        
        optionItem.innerHTML = `
            <div class="option-label">${optionLetters[index]}</div>
            <div class="option-text">${option}</div>
        `;
        
        // Add click event listener
        optionItem.addEventListener('click', () => selectOption(questionIndex, index));
        optionsList.appendChild(optionItem);
    });
}

// Handle option selection
function selectOption(questionIndex, optionIndex) {
    // Update answers array
    answers[questionIndex] = optionIndex;

    // Update UI to show selected option
    const optionItems = document.querySelectorAll('.option-item');
    optionItems.forEach(item => item.classList.remove('selected'));
    optionItems[optionIndex].classList.add('selected');

    // Update progress
    updateProgress();

    // Auto-advance for sequenced questions in a group, otherwise normal delay
    const question = questions[questionIndex];
    let delay = 800;
    if (question.isSequenced && question.sequenceGroup) {
        delay = 350;
    }
    if (questionIndex < questions.length - 1) {
        setTimeout(() => {
            goToNextQuestion();
        }, delay);
    }
}

// Go to next question
function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        displayQuestion(currentQuestionIndex + 1);
    }
}

// Go to previous question
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        displayQuestion(currentQuestionIndex - 1);
    }
}

// Jump to specific question
function jumpToQuestion() {
    const inputElement = document.getElementById('question-jump-input');
    const questionNumber = parseInt(inputElement.value);
    
    if (questionNumber >= 1 && questionNumber <= questions.length) {
        displayQuestion(questionNumber - 1);
        inputElement.value = '';
    } else {
        alert(`Please enter a valid question number between 1 and ${questions.length}.`);
    }
}

// Update progress indicators
function updateProgress() {
    const answeredCount = answers.filter(a => a !== null).length;
    const percentage = Math.round((answeredCount / questions.length) * 100);
    
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('answered-percentage').textContent = `${percentage}%`;
    document.getElementById('exam-progress').style.width = `${percentage}%`;
}

// Show submit modal
function showSubmitModal() {
    const unansweredCount = answers.filter(a => a === null).length;
    const modalMessage = document.getElementById('unanswered-questions');
    
    if (unansweredCount > 0) {
        modalMessage.textContent = `You have ${unansweredCount} unanswered questions. Are you sure you want to proceed?`;
    } else {
        modalMessage.textContent = 'You have answered all questions. Ready to submit?';
    }
    
    document.getElementById('submit-modal').classList.add('active');
}

// Hide submit modal
function hideSubmitModal() {
    document.getElementById('submit-modal').classList.remove('active');
}

// Exit fullscreen mode
function exitFullscreen() {
    // Remove event listeners for fullscreen changes
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Remove fullscreen styling
    document.body.classList.remove('fullscreen-mode');
    
    // Exit fullscreen
    try {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    } catch (err) {
        console.error("Error exiting fullscreen:", err);
    }
}

// Submit exam
function submitExam() {
    // Clear timer
    clearInterval(timerInterval);
    examEnded = true;
    
    // Exit fullscreen
    exitFullscreen();
    
    // Calculate results
    const results = calculateResults();
    
    // Save results to localStorage
    localStorage.setItem('examResults', JSON.stringify(results));
    
    // Start confetti animation
    startConfetti();
    
    // Hide modal
    hideSubmitModal();
    
    // Redirect to results page after delay to show confetti
    setTimeout(() => {
        window.location.href = 'result.html';
    }, 3000); // 3 seconds delay to show confetti
}

// Confetti animation function
function startConfetti() {
    // Create canvas element for confetti
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1000';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Confetti particles
    const particles = [];
    const particleCount = 200;
    const gravity = 0.5;
    const colors = [
        '#3498db', // Blue
        '#2ecc71', // Green
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#9b59b6', // Purple
        '#1abc9c', // Teal
        '#f1c40f'  // Yellow
    ];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            radius: Math.random() * 4 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            velocity: {
                x: Math.random() * 6 - 3,
                y: Math.random() * 3 + 2
            },
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            shape: Math.random() > 0.5 ? 'circle' : 'rect'
        });
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let remainingParticles = 0;
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            ctx.save();
            ctx.beginPath();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            
            ctx.fillStyle = p.color;
            
            if (p.shape === 'circle') {
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            } else {
                ctx.rect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
            }
            
            ctx.fill();
            ctx.closePath();
            ctx.restore();
            
            // Update position
            p.x += p.velocity.x;
            p.y += p.velocity.y;
            
            // Add gravity
            p.velocity.y += gravity;
            
            // Rotate
            p.rotation += p.rotationSpeed;
            
            // Check if particle is still visible
            if (p.y < canvas.height + p.radius) {
                remainingParticles++;
            }
        }
        
        // Continue animation if particles are still visible
        if (remainingParticles > 0) {
            requestAnimationFrame(animate);
        } else {
            // Remove canvas when done
            document.body.removeChild(canvas);
        }
    }
    
    // Start animation
    animate();
}

// Calculate exam results
function calculateResults() {
    // Define option letters for conversion
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
    
    // Calculate correct answers
    let correctCount = 0;
    let topicPerformance = {};
    let sequencePerformance = {};

    for (let i = 0; i < questions.length; i++) {
        const userAnswer = answers[i]; // This is a numeric index (0, 1, 2, 3)
        const question = questions[i];
        const topic = question.topic;

        // Improved correctAnswer index calculation
        let correctAnswerIndex;
        const originalOptions = question.originalOptions || [];
        let correctValue = typeof question.correctAnswer === 'number'
            ? (originalOptions[question.correctAnswer] || question.options[question.correctAnswer])
            : question.correctAnswer;
        correctAnswerIndex = question.options.findIndex(opt => opt === correctValue);

        // Topic-based performance
        if (!topicPerformance[topic]) {
            topicPerformance[topic] = {
                correct: 0,
                total: 0,
                percentage: 0
            };
        }
        topicPerformance[topic].total++;

        // Now compare user answer index with correct answer index
        const isCorrect = userAnswer === correctAnswerIndex;
        if (isCorrect) {
            correctCount++;
            topicPerformance[topic].correct++;
        }

        // Sequence group performance
        if (question.isSequenced && question.sequenceGroup) {
            const group = question.sequenceGroup;
            if (!sequencePerformance[group]) {
                sequencePerformance[group] = {
                    correct: 0,
                    total: 0,
                    percentage: 0,
                    topic: topic // Store topic for reference
                };
            }
            sequencePerformance[group].total++;
            if (isCorrect) {
                sequencePerformance[group].correct++;
            }
        }
    }

    // Calculate percentages for each topic
    for (const topic in topicPerformance) {
        const { correct, total } = topicPerformance[topic];
        topicPerformance[topic].percentage = Math.round((correct / total) * 100);
    }
    // Calculate percentages for each sequence group
    for (const group in sequencePerformance) {
        const { correct, total } = sequencePerformance[group];
        sequencePerformance[group].percentage = Math.round((correct / total) * 100);
    }

    // Get the actual subject from current questions, fallback to localStorage
    const examSubject = questions.length > 0 
        ? questions[0].subject 
        : localStorage.getItem('selectedSubject') || 'Geodesy';

    // Calculate overall score
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 70; // 70% passing score

    return {
        subject: examSubject,
        score,
        passed,
        timeSpent: examDuration - timeLeft,
        date: new Date().toISOString(),
        questions,
        answers,
        topicPerformance,
        sequencePerformance
    };
}