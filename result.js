document.addEventListener('DOMContentLoaded', () => {
    // Get stored results
    const resultsJson = localStorage.getItem('examResults');
    
    if (!resultsJson) {
        alert('No exam results found. Please take an exam first.');
        window.location.href = 'index.html';
        return;
    }
    
    // Parse results and log for debugging
    console.log('Loading exam results from localStorage');
    const results = JSON.parse(resultsJson);
    console.log('Exam results loaded:', results);
    
    // Check for required data structure
    if (!results.questions || !Array.isArray(results.questions) || results.questions.length === 0) {
        console.error('Invalid exam results - no questions found:', results);
        
        // Display a user-friendly error message on the page instead of redirecting
        document.getElementById('results-section').innerHTML = `
            <div class="error-container">
                <h2>No Questions Found</h2>
                <p>There were no questions found for the subject: <strong>${results.subject || 'Unknown'}</strong></p>
                <p>Please try another subject with available questions.</p>
                <div class="action-buttons">
                    <a href="index.html" class="action-button secondary">
                        <i class="fas fa-home"></i> Return to Home
                    </a>
                    <a href="exam.html" class="action-button primary">
                        <i class="fas fa-redo"></i> Try Another Subject
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    // Log the first question for debugging
    console.log('First question:', results.questions[0]);
    
    // Initialize variables for review section
    let currentQuestionIndex = 0;
    
    // Initialize the page to show results section first
    initializeResultsSection(results);
    
    // Add event listeners for switching between results and review
    document.getElementById('review-answers-btn').addEventListener('click', () => {
        switchToReviewSection(results);
    });
    
    document.getElementById('back-to-results-btn').addEventListener('click', () => {
        switchToResultsSection();
    });
    
    // Debug button for developers - uncommenting during development allows you to see actual result data
    // addDebugButton(results);
});

// Helper function for formatting time
function formatTimeSpent(timeInSeconds) {
    if (!timeInSeconds && timeInSeconds !== 0) return '00:00:00';
    
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ========== RESULTS SECTION FUNCTIONS ==========

function initializeResultsSection(results) {
    // Check if we're in error mode
    if (document.querySelector('.error-container')) {
        return; // Already showing error, don't try to initialize
    }
    
    // Update score
    document.getElementById('score-value').textContent = `${Math.round(results.score)}%`;
    
    // Update pass/fail label
    const scoreLabel = document.getElementById('score-label');
    if (results.passed) {
        scoreLabel.textContent = 'PASSED';
        scoreLabel.className = 'score-label passed';
    } else {
        scoreLabel.textContent = 'FAILED';
        scoreLabel.className = 'score-label failed';
    }
    
    // Update exam details
    document.getElementById('exam-subject').textContent = results.subject;
    
    // Format and display time spent
    document.getElementById('time-spent').textContent = formatTimeSpent(results.timeSpent);
    
    // Update correct answers
    const totalQuestions = results.questions.length;
    const correctAnswers = results.questions.filter((q, i) => {
        const originalOptions = q.originalOptions || [];
        const correctValue = typeof q.correctAnswer === 'number'
            ? originalOptions[q.correctAnswer] || q.options[q.correctAnswer]
            : q.correctAnswer;
        const correctIndex = q.options.findIndex(opt => opt === correctValue);
        return Number(results.answers[i]) === correctIndex;
    }).length;
    document.getElementById('correct-answers').textContent = `${correctAnswers}/${totalQuestions}`;
    
    // Update exam date
    const examDate = results.date ? new Date(results.date) : new Date();
    document.getElementById('exam-date').textContent = examDate.toLocaleDateString();
    
    // Check if we have topic performance data
    if (results.topicPerformance && Object.keys(results.topicPerformance).length > 0) {
        generateTopicPerformance(results.topicPerformance);
    } else {
        // If no topic performance data, hide that section
        const topicPerformanceSection = document.querySelector('.topic-performance');
        if (topicPerformanceSection) {
            topicPerformanceSection.style.display = 'none';
        }
    }
    
    // Generate improvement tips
    generateImprovementTips(results);
}

function generateTopicPerformance(topicPerformance) {
    const topicList = document.getElementById('topic-list');
    if (!topicList) return;
    
    topicList.innerHTML = '';
    
    // Check if we have topic performance data
    if (!topicPerformance || Object.keys(topicPerformance).length === 0) {
        topicList.innerHTML = '<div class="error-message">No topic performance data available.</div>';
        return;
    }
    
    // Convert to array for sorting
    const topics = Object.keys(topicPerformance).map(topic => ({
        name: topic,
        ...topicPerformance[topic]
    }));
    
    // Sort by performance (lowest first)
    topics.sort((a, b) => a.percentage - b.percentage);
    
    topics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = 'topic-item';
        
        // Determine progress bar color
        let barColor = 'red';
        if (topic.percentage >= 70) {
            barColor = 'green';
        } else if (topic.percentage >= 50) {
            barColor = 'yellow';
        }
        
        topicItem.innerHTML = `
            <div class="topic-name">
                ${topic.name}
                <span class="topic-score">${topic.percentage}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${barColor}" style="width: ${topic.percentage}%"></div>
            </div>
            <div class="topic-details">
                <span>Correct: ${topic.correct}/${topic.total}</span>
            </div>
        `;
        
        topicList.appendChild(topicItem);
    });
}

function generateImprovementTips(results) {
    const tipsList = document.getElementById('tips-list');
    if (!tipsList) return;
    
    tipsList.innerHTML = '';
    
    // Handle case with no topic performance data
    if (!results.topicPerformance || Object.keys(results.topicPerformance).length === 0) {
        const tip = document.createElement('li');
        tip.className = 'tip-item';
        tip.textContent = "Make sure you have a stable internet connection for the best experience.";
        tipsList.appendChild(tip);
        
        const generalTip = document.createElement('li');
        generalTip.className = 'tip-item';
        generalTip.textContent = "Try another subject with available questions to test your knowledge.";
        tipsList.appendChild(generalTip);
        
        return;
    }
    
    // Get weakest topics (below 70%)
    const weakTopics = [];
    for (const [topic, data] of Object.entries(results.topicPerformance)) {
        if (data.percentage < 70) {
            weakTopics.push({ name: topic, percentage: data.percentage });
        }
    }
    
    // Sort by performance (lowest first)
    weakTopics.sort((a, b) => a.percentage - b.percentage);
    
    // Generate general tips
    const generalTips = [
        "Review the concepts thoroughly before your next attempt.",
        "Create flashcards for key formulas and definitions.",
        "Practice with more sample problems to build confidence.",
        "Consider forming a study group to discuss challenging topics.",
        "Take short breaks during study sessions to maintain focus."
    ];
    
    // Add topic-specific tips
    weakTopics.forEach(topic => {
        const tip = document.createElement('li');
        tip.className = 'tip-item';
        tip.textContent = `Focus on improving your knowledge of ${topic.name} (${topic.percentage}%).`;
        tipsList.appendChild(tip);
    });
    
    // Add general tips if needed
    if (weakTopics.length < 3) {
        const numGeneralTips = 3 - weakTopics.length;
        for (let i = 0; i < numGeneralTips; i++) {
            const tip = document.createElement('li');
            tip.className = 'tip-item';
            tip.textContent = generalTips[i];
            tipsList.appendChild(tip);
        }
    }
    
    // If passed with high score, show congratulatory message
    if (results.passed && results.score >= 90) {
        const congratsTip = document.createElement('li');
        congratsTip.className = 'tip-item';
        congratsTip.textContent = "Excellent job! Consider helping others with their studies or exploring advanced topics.";
        tipsList.prepend(congratsTip);
    }
}

// ========== REVIEW SECTION FUNCTIONS ==========

function switchToReviewSection(results) {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('review-section').style.display = 'block';
    
    // Initialize review section
    initializeReviewSection(results);
}

function switchToResultsSection() {
    document.getElementById('review-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
}

function initializeReviewSection(results) {
    // Set exam subject
    document.getElementById('review-exam-subject').textContent = results.subject;
    
    // Set total questions
    const totalQuestions = results.questions.length;
    document.getElementById('total-questions').textContent = totalQuestions;
    
    // Generate questions summary
    generateQuestionsSummary(results);
    
    // Display first question
    displayCurrentQuestion(results, 0);
    
    // Set up navigation buttons
    setupNavigationButtons(results);
}

function findCorrectOptionIndex(options) {
    for (let i = 0; i < options.length; i++) {
        // Check if this option contains the word "CORRECT" (case-insensitive)
        if (options[i].toUpperCase().includes("CORRECT")) {
            return i;
        }
    }
    // Fall back to -1 if no "CORRECT" text found
    return -1;
}

function displayCurrentQuestion(results, index) {
    currentQuestionIndex = index;
    const question = results.questions[index];
    const userAnswer = results.answers[index];
    
    // Update question number
    document.getElementById('current-question').textContent = index + 1;
    document.querySelector('.question-number').textContent = `Question ${index + 1}`;
    
    // Update topic
    document.getElementById('question-topic').textContent = question.topic || "General";
    
    // Update question text - try different property names that might contain the question
    const questionText = question.text || question.question || question.questionText || '';
    document.getElementById('question-text').textContent = questionText;
    
    // Generate answer options
    const optionsContainer = document.getElementById('answer-options');
    optionsContainer.innerHTML = '';
    
    // Get options - handle different property names that might contain the options
    const options = question.options || question.choices || [];
    if (!Array.isArray(options) || options.length === 0) {
        console.error('No options found for question:', question);
        optionsContainer.innerHTML = '<div class="error-message">No answer options found for this question.</div>';
        return;
    }
    
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
    
    // Use the correct answer index, resolving for shuffled options
    let correctAnswerIndex;

    // Handle correct answer by value (letter or text), adjusting for shuffled options
    if (Array.isArray(question.options)) {
        const originalOptions = question.originalOptions || [];
        let correctValue;

        if (typeof question.correctAnswer === 'number') {
            // Use the value from the originalOptions if available
            correctValue = originalOptions[question.correctAnswer] || question.options[question.correctAnswer];
        } else {
            // Assume correctAnswer is a string representing the correct option text
            correctValue = question.correctAnswer;
        }

        correctAnswerIndex = question.options.findIndex(opt => opt === correctValue);
    } else {
        correctAnswerIndex = question.correctAnswer;
    }
    
    console.log(`Question ${index + 1}:`);
    console.log("- Question:", question);
    console.log("- Correct answer index:", correctAnswerIndex);
    console.log("- User answer:", userAnswer);
    
    // Render options
    options.forEach((option, optIndex) => {
        const optionLetter = optionLetters[optIndex];
        
        // Check if this is selected by user
        const isSelected = Number(userAnswer) === optIndex;
        
        // Check if this is the correct answer
        const isCorrect = optIndex === correctAnswerIndex;
        
        console.log(`Option ${optionLetter} (${optIndex}): "${option}", isSelected=${isSelected}, isCorrect=${isCorrect}`);
        
        // Add the appropriate classes
        let optionClass = 'answer-option';
        if (isSelected) {
            optionClass += isCorrect ? ' correct' : ' incorrect';
        } else if (isCorrect) {
            optionClass += ' correct';
        }
        
        // Add status icons
        let statusIcon = '';
        if (isSelected) {
            statusIcon = isCorrect 
                ? '<span class="option-status correct"><i class="fas fa-check-circle"></i></span>'
                : '<span class="option-status incorrect"><i class="fas fa-times-circle"></i></span>';
        } else if (isCorrect) {
            statusIcon = '<span class="option-status correct"><i class="fas fa-check-circle"></i></span>';
        }
        
        // Create the option element
        const optionElement = document.createElement('div');
        optionElement.className = optionClass;
        optionElement.innerHTML = `
            <div class="option-letter">${optionLetter}</div>
            <div class="option-text">${option}</div>
            ${statusIcon}
        `;
        
        optionsContainer.appendChild(optionElement);
    });
    
    // Update explanation
    const explanationText = document.getElementById('explanation-text');
    explanationText.textContent = question.explanation || 'No explanation provided for this question.';
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').disabled = index === results.questions.length - 1;
}

function generateQuestionsSummary(results) {
    const summaryContainer = document.getElementById('questions-summary');
    summaryContainer.innerHTML = '';
    
    results.questions.forEach((question, index) => {
        const userAnswer = results.answers[index];
        
        // Get options - handle different property names
        const options = question.options || question.choices || [];
        
        // Use the correct answer index, resolving for shuffled options
        let correctAnswerIndex;
        if (Array.isArray(question.options)) {
            const originalOptions = question.originalOptions || [];
            let correctValue;
            if (typeof question.correctAnswer === 'number') {
                correctValue = originalOptions[question.correctAnswer] || question.options[question.correctAnswer];
            } else {
                correctValue = question.correctAnswer;
            }
            correctAnswerIndex = question.options.findIndex(opt => opt === correctValue);
        } else {
            correctAnswerIndex = question.correctAnswer;
        }
        
        // Compare user's answer to the correct answer index
        const isCorrect = Number(userAnswer) === correctAnswerIndex;
        const isAnswered = userAnswer !== null && userAnswer !== undefined;
        
        let itemClass = 'summary-item';
        if (isAnswered) {
            itemClass += isCorrect ? ' correct' : ' incorrect';
        } else {
            itemClass += ' unanswered';
        }
        
        const summaryItem = document.createElement('div');
        summaryItem.className = itemClass;
        summaryItem.textContent = index + 1;
        summaryItem.addEventListener('click', () => {
            displayCurrentQuestion(results, index);
            // Scroll to top of question
            document.querySelector('.question-card').scrollIntoView({ behavior: 'smooth' });
        });
        
        summaryContainer.appendChild(summaryItem);
    });
}

function setupNavigationButtons(results) {
    // Event listeners for navigation
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            displayCurrentQuestion(results, currentQuestionIndex - 1);
            // Scroll to top of question
            document.querySelector('.question-card').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentQuestionIndex < results.questions.length - 1) {
            displayCurrentQuestion(results, currentQuestionIndex + 1);
            // Scroll to top of question
            document.querySelector('.question-card').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function addDebugButton(results) {
    // Add debug button to view raw data
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        const debugBtn = document.createElement('button');
        debugBtn.className = 'action-button secondary';
        debugBtn.innerHTML = '<i class="fas fa-bug"></i> Debug Data';
        debugBtn.onclick = function() {
            const debugOutput = document.createElement('div');
            debugOutput.style.padding = '15px';
            debugOutput.style.margin = '15px 0';
            debugOutput.style.backgroundColor = '#f8f9fa';
            debugOutput.style.border = '1px solid #ddd';
            debugOutput.style.borderRadius = '5px';
            
            // Create a formatted output of the results object
            debugOutput.innerHTML = `
                <h3>Debug Data (examResults)</h3>
                <pre style="background-color: #eee; padding: 10px; overflow: auto; max-height: 400px;">${JSON.stringify(results, null, 2)}</pre>
                <p><strong>First Question:</strong></p>
                <pre style="background-color: #eee; padding: 10px;">${JSON.stringify(results.questions[0], null, 2)}</pre>
                <p><strong>First Answer:</strong> ${results.answers[0]}</p>
                <p><strong>Type of correctAnswer:</strong> ${typeof results.questions[0].correctAnswer}</p>
                <p><strong>Type of userAnswer:</strong> ${typeof results.answers[0]}</p>
            `;
            
            // Add detailed option analysis
            let optionAnalysis = '<h4>Option Analysis:</h4><ul>';
            results.questions.forEach((q, qIndex) => {
                const textBasedCorrectIndex = findCorrectOptionIndex(q.options);
                const storedCorrectIndex = q.correctAnswer;
                const userAns = results.answers[qIndex];
                
                optionAnalysis += `<li><strong>Question ${qIndex + 1}:</strong><br>`;
                optionAnalysis += `- Stored correctAnswer: ${storedCorrectIndex}<br>`;
                optionAnalysis += `- Text-based correct index: ${textBasedCorrectIndex}<br>`;
                optionAnalysis += `- User answer: ${userAns}<br>`;
                optionAnalysis += `- Options:<br><ul>`;
                
                q.options.forEach((opt, i) => {
                    const isStored = (i === Number(storedCorrectIndex));
                    const isTextBased = (i === textBasedCorrectIndex);
                    const isSelected = (i === Number(userAns));
                    
                    optionAnalysis += `<li>${i}: "${opt}" ${isTextBased ? '(CORRECT by text)' : ''} ${isStored ? '(STORED correct)' : ''} ${isSelected ? '(SELECTED)' : ''}</li>`;
                });
                
                optionAnalysis += `</ul></li>`;
            });
            optionAnalysis += '</ul>';
            
            // Add option analysis to the debug output
            const analysisDiv = document.createElement('div');
            analysisDiv.innerHTML = optionAnalysis;
            debugOutput.appendChild(analysisDiv);
            
            // Add a button to copy data to clipboard
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy Data to Clipboard';
            copyButton.style.padding = '8px 16px';
            copyButton.style.marginTop = '10px';
            copyButton.style.backgroundColor = '#3498db';
            copyButton.style.color = 'white';
            copyButton.style.border = 'none';
            copyButton.style.borderRadius = '4px';
            copyButton.style.cursor = 'pointer';
            
            copyButton.onclick = function() {
                const jsonText = JSON.stringify(results, null, 2);
                navigator.clipboard.writeText(jsonText)
                    .then(() => {
                        alert('Data copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                        alert('Failed to copy data.');
                    });
            };
            
            debugOutput.appendChild(copyButton);
            
            // Insert the debug output after the review container
            const currentContainer = document.querySelector('.review-container');
            if (currentContainer && currentContainer.style.display !== 'none') {
                currentContainer.appendChild(debugOutput);
            } else {
                document.querySelector('.results-container').appendChild(debugOutput);
            }
        };
        actionButtons.appendChild(debugBtn);
    }
}