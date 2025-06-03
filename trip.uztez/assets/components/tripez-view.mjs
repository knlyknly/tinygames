import searcherGenerator from './searcher.mjs';

export class TripView {
  static init = async (container) => {
    const searcher = searcherGenerator.generate();
    container.appendChild(searcher);
  };
  searcher;
  constructor({ searcher }) {
    this.searcher = searcher;
  }
}

export default TripView;