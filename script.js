document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const lessons = [{ name: "Lesson 22", kanji: [ { char: '記', on: 'キ', kun: 'しる.す', en: 'scribe, account' }, { char: '銀', on: 'ギン', kun: 'しろがね', en: 'silver' }, { char: '回', on: 'カイ', kun: 'まわ.る', en: 'times, round' }, { char: '夕', on: 'セキ', kun: 'ゆう', en: 'evening' }, { char: '黒', on: 'コク', kun: 'くろ', en: 'black' }, { char: '用', on: 'ヨウ', kun: 'もち.いる', en: 'use, business' }, { char: '守', on: 'シュ, ス', kun: 'まも.る', en: 'guard, protect' }, { char: '末', on: 'マツ', kun: 'すえ', en: 'end, close' }, { char: '待', on: 'タイ', kun: 'ま.つ', en: 'wait' }, { char: '残', on: 'ザン', kun: 'のこ.る', en: 'remainder, leave behind' }, { char: '番', on: 'バン', kun: 'つが.い', en: 'turn, number in series' }, { char: '駅', on: 'エキ', kun: 'n/a', en: 'station' }, { char: '説', on: 'セツ', kun: 'と.く', en: 'theory, explanation' }, { char: '案', on: 'アン', kun: 'つくえ', en: 'plan, suggestion' }, { char: '内', on: 'ナイ', kun: 'うち', en: 'inside, within' }, { char: '忘', on: 'ボウ', kun: 'わす.れる', en: 'forget' } ] }, { name: "Lesson 23", kanji: [ { char: '調', on: 'チョウ', kun: 'しら.べる', en: 'investigate, tune' }, { char: '化', on: 'カ, ケ', kun: 'ば.ける', en: 'change, take form of' }, { char: '横', on: 'オウ', kun: 'よこ', en: 'sideways, side' }, { char: '比', on: 'ヒ', kun: 'くら.べる', en: 'compare, ratio' }, { char: '感', on: 'カン', kun: 'n/a', en: 'feel, emotion' }, { char: '果', on: 'カ', kun: 'は.たす', en: 'fruit, result' }, { char: '答', on: 'トウ', kun: 'こた.える', en: 'solution, answer' }, { char: '変', on: 'ヘン', kun: 'か.わる', en: 'unusual, change' }, { char: '情', on: 'ジョウ', kun: 'なさ.け', en: 'feeling, passion' }, { char: '悲', on: 'ヒ', kun: 'かな.しい', en: 'grieve, sad' }, { char: '査', on: 'サ', kun: 'n/a', en: 'investigate' }, { char: '違', on: 'イ', kun: 'ちが.う', en: 'differ, violate' }, { char: '相', on: 'ソウ, ショウ', kun: 'あい-', en: 'mutual, together' }, { char: '顔', on: 'ガン', kun: 'かお', en: 'face' }, { char: '怒', on: 'ド', kun: 'いか.る, おこ.る', en: 'angry, be offended' } ] }];
    const allKanji = lessons.flatMap(lesson => lesson.kanji);
    const DECK_STATE_KEY = 'kanjiDeckState';
    const LEARNING_BUFFER_SIZE = 5;

    // --- Global DOM Elements & State ---
    const practiceContainer = document.getElementById('practice-container');
    const quizContainer = document.getElementById('quiz-container');
    const practiceModeBtn = document.getElementById('practice-mode-btn');
    const quizModeBtn = document.getElementById('quiz-mode-btn');
    const clearTimersBtn = document.getElementById('clear-timers-btn');
    let isDrawing = false, lastX = 0, lastY = 0;

    // --- Generic Drawing Functions ---
    const getCoords = (canvas, e) => {
        const rect = canvas.getBoundingClientRect();
        const event = e.touches ? e.touches[0] : e;
        return [event.clientX - rect.left, event.clientY - rect.top];
    };
    const startDrawing = e => { isDrawing = true; [lastX, lastY] = getCoords(e.target, e); };
    const stopDrawing = () => { isDrawing = false; };
    const createDrawFunction = (canvas, ctx) => e => {
        if (!isDrawing) return;
        e.preventDefault();
        const [x, y] = getCoords(canvas, e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    };
    
    // --- Mode Switching ---
    const switchToPracticeMode = () => {
        practiceContainer.style.display = 'block';
        quizContainer.style.display = 'none';
        practiceModeBtn.classList.add('active');
        quizModeBtn.classList.remove('active');
    };
    const switchToQuizMode = () => {
        practiceContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        practiceModeBtn.classList.remove('active');
        quizModeBtn.classList.add('active');
        quiz.loadNextQuestion();
    };

    // --- Practice Mode (Unchanged) ---
    const practice = (() => {
        const guideCanvas = document.getElementById('guideCanvas'), drawingCanvas = document.getElementById('drawingCanvas'), guideCtx = guideCanvas.getContext('2d'), drawingCtx = drawingCanvas.getContext('2d'), gradeButton = document.getElementById('grade-button'), clearButton = document.getElementById('clear-button'), nextButton = document.getElementById('next-button'), kanjiInfo = document.getElementById('kanji-info'), scoreInfo = document.getElementById('score-info'), onReading = document.getElementById('on-reading'), kunReading = document.getElementById('kun-reading'), enMeaning = document.getElementById('en-meaning');
        let currentLessonIndex = 0, currentKanjiInLessonIndex = 0;
        const loadKanji = () => { clearDrawingCanvas(); guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); scoreInfo.textContent = 'Score: --%'; const lesson = lessons[currentLessonIndex], kanjiData = lesson.kanji[currentKanjiInLessonIndex]; guideCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'; guideCtx.font = '200px "Yu Gothic", "Meiryo", sans-serif'; guideCtx.textAlign = 'center'; guideCtx.textBaseline = 'middle'; guideCtx.fillText(kanjiData.char, guideCanvas.width / 2, guideCanvas.height / 2); kanjiInfo.textContent = `${lesson.name}: ${kanjiData.char}`; onReading.textContent = kanjiData.on; kunReading.textContent = kanjiData.kun; enMeaning.textContent = kanjiData.en; };
        const clearDrawingCanvas = () => drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        const nextKanji = () => { currentKanjiInLessonIndex++; if (currentKanjiInLessonIndex >= lessons[currentLessonIndex].kanji.length) { currentKanjiInLessonIndex = 0; currentLessonIndex = (currentLessonIndex + 1) % lessons.length; } loadKanji(); };
        const gradeDrawing = () => { const guideData = guideCtx.getImageData(0, 0, guideCanvas.width, guideCanvas.height).data, drawingData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height).data; let templatePixels = 0, userPixels = 0, correctPixels = 0; for (let i = 0; i < guideData.length; i += 4) { const isGuidePixel = guideData[i + 3] > 0, isDrawingPixel = drawingData[i + 3] > 0; if (isGuidePixel) templatePixels++; if (isDrawingPixel) userPixels++; if (isGuidePixel && isDrawingPixel) correctPixels++; } if (templatePixels === 0) { scoreInfo.textContent = 'Score: 0%'; return; } const incorrectPixels = userPixels - correctPixels, score = (correctPixels / (templatePixels + (incorrectPixels * 0.5))) * 100; scoreInfo.textContent = `Score: ${Math.round(score)}%`; };
        return { init: () => { drawingCtx.strokeStyle = '#000'; drawingCtx.lineWidth = 10; drawingCtx.lineCap = 'round'; drawingCtx.lineJoin = 'round'; const draw = createDrawFunction(drawingCanvas, drawingCtx); drawingCanvas.addEventListener('mousedown', startDrawing); drawingCanvas.addEventListener('mousemove', draw); drawingCanvas.addEventListener('mouseup', stopDrawing); drawingCanvas.addEventListener('mouseout', stopDrawing); drawingCanvas.addEventListener('touchstart', startDrawing); drawingCanvas.addEventListener('touchmove', draw); drawingCanvas.addEventListener('touchend', stopDrawing); gradeButton.addEventListener('click', gradeDrawing); clearButton.addEventListener('click', clearDrawingCanvas); nextButton.addEventListener('click', nextKanji); loadKanji(); } };
    })();

    // --- Quiz Mode (Major SRS Update) ---
    const quiz = (() => {
        const userCanvas = document.getElementById('quizUserCanvas'), answerCanvas = document.getElementById('quizAnswerCanvas'), userCtx = userCanvas.getContext('2d'), answerCtx = answerCanvas.getContext('2d'), revealBtn = document.getElementById('quiz-reveal-btn'), clearBtn = document.getElementById('quiz-clear-btn'), onDisplay = document.getElementById('quiz-on'), kunDisplay = document.getElementById('quiz-kun'), enDisplay = document.getElementById('quiz-en'), ratingButtons = document.getElementById('quiz-rating-buttons'), noCardsMessage = document.getElementById('no-cards-message'), quizUI = document.getElementById('quiz-canvas-wrapper'), mainActions = document.querySelector('.quiz-main-actions'), prompt = document.getElementById('quiz-prompt');
        let currentKanji = null;
        
        const getDeckState = () => {
            let state = JSON.parse(localStorage.getItem(DECK_STATE_KEY));
            if (!state) {
                state = {
                    unseen: allKanji.map(k => k.char),
                    learning: [],
                    review: {}
                };
            }
            while (state.learning.length < LEARNING_BUFFER_SIZE && state.unseen.length > 0) {
                state.learning.push(state.unseen.shift());
            }
            return state;
        };
        
        const saveDeckState = (state) => {
            localStorage.setItem(DECK_STATE_KEY, JSON.stringify(state));
        };

        const handleRating = (e) => {
            if (!e.target.classList.contains('rating-btn')) return;
            const timeInSeconds = parseInt(e.target.dataset.time, 10);
            let state = getDeckState();

            // Find and remove current kanji from learning list
            const kanjiChar = currentKanji.char;
            const indexInLearning = state.learning.indexOf(kanjiChar);
            if (indexInLearning > -1) {
                state.learning.splice(indexInLearning, 1);
            }
            
            if (timeInSeconds > 0) {
                // Graduate to review
                const snoozeUntil = Date.now() + timeInSeconds * 1000;
                state.review[kanjiChar] = snoozeUntil;
                // Add a new card to learning if available
                if (state.unseen.length > 0) {
                    state.learning.push(state.unseen.shift());
                }
            } else {
                // Re-add to the end of the learning queue if failed
                state.learning.push(kanjiChar);
            }
            
            saveDeckState(state);
            loadNextQuestion();
        };

        const revealAnswer = () => {
            answerCtx.clearRect(0, 0, answerCanvas.width, answerCanvas.height);
            answerCtx.fillStyle = '#000';
            answerCtx.font = '170px "Yu Gothic", "Meiryo", sans-serif';
            answerCtx.textAlign = 'center';
            answerCtx.textBaseline = 'middle';
            answerCtx.fillText(currentKanji.char, answerCanvas.width / 2, answerCanvas.height / 2);
            revealBtn.style.display = 'none';
            ratingButtons.style.display = 'flex';
        };

        const loadNextQuestion = () => {
            clearUserCanvas();
            answerCtx.clearRect(0, 0, answerCanvas.width, answerCanvas.height);
            let state = getDeckState();
            
            // Check for due review cards
            const now = Date.now();
            const dueChars = Object.keys(state.review).filter(char => state.review[char] <= now);
            if (dueChars.length > 0) {
                for (const char of dueChars) {
                    state.learning.unshift(char); // Add to front of learning queue
                    delete state.review[char];
                }
            }
            saveDeckState(state);

            if (state.learning.length === 0) {
                quizUI.style.display = 'none'; mainActions.style.display = 'none'; ratingButtons.style.display = 'none'; prompt.style.display = 'none';
                noCardsMessage.style.display = 'block';
                return;
            }

            quizUI.style.display = 'flex'; mainActions.style.display = 'flex'; prompt.style.display = 'block';
            noCardsMessage.style.display = 'none';
            
            // Prioritize due cards at the front, otherwise pick randomly from learning
            const nextKanjiChar = state.learning[0];
            currentKanji = allKanji.find(k => k.char === nextKanjiChar);
            
            onDisplay.textContent = currentKanji.on;
            kunDisplay.textContent = currentKanji.kun;
            enDisplay.textContent = currentKanji.en;
            
            revealBtn.style.display = 'inline-block';
            ratingButtons.style.display = 'none';
        };

        return {
            init: () => {
                userCtx.strokeStyle = '#000'; userCtx.lineWidth = 8; userCtx.lineCap = 'round'; userCtx.lineJoin = 'round';
                const draw = createDrawFunction(userCanvas, userCtx);
                userCanvas.addEventListener('mousedown', startDrawing); userCanvas.addEventListener('mousemove', draw); userCanvas.addEventListener('mouseup', stopDrawing); userCanvas.addEventListener('mouseout', stopDrawing); userCanvas.addEventListener('touchstart', startDrawing); userCanvas.addEventListener('touchmove', draw); userCanvas.addEventListener('touchend', stopDrawing);
                revealBtn.addEventListener('click', revealAnswer);
                clearBtn.addEventListener('click', clearUserCanvas);
                ratingButtons.addEventListener('click', handleRating);
            },
            loadNextQuestion
        };
    })();

    // --- App Initialization ---
    const resetAllTimers = () => {
        if (confirm("Are you sure you want to reset your entire quiz progress? This will put all Kanji back into the 'Unseen' deck.")) {
            localStorage.removeItem(DECK_STATE_KEY);
            if (quizContainer.style.display === 'block') {
                quiz.loadNextQuestion();
            }
        }
    };

    practiceModeBtn.addEventListener('click', switchToPracticeMode);
    quizModeBtn.addEventListener('click', switchToQuizMode);
    clearTimersBtn.addEventListener('click', resetAllTimers);

    practice.init();
    quiz.init();
    switchToPracticeMode(); // Start in practice mode by default
});
