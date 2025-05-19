const toMapPointMarkString = (mp) => `⩘ ${mp.altitude} ◑ ${mp.longitude} ◒ ${mp.latitude}`;

export class Label {
  type;
  key;
  static of = ({ type, key }) => new Label({ type, key });
  constructor({ type, key }) {
    Object.assign(this, { type, key });
  }
}

export class MapPoint {
  altitude;
  longitude;
  latitude;
  static of = ({ altitude, longitude, latitude }) => new MapPoint({ altitude, longitude, latitude });
  constructor({ altitude, longitude, latitude }) {
    Object.assign(this, { altitude, longitude, latitude, id: md5(toMapPointMarkString(this)) });
  }
  toMarkString = () => toMapPointMarkString(this);
}

export class Node {
  id;
  position;
  name;
  description;
  labels = [];
  links = [];
}