let allPuzzles = [];
let currentPuzzleIndex = 0;
let selectedCard = null;
let selectedOption = null;
let completedPuzzles = new Set();

let knowledgeMode = null; // "possible" | "impossible"
let selectedSuits = new Set();
let selectedRanks = new Set();

const KNOWLEDGE_SUITS = ["Herz", "Schellen", "Eichel", "Laub"];
const KNOWLEDGE_RANKS = ["Ass", "König", "Ober", "Unter", "10", "9", "8", "7"];


// Card image path generator
function getCardImagePath(suit, rank) {
    // Returns path like: cards/herz_koenig.png
    // You can customize this based on your image naming convention
    const suitMap = {
        'Herz': 'h',
        'Schellen': 's',
        'Eichel': 'e',
        'Laub': 'l'
    };
    const rankMap = {
        'Ass': 'a',
        'König': 'k',
        'Ober': 'o',
        'Unter': 'u',
        '10': '10',
        '9': '9',
        '8': '8',
        '7': '7'
    };
    return `cards/${suitMap[suit]}${rankMap[rank]}.jpg`;
}

// Load completed puzzles from localStorage
function loadProgress() {
    const saved = localStorage.getItem('wattenPuzzlesCompleted');
    if (saved) {
        completedPuzzles = new Set(JSON.parse(saved));
    }
}

// Save completed puzzles to localStorage
function saveProgress() {
    localStorage.setItem('wattenPuzzlesCompleted', JSON.stringify([...completedPuzzles]));
}

// Load puzzles from JSON file
async function loadPuzzles() {
    try {
        const response = await fetch('puzzles.json');
        const data = await response.json();
        allPuzzles = data.puzzles;
        loadProgress();
        renderPuzzleList();
        loadPuzzle(0);
    } catch (error) {
        console.error('Error loading puzzles:', error);
        document.getElementById('questionText').textContent =
            'Fehler beim Laden der Rätsel. Bitte stelle sicher, dass puzzles.json verfügbar ist.';
    }
}

function renderPuzzleList() {
    const listContainer = document.getElementById('puzzleList');
    listContainer.innerHTML = '';

    allPuzzles.forEach((puzzle, index) => {
        const item = document.createElement('div');
        item.className = 'puzzle-item' +
            (index === currentPuzzleIndex ? ' active' : '') +
            (completedPuzzles.has(puzzle.id) ? ' completed' : '');

        item.innerHTML = `
            <div class="puzzle-item-number">Rätsel ${puzzle.id}</div>
            <div class="puzzle-item-date">${formatDate(puzzle.date)}</div>
        `;

        item.onclick = () => loadPuzzle(index);
        listContainer.appendChild(item);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
}

function loadPuzzle(index) {
    if (index < 0 || index >= allPuzzles.length) return;

    currentPuzzleIndex = index;
    const puzzle = allPuzzles[index];
    selectedCard = null;
    selectedOption = null;

    // Update puzzle info
    document.getElementById('puzzleNumber').textContent = puzzle.id;
    document.getElementById('puzzleDate').textContent = formatDate(puzzle.date);

    // Render previous trick if exists
    if (puzzle.previousTrick) {
        document.getElementById('previousTrickSection').classList.remove('hidden');
        renderTrick(puzzle.previousTrick, document.getElementById('previousTrickArea'), puzzle.previousTrickStarter);
    } else {
        document.getElementById('previousTrickSection').classList.add('hidden');
    }

    // Render current trick
    renderTrick(puzzle.trick, document.getElementById('trickArea'), puzzle.trickStarter);

    // Render hand if exists
    if (puzzle.hand && puzzle.hand.length > 0) {
        document.getElementById('handSection').classList.remove('hidden');
        renderHand(puzzle.hand);
    } else {
        document.getElementById('handSection').classList.add('hidden');
    }

    // Render question
    document.getElementById('questionText').textContent = puzzle.question;

    // Render answer interface
    renderAnswerInterface(puzzle);

    // Reset feedback and button
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('submitButton').disabled = false;

    // Update navigation buttons
    document.getElementById('prevButton').disabled = index === 0;
    document.getElementById('nextButton').disabled = index === allPuzzles.length - 1;

    // Update sidebar
    renderPuzzleList();
}

function navigatePuzzle(direction) {
    const newIndex = currentPuzzleIndex + direction;
    loadPuzzle(newIndex);
}

function renderTrick(trick, container, starterPosition) {
    container.innerHTML = '';

    trick.forEach((card, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'trick-card-wrapper';
        wrapper.dataset.position = index;

        // Add start indicator if this position started
        if (starterPosition !== undefined && starterPosition === index) {
            const indicator = document.createElement('div');
            indicator.className = 'start-indicator';
            wrapper.appendChild(indicator);
        }

        const cardEl = document.createElement('div');

        if (card) {
            const isRed = card.suit === 'Herz' || card.suit === 'Schellen';
            cardEl.className = `game-card ${isRed ? 'red' : ''}`;

            // Try to load image
            const imgPath = getCardImagePath(card.suit, card.rank);
            const img = new Image();
            img.onload = function() {
                cardEl.style.backgroundImage = `url('${imgPath}')`;
                cardEl.classList.add('has-image');
            };
            img.onerror = function() {
                // Fallback to text if image not found
                cardEl.innerHTML = `
                    <div class="symbol">${getSuitSymbol(card.suit)}</div>
                    <div class="rank">${getRankDisplay(card.rank)}</div>
                `;
            };
            img.src = imgPath;

            // Set fallback content immediately
            cardEl.innerHTML = `
                <div class="symbol">${getSuitSymbol(card.suit)}</div>
                <div class="rank">${getRankDisplay(card.rank)}</div>
            `;
        } else {
            cardEl.className = 'game-card empty';
            cardEl.innerHTML = '<div class="symbol">?</div>';
        }

        wrapper.appendChild(cardEl);
        container.appendChild(wrapper);
    });
}

function renderHand(hand) {
    const handArea = document.getElementById('handArea');
    handArea.innerHTML = '';

    hand.forEach((card, index) => {
        const isRed = card.suit === 'Herz' || card.suit === 'Schellen';
        const cardEl = document.createElement('div');
        cardEl.className = `hand-card ${isRed ? 'red' : ''}`;
        cardEl.dataset.index = index;

        // Try to load image
        const imgPath = getCardImagePath(card.suit, card.rank);
        const img = new Image();
        img.onload = function() {
            cardEl.style.backgroundImage = `url('${imgPath}')`;
            cardEl.classList.add('has-image');
        };
        img.onerror = function() {
            // Fallback to text if image not found
        };
        img.src = imgPath;

        // Set fallback content immediately
        cardEl.innerHTML = `
            <div class="symbol">${getSuitSymbol(card.suit)}</div>
            <div class="rank">${getRankDisplay(card.rank)}</div>
        `;

        cardEl.onclick = () => selectCard(index, cardEl);
        handArea.appendChild(cardEl);
    });
}

function renderAnswerInterface(puzzle) {
    document.getElementById("knowledgeArea").classList.add("hidden");
    document.getElementById("knowledgeLegend").classList.add("hidden");

    knowledgeMode = null;
    selectedSuits.clear();
    selectedRanks.clear();


    const optionsContainer = document.getElementById('answerOptions');
    optionsContainer.innerHTML = '';

    if (puzzle.type === 'multiple_choice') {
        puzzle.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-button';
            button.textContent = option;
            button.onclick = () => selectOption(index, button);
            optionsContainer.appendChild(button);
        });
    }
    if (puzzle.type === "knowledge") {
        document.getElementById("knowledgeArea").classList.remove("hidden");
        document.getElementById("knowledgeLegend").classList.remove("hidden");
        renderKnowledgeSelectors();
    }
}

function selectCard(index, cardEl) {
    const puzzle = allPuzzles[currentPuzzleIndex];
    if (puzzle.type !== 'card') return;

    // Remove previous selection
    document.querySelectorAll('.hand-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Select new card
    cardEl.classList.add('selected');
    selectedCard = index;
}

function selectOption(index, buttonEl) {
    const puzzle = allPuzzles[currentPuzzleIndex];
    if (puzzle.type !== 'multiple_choice') return;

    // Remove previous selection
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Select new option
    buttonEl.classList.add('selected');
    selectedOption = index;
}

function setsEqual(set, arr) {
    if (set.size !== arr.length) return false;
    return [...set].every(v => arr.includes(v));
}

function checkAnswer() {
    const puzzle = allPuzzles[currentPuzzleIndex];
    const feedback = document.getElementById('feedback');
    let isCorrect = false;

    if (puzzle.type === 'card') {
        if (selectedCard === null) {
            alert('Bitte wähle eine Karte aus!');
            return;
        }

        const selectedCardData = puzzle.hand[selectedCard];
        const correct = puzzle.correctAnswer;
        isCorrect = selectedCardData.suit === correct.suit &&
                    selectedCardData.rank === correct.rank;
    } else if (puzzle.type === 'multiple_choice') {
        if (selectedOption === null) {
            alert('Bitte wähle eine Antwort aus!');
            return;
        }

        isCorrect = selectedOption === puzzle.correctAnswer;
    } else if (puzzle.type === "knowledge") {
        if (selectedSuits.size === 0 && selectedRanks.size === 0) {
            alert("Bitte triff mindestens eine Auswahl.");
            return;
        }

        const correct = puzzle.correctPossible || puzzle.correctImpossible;
        const requiredMode = puzzle.correctPossible ? "possible" : "impossible";

        if (knowledgeMode !== requiredMode) {
            isCorrect = false;
        } else {
            isCorrect =
                setsEqual(selectedSuits, correct.suits || []) &&
                setsEqual(selectedRanks, correct.ranks || []);
        }
    }


    if (isCorrect) {
        feedback.className = 'feedback correct';
        feedback.innerHTML = `
            <div>✓ Richtig!</div>
            <div class="explanation">${puzzle.explanation}</div>
        `;

        // Mark as completed
        completedPuzzles.add(puzzle.id);
        saveProgress();
        renderPuzzleList();
    } else {
        feedback.className = 'feedback incorrect';
        feedback.innerHTML = `
            <div>✗ Leider falsch</div>
            <div class="explanation">${puzzle.explanation}</div>
        `;
    }

    // Disable submit button after answer
    document.getElementById('submitButton').disabled = true;
}

function getSuitSymbol(suit) {
    const symbols = {
        'Herz': '♥',
        'Schellen': '♦',
        'Eichel': '♣',
        'Laub': '♠'
    };
    return symbols[suit] || '?';
}

function getRankDisplay(rank) {
    const display = {
        'Ass': 'A',
        'König': 'K',
        'Ober': 'O',
        'Unter': 'U'
    };
    return display[rank] || rank;
}

function renderKnowledgeSelectors() {
    renderKnowledgeGroup("suitGrid", KNOWLEDGE_SUITS, selectedSuits);
    renderKnowledgeGroup("rankGrid", KNOWLEDGE_RANKS, selectedRanks);
}

function renderKnowledgeGroup(containerId, values, store) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    values.forEach(value => {
        const el = document.createElement("div");
        el.className = "knowledge-item";
        el.textContent = value;

        el.onclick = () => toggleKnowledge(el, value, store, "possible");
        el.oncontextmenu = e => {
            e.preventDefault();
            toggleKnowledge(el, value, store, "impossible");
        };

        container.appendChild(el);
    });
}

function toggleKnowledge(el, value, store, mode) {
    if (!knowledgeMode) knowledgeMode = mode;

    if (knowledgeMode !== mode) {
        alert("Du kannst nicht gleichzeitig möglich UND unmöglich markieren.");
        return;
    }

    if (store.has(value)) {
        store.delete(value);
        el.classList.remove(mode);
    } else {
        store.add(value);
        el.classList.add(mode);
    }

    if (selectedSuits.size === 0 && selectedRanks.size === 0) {
        knowledgeMode = null;
    }
}

// Load puzzles on page load
loadPuzzles();
