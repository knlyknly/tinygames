import { Action } from './tetris-model.mjs';
import { Dispatcher } from '../_tools/dispatcher.mjs';

export class TetrisTimerActionProvider extends Dispatcher {
  static INTERVAL_1 = 500;
  static INTERVAL_9 = 200;

  enable = false;
  speed = 1;

  constructor() {
    super();
  }

  _timer = null;
  _triggered = null;
  _elapsed = 0;

  get _interval() {
    return Math.floor((TetrisTimerActionProvider.INTERVAL_1 * (9 - this.speed)) / 8 + (TetrisTimerActionProvider.INTERVAL_9 * (this.speed - 1)) / 8);
  }

  setSpeed = (speed) => {
    if (speed >= 1 && speed <= 9) {
      this.speed = speed;
    }
  };

  toggle = (enable) => {
    if (enable === undefined) {
      this.toggle(!this.enable);
      return;
    }
    if (enable) {
      if (this._timer) {
        return;
      }
      this._timer = setTimeout(this._trigger, this._interval - this._elapsed);
    } else {
      if (!this._timer) {
        return;
      }
      const elapsed = this._trigger ? new Date().getTime() - this._triggered.getTime() : 0;
      this._elapsed = 0 <= elapsed && elapsed < this._interval ? elapsed : 0;
      clearTimeout(this._timer);
      this._timer = null;
    }
  };

  _trigger = () => {
    this._triggered = new Date();
    this.dispatch('action', Action.DOWN);
    this._timer = setTimeout(() => {
      this._trigger();
    }, this._interval);
  };
}

export const KeyMaps = {
  Keyboard1: {
    ArrowLeft: Action.LEFT,
    ArrowRight: Action.RIGHT,
    ArrowUp: Action.COUNTERCLOCKWISE,
    ArrowDown: Action.DOWN,
  },
  Keyboard2: {
    e: Action.COUNTERCLOCKWISE,
    E: Action.COUNTERCLOCKWISE,
    d: Action.DOWN,
    D: Action.DOWN,
    s: Action.LEFT,
    S: Action.LEFT,
    f: Action.RIGHT,
    F: Action.RIGHT,
    ArrowLeft: Action.COUNTERCLOCKWISE,
    ArrowRight: Action.CLOCKWISE,
  },
};

export class TetrisKeyboardInputActionProvider extends Dispatcher {
  enabled = false;
  keyMap = null;

  constructor(keyMap) {
    super();
    this.keyMap = keyMap;
  }

  toggle = (enable) => {
    if (enable === undefined) {
      this.toggle(!this.enabled);
      return;
    }
    if (enable && !this.enabled) {
      this.enabled = true;
      window.addEventListener('keydown', this._onkeydown);
      window.addEventListener('keyup', this._onkeyup);
    }
    if (!enable && this.enabled) {
      this.enabled = false;
      this._clear();
      window.removeEventListener('keydown', this._onkeydown);
      window.removeEventListener('keyup', this._onkeyup);
    }
  };

  _downkeys = [];
  _timer = null;

  _onkeydown = (evt) => {
    const index = this._downkeys.indexOf(evt.key);
    if (index === -1) {
      this._downkeys.push(evt.key);
      if (!this._timer) {
        let counting = 0;
        this._timer = setInterval(() => {
          if (counting === 0 || counting > 7) {
            const action = this.keyMap[this._downkeys[this._downkeys.length - 1]];
            if (action) {
              this.dispatch('action', action);
            }
          }
          counting++;
        }, 30);
      }
    }
  };

  _onkeyup = (evt) => {
    const index = this._downkeys.indexOf(evt.key);
    if (index >= 0) {
      this._downkeys.splice(index, 1);
      if (!this._downkeys.length) {
        if (this._timer) {
          clearInterval(this._timer);
          this._timer = null;
        }
      }
    }
  };

  _clear = () => {
    this._downkeys = [];
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  };
}
