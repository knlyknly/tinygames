const createDomMatrix = (size) => {
  return Array(size.height).fill(0).map(_ => {
    const row = document.createElement('div');
    const array = Array(size.width).fill(0).map(_ => document.createElement('div'));
    array.forEach(cell => row.appendChild(cell));
    return row;
  });
};

export class TetrisView {

  stackPanel = document.createElement('div');
  preparingPanel = document.createElement('div');
  size = null;

  redraw = ({ stack, dropping, preparing }) => {
    if (!stack || !stack.length || !dropping?.shape?.form || !dropping.offset) {
      return new Promise((_, reject) => reject());
    }
    return new Promise((resolve) => {
      this._initialize(stack);
      const [rows, preparingRows] = [this.stackPanel, this.preparingPanel].map(panel => Array.prototype.slice.apply(panel.children));
      const [size, droppingSize, droppingOffset] = [
        this.size,
        { width: dropping.shape.form[0].length, height: dropping.shape.form.length },
        { x: this.dropping.offset[0], y: this.dropping.offset[1] },
      ];
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
          if (x >= droppingOffset.x && x < droppingOffset.x + droppingSize.width && y >= droppingOffset.y && y < droppingOffset.y + droppingSize.height) {
            const droppingModel = dropping.shape.form[y - droppingOffset.y][x - droppingOffset.x];
            if (droppingModel) {
              cellView.classList.add('brick');
              cellView.classList.add('dropping');
            }
          }
        });
      });
      // draw preparing
      preparing.forEach((rowModel, y) => {
        const rowView = preparingRows[y];
        const cellViews = Array.prototype.slice.apply(rowView.children);
        rowModel.forEach((cellModel, x) => {
          const cellView = cellViews[x];
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
    })
  }

  _initialize = (stack) => {
    if (!this.size || this.size.height !== stack.length || this.size.width !== stack[0].length) {
      // reset the whole stage
      this.size = { height: stack.length, width: stack[0] ? stack[0].length : undefined };
      Array.prototype.slice.apply(this.stackPanel.children).forEach(child => this.stackPanel.removeChild(child));
      const rows = createDomMatrix(this.size);
      rows.forEach(row => this.stackPanel.appendChild(row));
    }
    if (!this.preparingPanel.children.length) {
      // initial preparing panel
      createDomMatrix({ width: 4, height: 4 }).forEach(child => this.preparingPanel.appendChild(child));
    }
  }

  eliminate = ({ indices }) => {
    return new Promise(resolve => {
      const rowsExchanging = createDomMatrix({ height: indices.length, width: this.size.width });
      const rowsEliminating = this.rows.filter((_, index) => indices.indexOf(index) >= 0);
      rowsEliminating.forEach((row) => {
        row.classList.add('blinking');
      });
      setTimeout(() => {
        Promise
          .all([
            ...rowsEliminating.map((row) => {
              return new Promise(resolveRow => {
                row.addEventListener('transitionend', () => {
                  resolveRow();
                  row.classList.remove('dismissing');
                });
                row.classList.remove('blinking');
                row.classList.add('dismissing');
              });
            }),
            ...rowsExchanging.map(row => {
              return new Promise(resolveRow => {
                row.addEventListener('transitionend', () => {
                  resolveRow();
                  row.classList.remove('appearing');
                });
                row.classList.add('appearing');
              });
            }),
          ])
          .then(resolve)
      }, 500);
    });
  }


}