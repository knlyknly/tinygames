import { generate } from "../../_tools/platform/dom/generate.mjs";

export default {
  render: targetEl => {
    const slots = {
      replayBoard: generate({
        class: 'replay-board'
      }),
    };
    targetEl.appendChild(slots.replayBoard);
    return {
      release: () => {
        targetEl.removeChild(slots.replayBoard);
      },
    };
  }
};