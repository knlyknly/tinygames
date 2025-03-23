const MOUSE_BUTTON_LEFT = 0;
const MOUSE_BUTTON_RIGHT = 2;

const recorder = () => {
  return {

  };
}

const makeNewBoard = (rows, cols, danger) => {
  const board = [];
  // step 1: randomize all mines
  for (let i = 0; i < rows; i++) {
    let row = [];
    board[i] = row;
    for (let j = 0; j < cols; j++) {
      // make corners always not mine
      if ((i === 0 || i === rows - 1) && (j === 0 || j === cols - 1)) {
        row[j] = 0;
        continue;
      }
      let isMine = Math.random() * 100 < danger;
      row[j] = isMine ? -1 : 0;
    }
  }
  // step 2: summarize the mine count for each cell
  const isCellShouldCount = (i, j) => {
    if (i < 0 || j < 0 || i >= rows || j >= cols) {
      return 0;
    }
    return board[i][j] === -1 ? 1 : 0;
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (board[i][j] === -1) {
        continue;
      }
      board[i][j] = [-1, 0, 1].reduce(
        (sum, offsetRow) =>
          sum +
          [-1, 0, 1].reduce(
            (n, offsetCol) =>
              n +
              isCellShouldCount(i + offsetRow, j + offsetCol),
            0),
        0);
    }
  }
  // translate to meaningful data
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (board[i][j] === -1) {
        board[i][j] = {
          isMine: true,
          displayText: ' ',
          detected: false,
          marked: false,
        };
      } else {
        board[i][j] = {
          isMine: false,
          displayText: board[i][j] > 0 ? board[i][j] : ' ',
          detected: false,
          marked: false,
          count: board[i][j],
        };
      }
    }
  }
  return board;
}

const createBoard = () => {
  const rows = document.querySelector('#rowsInput').value;
  const cols = document.querySelector('#colsInput').value;
  return makeNewBoard(rows, cols, 16);
}

const clearTable = () => {
  const panel = document.querySelector('#board');
  panel.classList.remove('fail');
  panel.classList.remove('success');
  const children = Array.prototype.slice.apply(document.querySelector('#board tbody').children);
  children.forEach(item => item.parentNode.removeChild(item))
}

const createTable = (board) => {
  const tbody = document.querySelector('#board tbody');
  const [rows, cols] = [board.length, board[0]?.length];
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr');
    tbody.appendChild(tr);
    for (let j = 0; j < cols; j++) {
      const item = board[i][j];
      const td = document.createElement('td');
      td.addEventListener('click', (evt) => {
        if (evt.button === MOUSE_BUTTON_LEFT) {
          detect(board, i, j);
        }
      });
      td.addEventListener('contextmenu', (evt) => {
        mark(board, i, j);
        evt.stopPropagation();
        evt.preventDefault();
      })
      if (item.isMine) {
        td.classList.add('is-mine');
      }
      tr.appendChild(td);
      const icon = document.createElement('div');
      td.appendChild(icon);
      icon.classList.add('icon');
      icon.appendChild(document.createTextNode(item.displayText));
    }
  }
}

const detect = (board, row, col) => {
  const item = board[row] ? board[row][col] : null;
  if (!item || item.detected || item.marked !== false) {
    return;
  }
  const panel = document.querySelector('#board');
  const tbody = document.querySelector('#board tbody');
  const tr = tbody.children[row];
  const td = tr.children[col];
  item.detected = true;
  td.classList.add('detected');
  // detecting on a mine
  if (item.isMine) {
    panel.classList.add('fail');
    td.classList.add('choosed');
    return;
  }
  // process the zero items
  if (item.count === 0) {
    // detect all cells around it
    [-1, 0, 1].forEach((offsetRow) => {
      [-1, 0, 1].forEach((offsetCol) => {
        detect(board, row + offsetRow, col + offsetCol);
      })
    });
  }
}

const checkSuccess = (board) => {
  return board.reduce((allMatch, row) => {
    return allMatch && row.reduce((rowMatch, item) => {
      return rowMatch && (item.isMine && item.marked || !item.isMine && !item.marked);
    }, true);
  }, true);
}

const mark = (board, row, col) => {
  const item = board[row] ? board[row][col] : null;
  if (!item || item.detected) {
    autoDetect(board, row, col);
    return;
  }
  const panel = document.querySelector('#board');
  const tbody = document.querySelector('#board tbody');
  const tr = tbody.children[row];
  const td = tr.children[col];
  item.marked = item.marked === null ? false : item.marked === true ? null : true;
  if (item.marked) {
    td.classList.remove('questioned');
    td.classList.add('marked');
  } else if (item.marked === null) {
    td.classList.add('questioned');
    td.classList.remove('marked');
  } else {
    td.classList.remove('questioned');
    td.classList.remove('marked');
  }
  // final check if completed
  if (checkSuccess(board)) {
    panel.classList.add('success');
    Array.prototype.slice.apply(tbody.children).forEach(tr => {
      Array.prototype.slice.apply(tr.children).forEach(td => {
        if (!td.classList.contains('is-mine')) {
          td.classList.add('detected');
          td.classList.remove('questioned');
        }
      })
    });
  }
}

const autoDetect = (board, row, col) => {
  const [rows, cols] = [board.length, board[0]?.length];
  const item = board[row] ? board[row][col] : null;
  if (!item || !item.detected) {
    return;
  }
  const isCellMarked = (i, j) => {
    if (i < 0 || j < 0 || i >= rows || j >= cols) {
      return 0;
    }
    return board[i][j].marked !== false ? 1 : 0;
  }
  const markCount = [-1, 0, 1].reduce(
    (sum, offsetRow) =>
      sum +
      [-1, 0, 1].reduce(
        (n, offsetCol) =>
          n +
          isCellMarked(row + offsetRow, col + offsetCol),
        0),
    0);
  if (markCount === item.count) {
    // detect all cells around it
    [-1, 0, 1].forEach((offsetRow) => {
      [-1, 0, 1].forEach((offsetCol) => {
        detect(board, row + offsetRow, col + offsetCol);
      })
    });
  }
}

const start = () => {
  clearTable();
  const board = createBoard();
  createTable(board);
}

const cheat = () => {
  const board = document.querySelector('#board');
  if (board.classList.contains('cheat')) {
    board.classList.remove('cheat');
  } else {
    board.classList.add('cheat');
  }
}

window.addEventListener('load', () => {
  document.querySelector('#startButton').addEventListener('click', start);
  document.querySelector('#cheatButton').addEventListener('click', cheat);
  start();
})