import { createRandomShape } from './tetris-pattern.mjs';

export const Action = {
  DOWN: 'down',
  LEFT: 'left', RIGHT: 'right',
  COUNTERCLOCKWISE: 'counter-clockwise', CLOCKWISE: 'clockwise',
};

export class TetrisGameOver extends Error { }

export class TetrisModel extends EventTarget {

  score = 0;

  stack = null;
  preparing = null;
  dropping = null;

  constructor({ height, width } = { height: 20, width: 10 }) {
    Object.assign(this, {
      score: 0,
      stack: Array(height).fill(0).map(v => Array(width).fill(0)),
      preparing: createRandomShape(),
      dropping: {
        shape: createRandomShape(),
        offset: [Math.floor(width / 2) - 1, -3],
        merged: false,
      }
    });
  }

  /**
   * 
   * @param {*} action 
   * @throws (TetrisGameOver)
   */
  handleAction = (action) => {
    const { stack, dropping, preparing } = this;
    const attemptDropping = this._getAttemptDropping(action);
    if (attemptDropping) {
      // transformed
      this.dropping = attemptDropping;
      return { status: 'moved', stack, dropping, preparing };
    }
    if (action === Action.DOWN) {
      this._merge();
      const indices = this._getEliminatingIndices();
      if (indices.length) {
        return { status: 'eliminating', indices };
      }
    }
    // nothing changed
    return { status: 'blocked' };
  }

  _getEliminatingIndices = () => {
    return this.stack.reduce((indices, row, index) => {
      const count = row.reduce((s, v) => s + v, 0);
      if (count === row.length) {
        indices.push(index);
      }
      return indices;
    }, []);
  }

  eliminate = (indices) => {
    const width = this.stack[0].length;
    indices.forEach(index => {
      this.stack.splice(index, 1);
      this.stack.unshift(Array(width).fill(0));
    });
  }

  /**
   * Apply current dropping to the stack.
   * Mark the dropping as 'merged'.
   */
  _merge = () => {
    // check if it overflowed
    if (!this._isDroppingValid(this.dropping, true)) {
      throw new TetrisGameOver();
    }
    const { shape, offset: [offsetx, offsety] } = this.dropping;
    for (let y = shape.length - 1; y >= 0; y++) {
      const row = shape[y];
      const stackrow = stack[offsety + y];
      for (let x = 0; x < row.length; x++) {
        stackrow[offsety + y][offsetx] += row[x];
      }
      this.dropping.merged = true;
    }
  }

  /**
   * 
   * @param {Action} action 
   * @returns The result of action if success. Getting 'null' if the action not available.
   */
  _getAttemptDropping = (action) => {
    let dropping = null;
    switch (action) {
      case Action.LEFT:
      case Action.RIGHT:
      case Action.DOWN:
        dropping = {
          ...this.dropping,
          offset:
            action === Action.LEFT ? [this.offset[0] - 1, this.offset[1]] :
              action === Action.RIGHT ? [this.offset[0] + 1, this.offset[1]] :
                action === Action.DOWN ? [this.offset[0], this.offset[1] + 1] :
                  null
        };
        break;
      case Action.CLOCKWISE:
      case Action.COUNTERCLOCKWISE:
        const alt = action === CLOCKWISE ? 1 : -1;
        const index = (this.dropping.shape.index + alt + this.dropping.shape.pattern.forms.length) % this.dropping.shape.pattern.forms.length;
        const form = this.dropping.shape.pattern.forms[index];
        dropping = {
          ...this.dropping,
          shape: {
            ...dropping.shape,
            index,
            form
          }
        }
        break;
    }
    if (this._isDroppingValid(dropping)) {
      return dropping;
    }
    return null;
  }

  /**
   * Validate if the dropping is available to current stack.
   * @param {*} dropping 
   * @param {boolean} checkTop
   * @returns true if no conflict with current stack and its boundary; false otherwise.
   */
  _isDroppingValid = (dropping, checkTop = false) => {
    if (!dropping) {
      return false;
    }
    const { shape: { form }, offset: [offsetx, offsety] } = dropping;
    for (let y = form.length - 1; y >= 0; y++) {
      const row = form[y];
      const stackrow = stack[offsety + y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 1) {
          if (checkTop && offsety + y <= 0) {
            // outbounded on top
            return false;
          }
          if (offsety + y >= this.stack.length) {
            // outbounded on bottom
            return false;
          }
          if (offsetx + x < 0 || offsetx + x >= stackrow.length) {
            // outbounded on side
            return false;
          }
          if (stackrow[offsetx + x] === 1) {
            // overlapped existing stack
            return false;
          }
        }
      }
    }
    return true;
  }
};