import DomGenerator from '../../../_tools/dom-generator.mjs';
import searcherInput from './searcher-input.mjs';

export default await DomGenerator.defineBy(import.meta.resolve('./searcher.html'), {
  slots: {
    input: {
      generator: searcherInput,
      init: ({ self, element }) => {
        AMap.plugin(['AMap.AutoComplete'], () => {
          const autoOptions = {
            input: element,
          };
          const autoComplete = new AMap.AutoComplete(autoOptions);
          autoComplete.on('select', (e) => {
            self.dispatch('place', e.poi);
            console.log(e.poi);
          });
        });
        // return element.addEventListener('input', (evt) => {
        //   self.dispatch('value', evt.target.value);
        // });
      },
    },
  },
  bindings: {
    value: _.debounce((self, value) => {
      AMap.prompt(value);
    }, 300),
  },
});
