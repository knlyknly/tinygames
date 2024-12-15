import { TetrisGameOver, TetrisModel } from "./tetris-model.mjs";
import { TetrisView } from "./tetris-view.mjs";

export class Tetris {

  actionProviders = [];
  actionEnabled = false;
  model = null;
  view = null;

  constructor({ height, width } = { height: 20, width: 10 }) {
    this.model = new TetrisModel({ height, width });
    this.view = new TetrisView();
  }

  addActionProvider = (provider) => {
    this.actionProviders.push(provider);
    provider.addEventListener('action', this.handleAction);
    return () => this.removeActionProvider(provider);
  }

  removeActionProvider = (provider) => {
    const index = this.actionProviders.findIndex(v => v === provider);
    if (index >= 0) {
      provider.removeEventListener('action', this.handleAction);
      this.actionProviders.splice(index, 1);
    }
  }

  toggleActionProviders = (enable = null) => {
    if (enable === null) {
      this.toggleActionProviders(!this.actionEnabled);
      return;
    }
    if (!this.actionEnabled) {
      this.actionEnabled = true;
      this.actionProvider.forEach(provider => {
        provider.toggle(this.actionEnabled)
      });
    } else {
      this.actionEnabled = false;
      this.actionProvider.forEach(provider => {
        provider.toggle(this.actionEnabled);
      });
    }
  }

  handleAction = ({ action }) => {
    try {
      const result = this.model.handleAction(action);
      switch (result.status) {
        case 'moved':
          // TODO play sound
          this.view.redraw(result);
          break;
        case 'blocked':
          // TODO play sound
          break;
        case 'eliminating':
          this.toggleActionProviders(false);
          this.view.eliminate(result).then(() => {
            this.model.elminiate();
            return this.view.redraw(this.model)
          }).then(() => {
            this.toggleActionProviders(true);
          });
          break;
      }
    } catch (e) {
      if (e instanceof TetrisGameOver) {
        // TODO show game over
      }
    }
  }
}