import { ready } from '../../_tools/laml/web/ready.mjs';
import AMapInitializer from './tools/amap-initializer.mjs';
import { TripView } from './components/tripez-view.mjs';

ready(async () => {
  window.tripez = {};
  const container = document.querySelector('#container');
  tripez.amapShower = await AMapInitializer.init(container);
  tripez.view = await TripView.init(document.body);
  // tripez.amap = tripez.amapShower();
});

const view = await import('./components/tripez-view.mjs');
const viewAgain = await import('./components/tripez-view.mjs');

console.log({ view, viewAgain });
