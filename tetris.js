const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20); // 1マス20px

const arena = createMatrix(12, 20);
let attackPower = 0;  // 攻撃力の管理

const colors = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // I
  '#0DFF72', // S
  '#F538FF', // Z
  '#FF8E0D', // L
  '#FFE138', // J
  '#3877FF', // O
];

// HTMLで表示する攻撃力の更新
const attackPowerDisplay = document.getElementById('attackPower');

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  if (type === 'T') {
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  } else if (type === 'J') {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ];
  } else if (type === 'I') {
    return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}

// 描画
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

// プレイヤー
const player = {
  pos: {x: 0, y: 0},
  matrix: null,
};

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
}

// 更新ループ
let lastTime = 0;
let moveCooldown = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  moveCooldown -= deltaTime;
  if (moveCooldown <= 0) {
    const bestMove = findBestMove(player, arena);

    if (bestMove) {
      // 回転
      for (let r = 0; r < bestMove.rotation; r++) {
        rotate(player.matrix, 1);
      }
      // 位置
      player.pos.x = bestMove.pos.x;
      player.pos.y = bestMove.pos.y;

      // 固定
      merge(arena, player);

      // ライン消し
      sweepArena();

      // 次のピース
      playerReset();
    }
    moveCooldown = 200; // 0.2秒ごとに動かす
  }

  draw();
  requestAnimationFrame(update);
}

// 攻撃力の計算（ライン消しによるアタック）
function increaseAttackPower(linesCleared) {
  if (linesCleared > 0) {
    attackPower += linesCleared * 10; // 1ライン消すごとに攻撃力+10
    attackPowerDisplay.textContent = attackPower; // 攻撃力を画面に更新
  }
}

// ライン消し
function sweepArena() {
  let linesCleared = 0;
  outer: for (let y = arena.length - 1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    y++;
    linesCleared++;
  }

  increaseAttackPower(linesCleared); // ライン消し後に攻撃力を更新
}

// プレイヤーがピースを盤面に固定した後の処理
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// ===== 最適な移動を選択 =====
function findBestMove(player, arena) {
  // 最適な動きを選ぶ簡単な方法
  let bestMove = { pos: { x: player.pos.x, y: player.pos.y }, rotation: 0 };

  for (let i = 0; i < 4; i++) {
    rotate(player.matrix, 1);  // 回転

    let x = player.pos.x;
    let y = player.pos.y;

    // 移動しながら最適位置を探索（単純な下移動）
    while (canMove(player.matrix, { x: x, y: y + 1 }, arena)) {
      y++;
    }

    bestMove.pos = { x: x, y: y };
    bestMove.rotation = i;
  }

  return bestMove;
}

// ===== ピースが動けるかチェック =====
function canMove(matrix, pos, arena) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0) {
        let newX = x + pos.x;
        let newY = y + pos.y;
        if (newX < 0 || newX >= arena[0].length || newY >= arena.length || arena[newY][newX] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}

// ゲームの開始
playerReset();
update();
