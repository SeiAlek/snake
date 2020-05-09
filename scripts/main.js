'use strict';

initGame();

function initGame() {
  const container = document.querySelector('.game');

  drawGameContainer();

  const btnStartSnake = document.querySelector('#start-snake');
  const gameStart = document.querySelector('.game__start');
  const userNickName = document.querySelector('#user-nick-name');

  btnStartSnake.addEventListener('click', () => {
    eraisingStartElements();
    game(container, userNickName.value);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      eraisingStartElements();
      game(container, userNickName.value);
    }
  });

  function drawGameContainer() {
    container.insertAdjacentHTML('afterbegin', `
    <div class="game__start">
      <img src="./images/snake.svg" class="game__logo" alt="Snake Game" />
      <input
        id="user-nick-name"
        type="text"
        class="game__input"
        pattern="[A-Za-z]{0,8}"
        placeholder="Input Your Name"
      />
    </div>
    <button id="start-snake" class="game__start-btn">Start</button>
  `);
  }

  function eraisingStartElements() {
    btnStartSnake.classList.add('hide');
    erasing(gameStart);
    erasing(userNickName);
  }
}

function game(container, userNickName) {
  const clientHeight = document.documentElement.clientHeight;
  const clientWidth = document.documentElement.clientWidth;

  const grid = 16;
  let width = grid * 30;
  let height = grid * 40;
  const colorSnake = '#204051';
  const colorFood = '#ff0000';
  const fpsBase = 5;

  if (clientWidth < 768) {
    width = clientWidth - (clientWidth % grid);
  }

  if (clientHeight < 1024 && clientWidth < 768) {
    height = (clientHeight - (clientHeight % grid)) - (grid * 6);
  }

  drawingCanvas();
  initEventListeners();

  const canvas = container.querySelector('.game__field');
  const context = canvas.getContext('2d');

  let fps = fpsBase;
  let pause = false;

  const user = {
    nickName: userNickName || 'NoName',
    score: 0,
    roundScore: 0,
    distance: 0,
    live: 3,

    reset() {
      this.score = 0;
      this.roundScore = 0;
      this.distance = 0;
      this.live = 3;
    },
  };

  const swipe = {
    threshold: grid * 2,

    setRotationCoords(x, y) {
      this.initX = x;
      this.initY = y;
    },
  };

  const snake = {
    setVelocity(x, y) {
      this.dx = x;
      this.dy = y;
    },

    moving() {
      this.x += snake.dx;
      this.y += snake.dy;
      user.distance += 1;

      if (this.x < 0) {
        this.x = canvas.width - grid;
      } else if (this.x >= canvas.width) {
        this.x = 0;
      }

      if (this.y < 0) {
        this.y = canvas.height - grid;
      } else if (this.y >= canvas.height) {
        this.y = 0;
      }
    },

    handleLength() {
      this.cells.unshift(
        {
          x: snake.x,
          y: snake.y,
        }
      );

      if (this.cells.length > this.length) {
        this.cells.pop();
      }
    },

    drawing() {
      context.fillStyle = colorSnake;

      this.cells.forEach((cell, index) => {
        context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        this.checkAppleCollision(cell);
        this.checkSelfCollision(cell, index);
      });
    },

    checkAppleCollision(cell) {
      if (cell.x === apple.x && cell.y === apple.y) {
        this.length++;
        updateScore(user.score);
        apple.reset();
      }
    },

    checkSelfCollision(cell, index) {
      for (let i = index + 1; i < this.cells.length; i++) {
        if (cell.x === this.cells[i].x && cell.y === this.cells[i].y) {
          updateLive();
        }
      }
    },

    reset() {
      this.x = 160;
      this.y = 160;
      this.cells = [];
      this.length = 4;
      this.dx = grid;
      this.dy = 0;
    },
  };

  const apple = {
    drawing() {
      context.fillStyle = colorFood;
      context.fillRect(this.x, this.y, grid - 1, grid - 1);
    },

    reset() {
      this.x = getRandomCoord();
      this.y = getRandomCoord();
    },
  };

  const setNewVelocity = trottle(setVelocity, 1000 / fps);

  startGame();

  function loop() {
    if (pause) {
      return;
    }

    setTimeout(function() {
      requestAnimationFrame(loop);
      clearContext();
      snake.moving();
      snake.handleLength();
      apple.drawing();
      snake.drawing();
    }, 1000 / fps);
  }

  function initEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouch);
    container.addEventListener('touchend', handleTouchEnd);
  }

  function handleKeyDown(e) {
    e.preventDefault();

    if ((e.key === 'ArrowUp' || e.keyCode === 87) && (snake.dy === 0)) {
      setNewVelocity(0, -grid);
    }

    if ((e.key === 'ArrowDown' || e.keyCode === 83) && (snake.dy === 0)) {
      setNewVelocity(0, grid);
    }

    if ((e.key === 'ArrowLeft' || e.keyCode === 65) && (snake.dx === 0)) {
      setNewVelocity(-grid, 0);
    }

    if ((e.key === 'ArrowRight' || e.keyCode === 68) && (snake.dx === 0)) {
      setNewVelocity(grid, 0);
    }

    if (e.keyCode === 80 || e.code === 'Space') {
      setPause();
    }
  }

  function handleClick(e) {
    if (e.target.closest('.control__pause')) {
      setPause();
    }

    if (e.target.closest('.control__restart')) {
      drawingPopUp();
      confirmRestartGame();
    }
  }

  function handleTouchStart(e) {
    const x = e.targetTouches[0].screenX;
    const y = e.targetTouches[0].screenY;

    swipe.setRotationCoords(x, y);
  }

  function handleTouch(e) {
    e.preventDefault();

    const lastTouch = e.targetTouches[0];
    const actualX = lastTouch.screenX;
    const actualY = lastTouch.screenY;

    if (
      ((swipe.initX - actualX) > swipe.threshold)
      && (snake.dx === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(-grid, 0);

      return;
    }

    if (
      ((swipe.initX - actualX) < -swipe.threshold)
      && (snake.dx === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(grid, 0);

      return;
    }

    if (
      ((swipe.initY - actualY) > swipe.threshold)
      && (snake.dy === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(0, -grid);

      return;
    }

    if (
      ((swipe.initY - actualY) < -swipe.threshold)
      && (snake.dy === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(0, grid);
    }
  }

  function handleTouchEnd() {
    delete swipe.startX;
    delete swipe.startY;
  }

  function trottle(f, delay) {
    let isBussy = false;
    let savedCoords = null;

    return function wrapper(...args) {
      if (isBussy) {
        savedCoords = args;

        return;
      }

      isBussy = true;
      savedCoords = null;
      f(...args);

      setTimeout(() => {
        isBussy = false;

        if (savedCoords) {
          wrapper(...savedCoords);
        }
      }, delay);
    };
  }

  function setVelocity(x, y) {
    snake.dx = x;
    snake.dy = y;
  }

  function updateScore() {
    const value = container.querySelector('.control__score-value');

    user.score++;
    user.roundScore++;
    value.innerHTML = user.score;
    updateSpeed();
  }

  function updateLive() {
    const value = container.querySelector('.control__live');

    resetRound();

    user.live--;
    user.roundScore = 0;
    value.innerHTML = drawingHeart(user.live);

    if (user.live === 0) {
      endGame();
    }
  }

  function updateSpeed() {
    if (user.roundScore % 5 === 0) {
      fps++;
    }
  }

  function getRandomCoord() {
    const min = 0;
    const max = canvas.width / grid;
    const randomNum = Math.floor(Math.random() * (max - min)) + min;
    const randomCoord = randomNum * grid;

    return randomCoord;
  }

  function resetRound() {
    fps = fpsBase;

    apple.reset();
    snake.reset();
  }

  function startGame() {
    const scoreTable = document.querySelector('.game__high-score');
    const popupBlock = document.querySelector('.popup');
    const congrat = container.querySelector('.game__congrat');
    const score = container.querySelector('.control__score-value');
    const live = container.querySelector('.control__live');

    erasing(congrat);
    erasing(score);
    erasing(live);
    erasing(popupBlock);
    erasing(scoreTable);

    fps = fpsBase;
    user.reset();
    apple.reset();
    snake.reset();
    pause = false;

    drawingControlPanel();
    loop();
  }

  function confirmRestartGame() {
    const popupBlock = document.querySelector('.popup');
    const containerWrapper = document.querySelector('.game__field-wrapper');
    const controlPanel = document.querySelector('.game__control');

    document.addEventListener('click', (e) => {
      if (e.target.closest('.popup__button--apply')) {
        erasing(containerWrapper);
        erasing(controlPanel);
        erasing(popupBlock);
        initGame();

        return;
      }

      if (e.target.closest('.popup__button--cancel')) {
        erasing(popupBlock);
        pause = false;
        loop();
      }
    });
  }

  function setPause() {
    const controlBtn = container.querySelector('.control__pause');

    controlBtn.classList.toggle('control__pause--active');
    pause = !pause;
    loop();
  }

  function endGame() {
    const controlPanel = container.querySelector('.control');
    const gameField = document.querySelector('.game__field-wrapper');
    const btnStartSnake = document.querySelector('#start-snake');
    const userResult = {};

    savingScores(userResult);
    erasing(gameField);
    erasing(controlPanel);
    erasing(btnStartSnake);

    drawingCongratulation();
    drawingHighScoresTable(userResult);
  }

  function savingScores(userResult) {
    const highScores = JSON.parse(localStorage.getItem('snake')) || {};

    userResult.nickName = user.nickName;
    userResult.score = user.score;
    userResult.distance = user.distance;
    userResult.date = Date.now();

    highScores[userResult.date] = userResult;

    const highScoresArray = Object.entries(highScores)
      .sort((a, b) => sortHighScores(a[1], b[1]));

    const newHighScores = {};

    for (let i = 0; i < highScoresArray.length; i++) {
      if (i > 4) {
        break;
      }

      const scoreName = highScoresArray[i][0];
      const scoreValue = highScoresArray[i][1];

      newHighScores[scoreName] = scoreValue;
    }

    localStorage.setItem('snake', JSON.stringify(newHighScores));
  }

  function sortHighScores(a, b) {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return b.date - a.date;
  }

  function clearContext() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawingCanvas() {
    container.insertAdjacentHTML('afterbegin', `
      <div class="game__field-wrapper">
        <canvas
          class="game__field"
          width="${width}"
          height="${height}"
        ></canvas>
      </div>
    `);
  }

  function drawingControlPanel() {
    const printedName = (user.nickName.length > 8)
      ? user.nickName.slice(0, 5) + '...'
      : user.nickName;

    container.insertAdjacentHTML('afterbegin', `
      <section class="game__control control">
        <div class="control__score">
          ${printedName}:&nbsp;
          <span class="control__score-value">${user.score}</span>
        </div>
        <div class="control__buttons">
          <!--<button class="control__button control__restart"></button>-->
          <button class="control__button control__pause"></button>
        </div>
        <div class="control__live">
          ${drawingHeart(user.live)}
        </div>
      </section>
    `);
  }

  function drawingHeart(qty = 0) {
    const heartAlive = `
      <div class="control__heart control__heart-alive"></div>
    `;
    const heartBroken = `
      <div class="control__heart control__heart-broken"></div>
    `;
    const lives = heartAlive.repeat(qty);
    const broken = heartBroken.repeat(3 - qty);

    return broken + lives;
  }

  function drawingHighScoresTable(userResult) {
    let highScores = Object.entries(
      JSON.parse(localStorage.getItem('snake')
      ));

    highScores = highScores.sort((a, b) => sortHighScores(a[1], b[1]));

    const bestResultDate = highScores[0][1].date;

    if (userResult.date === bestResultDate) {
      const congrat = container.querySelector('.game__congrat');

      congrat.insertAdjacentHTML('beforeend', `
        <h2>You are the Best of the Best!</h2>
      `);
    }

    container.insertAdjacentHTML('beforeend', `
      <div class="game__high-score">
        <table class="game__high-score-table">
          <tr>
            <th>N</th>
            <th>Date</th>
            <th>Nick</th>
            <th>Score</th>
          </tr>
          ${highScores.map((item, i) => drawingRow(item, i)).join('')}
        </table>
      </div>
    `);

    function drawingRow(item, i) {
      const result = item[1];
      const date = new Date(result.date);
      const className = (result.date === userResult.date)
        ? 'class="game__row-highlight"'
        : 'class="game__row"';
      const row = `
        <tr ${className}>
          <td>${i + 1}.</td>
          <td>
            ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}
          </td>
          <td>
            ${result.nickName}
          </td>
          <td>
            ${result.score}
          </td>
        </tr>
      `;

      return row;
    }
  }

  function drawingCongratulation() {
    container.insertAdjacentHTML('afterbegin', `
      <div class="game__congrat">
        <img src="./images/snake.svg" class="game__congrat-image">
        <h2>Congratulation!</h2>
        You scored ${user.score} points!
      </div>
    `);
  }

  function drawingPopUp() {
    pause = true;

    container.insertAdjacentHTML('beforebegin', `
      <div class="game__popup popup">
        <div class="popup__container">
          <h2 class="popup__header">Are you sure?</h2>
          <div class="popup__buttons">
            <button class="popup__button popup__button--cancel">No</button>
            <button class="popup__button popup__button--apply">Yes</button>
          </div>
        </div>
      </div>
    `);
  }
}

function erasing(element) {
  if (element) {
    element.remove();

    return true;
  }

  return false;
}
