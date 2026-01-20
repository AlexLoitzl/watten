let allPuzzles = [];
let currentPuzzleIndex = 0;
let selectedCard = null;
let selectedOption = null;
let completedPuzzles = new Set();

let selectedSuits = new Set();
let selectedRanks = new Set();

const KNOWLEDGE_SUITS = ["Herz", "Schell", "Eichel", "Laub"];
const KNOWLEDGE_RANKS = ["Ass", "König", "Ober", "Unter", "10", "9", "8", "7"];
const suitModeRef = { current: null };
const rankModeRef = { current: null };

// Card image path generator
function getCardImagePath(suit, rank) {
    // Returns path like: cards/herz_koenig.png
    // You can customize this based on your image naming convention
    const suitMap = {
        'Herz': 'h',
        'Schell': 's',
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
            const puzzle = allPuzzles[currentPuzzleIndex];
            const isWinner = puzzle.winner !== undefined && puzzle.winner === index;
            cardEl.className = `game-card ${isRed ? 'red' : ''} ${isWinner ? 'winner' : ''}`;

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

    knowledgeModeSuits = null;
    knowledgeModeRanks = null;
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

function setsEqual(a, b) {
    if (a === null || b === null) return false;
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
}

function checkAnswer() {
    const puzzle = allPuzzles[currentPuzzleIndex];
    const feedback = document.getElementById('feedback');
    let isCorrect = false;
    const knowledgeArea = document.getElementById("knowledgeArea");
    // Reset highlight
    if (knowledgeArea) {
        knowledgeArea.classList.remove("correct", "incorrect");
    }

    console.log("check Answer");

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
        console.log("Knowledge check");
        console.log("Suit mode:", suitModeRef.current);
        console.log("Rank mode:", rankModeRef.current);
        console.log("Selected suits:", [...selectedSuits]);
        console.log("Selected ranks:", [...selectedRanks]);
        console.log("Puzzle correct:", puzzle.correct);


        const suitResult = resolveSelection(
            selectedSuits,
            suitModeRef.current,
            KNOWLEDGE_SUITS
        );

        const rankResult = resolveSelection(
            selectedRanks,
            rankModeRef.current,
            KNOWLEDGE_RANKS
        );

        const correctSuits = new Set(puzzle.correct.suits);
        const correctRanks = new Set(puzzle.correct.ranks);

        isCorrect =
            setsEqual(suitResult, correctSuits) &&
            setsEqual(rankResult, correctRanks);
        console.log("isCorrect:", isCorrect)
        console.log("suitResult:", suitResult);
        console.log("rankResult:", rankResult);
        console.log("correctSuits:", correctSuits);
        console.log("correctRanks:", correctRanks);
    }

    if (isCorrect) {
        const explanationBox = document.getElementById("explanationBox");
        if (explanationBox && puzzle.explanation) {
            explanationBox.textContent = puzzle.explanation;
            explanationBox.classList.remove("correct", "wrong");
            explanationBox.classList.add("visible", isCorrect ? "correct" : "wrong");
        }

        // Mark as completed
        completedPuzzles.add(puzzle.id);
        saveProgress();
        renderPuzzleList();
    }
    flashSubmitButton(isCorrect);

    // Disable submit button after answer
    //document.getElementById('submitButton').disabled = true;
}

function flashSubmitButton(isCorrect) {
    const btn = document.getElementById("submitButton");
    if (!btn) return;

    btn.classList.remove("flash-correct", "flash-wrong");

    // Force reflow so repeated flashes work
    void btn.offsetWidth;

    btn.classList.add(isCorrect ? "flash-correct" : "flash-wrong");

    setTimeout(() => {
        btn.classList.remove("flash-correct", "flash-wrong");
    }, 500);
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
    renderKnowledgeGroup("suitGrid", KNOWLEDGE_SUITS, selectedSuits, suitModeRef);
    renderKnowledgeGroup("rankGrid", KNOWLEDGE_RANKS, selectedRanks, rankModeRef);
}

function renderKnowledgeGroup(containerId, values, store, modeRef) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    values.forEach(value => {
        const el = document.createElement("div");
        el.className = "knowledge-item";
        el.textContent = value;

        el.onclick = () =>
            toggleKnowledge(el, value, store, "possible", modeRef);

        el.oncontextmenu = e => {
            e.preventDefault();
            toggleKnowledge(el, value, store, "impossible", modeRef);
        };

        container.appendChild(el);
    });
}

function toggleKnowledge(el, value, store, mode, modeRef) {
    // modeRef = { current: suitMode } or { current: rankMode }

    if (!modeRef.current) {
        modeRef.current = mode;
    }

    if (modeRef.current !== mode) {
        alert("Du kannst hier nicht mögliche UND unmögliche Werte mischen.");
        return;
    }

    if (store.has(value)) {
        store.delete(value);
        el.classList.remove(mode);
    } else {
        store.add(value);
        el.classList.add(mode);
    }

    if (store.size === 0) {
        modeRef.current = null;
    }
}

function resolveSelection(store, mode, universe) {
    console.log("ResolveSelection, Mode:", mode);
    if (!mode) return null; // no information given

    if (mode === "possible") {
        return new Set(store);
    } else {
        return new Set(universe.filter(v => !store.has(v)));
    }
}


// Load puzzles on page load
loadPuzzles();
