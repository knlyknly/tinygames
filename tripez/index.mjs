import { Label, MapPoint, Node } from './tripez-model.mjs';
import DomGenerator from '../_tools/dom-generator.mjs';

window.addEventListener('load', async () => {
  //   const mp = MapPoint.of({ altitude: 0, longitude: 0, latitude: 0 });
  //   console.log(mp.toMarkString());
  const container = document.getElementById("map-container");
  // const map = new google.maps.Map(container, {
  //   zoom: 8, center: { lat: 37.841157, lng: -122.551679 }, mode: google.maps.maps3d.MapMode.HYBRID
  // });

  const { Map3DElement } = await google.maps.importLibrary("maps3d");
  const map = new Map3DElement({
    center: { lat: 37.7704, lng: -122.3985, altitude: 500 },
    tilt: 67.5,
    mode: 'HYBRID'
  });
  container.append(map);

  map.addEventListener('click', evt => {
    window.evt = evt;
    console.log(evt);
  })

  const tripezStartButtonFactory = DomGenerator.defineBy(import.meta.resolve('./html/md-branded-fab.html'));
  console.log({ map, tripezStartButtonFactory })
});