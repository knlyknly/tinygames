import { TetrisGameOver, TetrisModel } from './tetris-model.mjs';
import { TetrisView } from './tetris-view.mjs';

export class Tetris {
  actionProviders = [];
  actionEnabled = false;
  model = null;
  view = null;

  constructor({ height, width } = { height: 20, width: 10 }) {
    this.model = new TetrisModel({ height, width });
    this.view = new TetrisView();
  }

  appendTo = (...args) => {
    this.view.appendTo(...args);
  };

  addActionProvider = (provider) => {
    this.actionProviders.push(provider);
    provider.addListener('action', this.handleAction);
    return () => this.removeActionProvider(provider);
  };

  removeActionProvider = (provider) => {
    const index = this.actionProviders.findIndex((v) => v === provider);
    if (index >= 0) {
      provider.removeListener('action', this.handleAction);
      this.actionProviders.splice(index, 1);
    }
  };

  toggleActionProviders = (enable = null) => {
    if (enable === null) {
      this.toggleActionProviders(!this.actionEnabled);
      return;
    }
    if (enable && !this.actionEnabled) {
      this.actionEnabled = true;
      this.actionProviders.forEach((provider) => {
        provider.toggle(this.actionEnabled);
      });
    }
    if (!enable && this.actionEnabled) {
      this.actionEnabled = false;
      this.actionProviders.forEach((provider) => {
        provider.toggle(this.actionEnabled);
      });
    }
  };

  handleAction = (action) => {
    try {
      const result = this.model.handleAction(action);
      switch (result.status) {
        case 'moved':
          // TODO play sound
          this.view.redraw(result);
          break;
        case 'blocked':
          this.view.redraw(this.model);
          // TODO play sound
          break;
        case 'merging':
          this.toggleActionProviders(false);
          this.view
            .eliminate(result)
            .then(() => {
              result.onmerged();
              return this.view.redraw(this.model);
            })
            .then(() => {
              this.toggleActionProviders(true);
            });
          break;
      }
    } catch (e) {
      if (e instanceof TetrisGameOver) {
        // TODO show game over
        this.toggleActionProviders(false);
        console.log('Game over');
      } else {
        console.error(e);
      }
    }
  };
}
