import { createRandomShape } from './tetris-pattern.mjs';

export const Action = {
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  COUNTERCLOCKWISE: 'counter-clockwise',
  CLOCKWISE: 'clockwise',
};

export class TetrisGameOver extends Error {}

export class TetrisModel {
  score = 0;

  stack = null;
  preparing = null;
  dropping = null;

  constructor({ height, width } = { height: 20, width: 10 }) {
    Object.assign(this, {
      score: 0,
      stack: Array(height)
        .fill(0)
        .map((v) => Array(width).fill(0)),
      preparing: createRandomShape(),
      dropping: {
        shape: createRandomShape(),
        offset: [Math.floor(width / 2) - 2, -3],
      },
    });
  }

  /**
   *
   * @param {*} action
   * @throws (TetrisGameOver)
   */
  handleAction = (action) => {
    const attemptDropping = this._getAttemptDropping(action);
    if (attemptDropping) {
      // transformed
      this.dropping = attemptDropping;
      return { status: 'moved', ...this };
    } else if (action === Action.DOWN) {
      this._merge();
      const eliminatingIndices = this._getEliminatingIndices();
      return { status: 'merging', eliminatingIndices, onmerged: () => this._onmerged(eliminatingIndices) };
    }
    // nothing changed
    return { status: 'blocked' };
  };

  _getEliminatingIndices = () => {
    return this.stack.reduce((indices, row, index) => {
      const count = row.reduce((s, v) => s + v, 0);
      if (count === row.length) {
        indices.push(index);
      }
      return indices;
    }, []);
  };

  _onmerged = (eliminatingIndices) => {
    let score = 0;
    const width = this.stack[0].length;
    if (eliminatingIndices && eliminatingIndices.length) {
      eliminatingIndices.forEach((index) => {
        this.stack.splice(index, 1);
        this.stack.unshift(Array(width).fill(0));
        score = score * 2 + 100;
      });
    }
    Object.assign(this, {
      score: this.score + score,
      preparing: createRandomShape(),
      dropping: {
        shape: this.preparing,
        offset: [Math.floor(width / 2) - 2, -3],
      },
    });
  };

  /**
   * Apply current dropping to the stack.
   */
  _merge = () => {
    // check if it overflowed
    if (!this._isDroppingValid(this.dropping, true)) {
      throw new TetrisGameOver();
    }
    const {
      stack,
      dropping: {
        shape: { form },
        offset: [offsetx, offsety],
      },
    } = this;
    for (let y = form.length - 1; y >= 0; y--) {
      const row = form[y];
      const stackrow = stack[offsety + y];
      if(!stackrow) {
        continue;
      }
      for (let x = 0; x < row.length; x++) {
        if ( offsetx + x < 0 || offsetx + x >= stackrow.length) {
          continue;
        }
        stackrow[offsetx + x] += row[x];
      }
    }
  };

  /**
   *
   * @param {Action} action
   * @returns The result of action if success. Getting 'null' if the action not available.
   */
  _getAttemptDropping = (action) => {
    const { shape, offset } = this.dropping;
    let dropping = null;
    switch (action) {
      case Action.LEFT:
      case Action.RIGHT:
      case Action.DOWN:
        dropping = {
          ...this.dropping,
          offset:
            action === Action.LEFT
              ? [offset[0] - 1, offset[1]]
              : action === Action.RIGHT
              ? [offset[0] + 1, offset[1]]
              : action === Action.DOWN
              ? [offset[0], offset[1] + 1]
              : null,
        };
        break;
      case Action.CLOCKWISE:
      case Action.COUNTERCLOCKWISE:
        const alt = action === Action.CLOCKWISE ? 1 : -1;
        const index = (shape.index + alt + shape.pattern.forms.length) % shape.pattern.forms.length;
        const form = shape.pattern.forms[index];
        dropping = {
          ...this.dropping,
          shape: {
            ...shape,
            index,
            form,
          },
        };
        break;
    }
    if (this._isDroppingValid(dropping)) {
      return dropping;
    }
    return null;
  };

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
    const { stack } = this;
    const {
      shape: { form },
      offset: [offsetx, offsety],
    } = dropping;
    for (let y = form.length - 1; y >= 0; y--) {
      const row = form[y];
      const stackrow = stack[offsety + y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 1) {
          if (checkTop && offsety + y < 0) {
            // outbounded on top
            return false;
          }
          if (offsety + y >= stack.length) {
            // outbounded on bottom
            return false;
          }
          if (offsetx + x < 0 || (stackrow && offsetx + x >= stackrow.length)) {
            // outbounded on side
            return false;
          }
          if (stackrow && stackrow[offsetx + x] >= 1) {
            // overlapped existing stack
            return false;
          }
        }
      }
    }
    return true;
  };
}
