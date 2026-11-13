const FRUITS = [
  { id: 'apple',   name: 'Яблуко',   src: 'img/apple.svg' },
  { id: 'pear',    name: 'Груша',    src: 'img/pear.svg' },
  { id: 'lemon',   name: 'Лимон',    src: 'img/lemon.svg' },
  { id: 'apricot', name: 'Абрикос',  src: 'img/apricot.svg' },
  { id: 'cherry',  name: 'Вишні',    src: 'img/cherry.svg' }
];

const ROWS = 3;
const COLS = 3;
const MAX_ATTEMPTS = 3;

const SPIN_FRAME_MS = 90;   
const SPIN_BASE_MS = 700;   
const SPIN_STEP_MS = 350;   

const DEFAULT_NAME = 'Гравець';
const NAME_RE = /^[\p{L}\p{N}](?:[\p{L}\p{N} '’-]{0,18}[\p{L}\p{N}])$/u;

const nameEl = document.getElementById('player-name');
const attemptEl = document.getElementById('attempt');
const buttonEl = document.getElementById('generate');
const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');

const state = {
  attempt: 0,
  spinning: false,
  finished: false
};

const cells = [];
const reels = [];

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomColumn() {
  return shuffle(FRUITS).slice(0, ROWS);
}

function randomLayout() {
  return Array.from({ length: COLS }, randomColumn);
}

function findWinningRows(layout) {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const first = layout[0][r].id;
    if (layout.every((col) => col[r].id === first)) rows.push(r);
  }
  return rows;
}

function askName() {
  let username = prompt("Введіть ваше ім’я:")
  while (username === null || username.trim() === "") {
    username = prompt("Введіть коректне ім’я.")
  }

  return username;
}

function buildBoard() {
  for (let c = 0; c < COLS; c++) {
    const reel = document.createElement('div');
    reel.className = 'reel';
    reel.style.setProperty('--col', c);

    cells[c] = [];
    for (let r = 0; r < ROWS; r++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.setProperty('--row', r);

      const img = document.createElement('img');
      img.draggable = false;
      cell.appendChild(img);
      reel.appendChild(cell);
      cells[c][r] = { cell, img };
    }

    boardEl.appendChild(reel);
    reels.push(reel);
  }
}

function preloadImages() {
  FRUITS.forEach((f) => { new Image().src = f.src; });
}

function setColumn(c, column) {
  column.forEach((fruit, r) => {
    const { img } = cells[c][r];
    img.src = fruit.src;
    img.alt = fruit.name;
  });
}

function setLayout(layout) {
  layout.forEach((column, c) => setColumn(c, column));
}

function clearHighlights() {
  cells.flat().forEach(({ cell }) => cell.classList.remove('win'));
  boardEl.classList.remove('shake');
}

function renderAttempt() {
  attemptEl.textContent = `Спроба ${state.attempt} з ${MAX_ATTEMPTS}`;
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message' + (type ? ` message--${type}` : '');
}

function resetGame() {
  state.attempt = 0;
  state.spinning = false;
  state.finished = false;

  clearHighlights();
  reels.forEach((reel) => reel.classList.remove('spinning', 'landed'));
  setLayout(randomLayout());

  renderAttempt();
  showMessage('Натисніть «Generate», щоб крутити барабани.');
  buttonEl.textContent = 'Generate';
  buttonEl.disabled = false;
}

function finishSpin(layout) {
  const winRows = findWinningRows(layout);
  state.spinning = false;

  if (winRows.length > 0) {
    winRows.forEach((r) => {
      for (let c = 0; c < COLS; c++) cells[c][r].cell.classList.add('win');
    });
    state.finished = true;
    showMessage(`Вітаємо, ${nameEl.textContent}! Ви перемогли з ${state.attempt}-ї спроби!`, 'win');
  } else if (state.attempt >= MAX_ATTEMPTS) {
    state.finished = true;
    boardEl.classList.add('shake');
    showMessage(`Спроби закінчились. ${nameEl.textContent}, цього разу не пощастило.`, 'lose');
  } else {
    showMessage(`Не пощастило. Залишилось спроб: ${MAX_ATTEMPTS - state.attempt}.`);
  }

  buttonEl.textContent = state.finished ? 'Грати знову' : 'Generate';
  buttonEl.disabled = false;
}

function spin() {
  if (state.spinning) return;
  if (state.finished) { resetGame(); return; }

  state.spinning = true;
  state.attempt += 1;
  renderAttempt();
  clearHighlights();
  showMessage('Крутимо…');
  buttonEl.disabled = true;

  const result = randomLayout();
  let stopped = 0;

  reels.forEach((reel, c) => {
    reel.classList.remove('landed');
    reel.classList.add('spinning');

    const timer = setInterval(() => setColumn(c, randomColumn()), SPIN_FRAME_MS);

    setTimeout(() => {
      clearInterval(timer);
      setColumn(c, result[c]);
      reel.classList.remove('spinning');
      void reel.offsetWidth;      
      reel.classList.add('landed');

      stopped += 1;
      if (stopped === COLS) finishSpin(result);
    }, SPIN_BASE_MS + c * SPIN_STEP_MS);
  });
}

function init() {
  buildBoard();
  preloadImages();
  nameEl.textContent = askName(); 
  document.title = `Однорукий бандит — ${nameEl.textContent}`;
  buttonEl.addEventListener('click', spin);
  resetGame();
}

init();
