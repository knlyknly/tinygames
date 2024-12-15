import { Action } from "./tetris-model.mjs";

export class TetrisTimerActionProvider extends EventTarget {

  static INTERVAL_1 = 500;
  static INTERVAL_9 = 300;

  enable = false;
  speed = 1;

  _timer = null;
  _triggered = null;
  _elapsed = 0;

  get _interval() {
    return Math.floor(TetrisTimerActionProvider.INTERVAL_1 * (9 - this.speed) / 8 + TetrisTimerActionProvider.INTERVAL_9 * (this.speed - 1) / 8);
  }

  setSpeed = (speed) => {
    if (speed >= 1 && speed <= 9) {
      this.speed = speed;
    }
  }

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
      const elapsed = new Date().getTime() - this._trigger.getTime();
      this._elapsed = 0 <= elapsed && elapsed < this._interval ? elapsed : 0;
      clearTimeout(this._timer);
    }
  }

  _trigger = () => {
    this._triggered = new Date();
    this.dispatchEvent('action', this._event(Action.DOWN));
    this._timer = this.setTimeout(() => {
      this._trigger();
    }, this._interval);
  }

  _event = (action) => {
    const event = new Event();
    event.action = action;
    return event;
  }
}

export const KeyMaps = {
  Keyboard1: {
    'ArrowLeft': Action.LEFT,
    'ArrowRight': Action.RIGHT,
    'ArrowUp': Action.COUNTERCLOCKWISE,
    'ArrowDown': Action.DOWN,
  },
  Keyboard2: {
    'e': Action.COUNTERCLOCKWISE,
    'E': Action.COUNTERCLOCKWISE,
    'd': Action.DOWN,
    'D': Action.DOWN,
    's': Action.LEFT,
    'S': Action.LEFT,
    'f': Action.RIGHT,
    'F': Action.RIGHT,
    'ArrowLeft': Action.COUNTERCLOCKWISE,
    'ArrowRight': Action.CLOCKWISE,
  },
};

export class TetrisKeyboardInputActionProvider extends EventTarget {
  enabled = false;
  downkey = null;
  keyMap = null;

  constructor(keyMap) {
    this.keyMap = keyMap;
  }

  toggle = (enable) => {
    if (enable === undefined) {
      this.enabled = !this.enabled;
      if (this.enabled) {
        this._enable();
      } else {
        this._disable();
      }
    } else if (enable) {
      if (!this.enabled) {
        this._enable();
      }
    } else {
      if (this.enabled) {
        this._disable();
      }
    }
  }

  _enable = () => {
    window.addEventListener('keydown', this._onkeydown);
    window.addEventListener('keyup', this._onkeyup);
  }

  _disable = () => {
    window.removeEventListener('keydown', this._onkeydown);
    window.removeEventListener('keyup', this._onkeyup);
  }

  _onkeydown = (evt) => {
    this.downkey = evt.key;
    const action = this.keyMap[this.downkey];
    if (action) {
      this.dispatchEvent('action', this._event(action));
    }
  }

  _onkeyup = (evt) => {
    this.downkey = null;
  }

  _event = (action) => {
    const event = new Event();
    event.action = action;
    return event;
  }
}