import { TetrisKeyboardInputActionProvider, TetrisTimerActionProvider, KeyMaps } from './tetris-input.mjs';
import { Tetris } from './tetris.mjs';

window.addEventListener('load', () => {
  document.getElementById('startButton').addEventListener('click', restart);
  restart();
});

const restart = (() => {
  const inputActionProvider = new TetrisKeyboardInputActionProvider(KeyMaps.Keyboard1);
  const timerActionProvider = new TetrisTimerActionProvider();
  const joystickActionProvider = new TetrisJoystickActionProvider(KeyMaps.Joystick1);
  let tetris;
  return () => {
    const height = document.querySelector('#rowsInput').value * 1;
    const width = document.querySelector('#colsInput').value * 1;
    if (tetris) {
      tetris.toggleActionProviders(false);
      tetris.removeActionProvider(inputActionProvider);
      tetris.removeActionProvider(timerActionProvider);
    }
    tetris = new Tetris({ width, height });
    tetris.addActionProvider(inputActionProvider);
    tetris.addActionProvider(timerActionProvider);
    tetris.toggleActionProviders(true);
    tetris.appendTo();
  };
})();

// handleInputs = (inputs) => {
//   let dirty = false;
//   const actions = inputs.map(this.getActionFromInput);
//   // check if the frame is force dropping to move down
//   this.frameCount += this.frameSpeed;
//   if (this.frameCount >= this.framePerSecond) {
//     actions.push(Action.DOWN);
//     this.frameCount = 0;
//   }
//   // if there's something need to be done
//   if (actions.length) {
//     while (actions.length) {
//       const dropping = this._getAttemptDropping(action);
//       if (dropping) {
//         this.dropping = dropping;
//         dirty = true;
//       } else {
//         if (action === Action.DOWN) {
//           this._merge();
//           dirty = true;
//         }
//       }
//       // TODO play action sound
//     }
//     // check if dropping merged
//     if (this.dropping.merged) {
//       if (this._isDroppingValid(this.dropping, true)) {
//         // TODO game over
//         return;
//       } else {
//         Object.assign(this, {
//           preparing: createRandomShape(),
//           dropping: {
//             shape: this.preparing,
//             offset: [Math.floor(cols / 2) - 1, -3],
//             merged: false,
//           }
//         })
//       }
//     }
//     // check if the stack changed

//   }
// }
