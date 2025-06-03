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

export class Link {
  id;
  name;
  idNodeStart;
  idNodeEnd;
  nodeStart;
  nodeEnd;
  description;
  distance;
  roadType;
  elapseForward;
  elapseBackward;
}

export class TripPlan {
  id;
  name;
  dateStart;
  dateEnd;
  stayPlans = [];
  dayPlanSequence = [];
}

export class DayPlan {
  id;
  idTripPlan;
  tripPlan;
  order;
  description;
  stayPlanSequence = [];
}

export class StayPlan {
  id;
  idNode;
  elapseStay;
  description;
  expectedTimeInterval; // for example, peaks or beaches may have sunrise/sunset.
  expectedDatetimeInterval; // for example, the sun/moon position on special date/time.
}

export class ActivityPlan {
  id;
  name;
  description;
  stayPlans = [];
}