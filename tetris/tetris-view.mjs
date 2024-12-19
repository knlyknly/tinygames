const createDomMatrix = (size) => {
  return Array(size.height)
    .fill(0)
    .map((_) => {
      const row = document.createElement('div');
      row.classList.add('row');
      const array = Array(size.width)
        .fill(0)
        .map((_) => document.createElement('div'));
      array.forEach((cell) => row.appendChild(cell));
      return row;
    });
};

export class TetrisView {
  mainPanel = document.createElement('div');
  stackPanel = null;
  scorePanel = null;
  preparingPanel = null;
  size = null;

  constructor() {
    this.mainPanel.classList.add('tetris');
    this.mainPanel.innerHTML = `
      <div class="stack-container">
        <div class="stack-panel"></div>
      </div>
      <div class="sidebar-container">
        <div class="score-container">
          <div class="score-label">SCORE</div>
          <div class="score-panel"></div>
        </div>
        <div class="preparing-container">
          <div class="preparing-label">PREPARING</div>
          <div class="preparing-panel"></div>
        </div>
      </div>
    `;
    this.stackPanel = this.mainPanel.querySelector('.stack-panel');
    this.scorePanel = this.mainPanel.querySelector('.score-panel');
    this.preparingPanel = this.mainPanel.querySelector('.preparing-panel');
  }

  appendTo = (target = document.body) => {
    target.appendChild(this.mainPanel);
  };

  redraw = ({ stack, dropping, preparing, score }) => {
    if (!stack || !stack.length || !dropping?.shape?.form || !dropping.offset) {
      return new Promise((_, reject) => reject());
    }
    return new Promise((resolve) => {
      this._initialize(stack);
      const [rows, preparingRows] = [this.stackPanel, this.preparingPanel].map((panel) => Array.prototype.slice.apply(panel.children));
      const [size, droppingSize, droppingOffset] = [
        this.size,
        { width: dropping.shape.form[0].length, height: dropping.shape.form.length },
        { x: dropping.offset[0], y: dropping.offset[1] },
      ];
      // draw score
      this.scorePanel.innerHTML = score;
      // draw stack and dropping
      stack.forEach((rowModel, y) => {
        const rowView = rows[y];
        const cellViews = Array.prototype.slice.apply(rowView.children);
        rowModel.forEach((cellModel, x) => {
          const cellView = cellViews[x];
          // draw stack bricks
          cellView.classList.remove('brick');
          if (cellModel) {
            cellView.classList.add('brick');
          }
          // draw dropping bricks
          cellView.classList.remove('dropping');
          if (
            x >= droppingOffset.x &&
            x < droppingOffset.x + droppingSize.width &&
            y >= droppingOffset.y &&
            y < droppingOffset.y + droppingSize.height
          ) {
            const droppingModel = dropping.shape.form[y - droppingOffset.y][x - droppingOffset.x];
            if (droppingModel) {
              cellView.classList.add('brick');
              cellView.classList.add('dropping');
            }
          }
        });
      });
      // draw preparing
      preparingRows.forEach((rowView, y) => {
        const rowModel = preparing.form[y];
        const cellViews = Array.prototype.slice.apply(rowView.children);
        cellViews.forEach((cellView, x) => {
          const cellModel = rowModel ? rowModel[x] : 0;
          // draw stack bricks
          cellView.classList.remove('brick');
          if (cellModel) {
            cellView.classList.add('brick');
          }
        });
      });
      // complete
      const { stackPanel, preparingPanel } = this;
      resolve({ stackPanel, preparingPanel });
    });
  };

  _initialize = (stack) => {
    if (!this.size || this.size.height !== stack.length || this.size.width !== stack[0].length) {
      // reset the whole stage
      this.size = { height: stack.length, width: stack[0] ? stack[0].length : undefined };
      Array.prototype.slice.apply(this.stackPanel.children).forEach((child) => this.stackPanel.removeChild(child));
      const rows = createDomMatrix(this.size);
      rows.forEach((row) => this.stackPanel.appendChild(row));
    }
    if (!this.preparingPanel.children.length) {
      // initial preparing panel
      createDomMatrix({ width: 4, height: 4 }).forEach((child) => this.preparingPanel.appendChild(child));
    }
  };

  eliminate = ({ eliminatingIndices: indices }) => {
    return new Promise((resolve) => {
      if (!indices || !indices.length) {
        resolve();
        return;
      }
      const rows = Array.prototype.slice.apply(this.stackPanel.children);
      const rowsExchanging = createDomMatrix({ height: indices.length, width: this.size.width });
      const rowsEliminating = rows.filter((_, index) => indices.indexOf(index) >= 0);
      rowsEliminating.forEach((row) => {
        row.classList.add('blinking');
      });
      rowsExchanging.forEach((row) => {
        row.classList.add('dismissing');
        this.stackPanel.insertBefore(row, this.stackPanel.firstChild);
      });
      setTimeout(() => {
        Promise.all([
          ...rowsEliminating.map((row) => {
            return new Promise((resolveRow) => {
              row.addEventListener('transitionend', () => {
                this.stackPanel.removeChild(row);
                row.classList.remove('dismissing');
                resolveRow();
              });
              row.classList.remove('blinking');
              row.classList.add('dismissing');
            });
          }),
          ...rowsExchanging.map((row) => {
            return new Promise((resolveRow) => {
              row.classList.remove('dismissing');
              row.addEventListener('transitionend', () => {
                resolveRow();
              });
            });
          }),
        ]).then(resolve);
      }, 300);
    });
  };
}
