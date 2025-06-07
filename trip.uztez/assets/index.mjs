import { ready } from '../../_tools/laml/web/ready.mjs';
import AMapInitializer from './tools/amap-initializer.mjs';
import { TripView } from './components/tripez-view.mjs';
import getLocationSearchMap from './tools/get-location-search-map.mjs';
import GeographicService from './tools/geographic-service.mjs';

ready(async () => {
  const locationSearchMap = getLocationSearchMap();
  const amapApiKey = locationSearchMap.amapApiKey;
  const tripez = {};
  window.tripez = {};
  const container = document.querySelector('#container');
  tripez.amapShower = await AMapInitializer.init(container);
  tripez.view = await TripView.init(document.body);
  // tripez.amap = tripez.amapShower();
  // init amap service
  window.amapService = new GeographicService(amapApiKey);
});

const view = await import('./components/tripez-view.mjs');
const viewAgain = await import('./components/tripez-view.mjs');

console.log({ view, viewAgain });
