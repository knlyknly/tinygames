import TripezModel from './tripez-model.mjs';
import hash from '../tools/hash.mjs';
import {
  REG_LOCATION_LINE,
  calcHoursBetween,
  fromGeolocationText,
  fromScheduleDayText,
} from './tripez-format.mjs';

/**
 * 从文本格式解析行程
 * @param {string} text 行程文本
 * @returns {TripezModel} TripezModel实例
 * @throws {Error} 如果文本格式无效
 */
export function fromText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  // 标准化行尾，确保在Windows和MacOS上行为一致
  const normalizedText = text.replace(/\r\n/g, '\n');

  const model = new TripezModel();
  const lines = normalizedText.split('\n');
  let currentDay = null;
  let currentDayItems = [];
  let lastLocation = null;
  let lastRouteInfo = null;
  let lastScheduleItemOfLocationType = null;
  let currentDayInfo = null;
  let currentWeekDate = null;
  const geolocations = []; // 存储解析到的地理信息

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过空行和分隔行
    if (!line || line.startsWith('=')) continue;

    // 解析地理信息行
    if (line.startsWith('φ')) {
      const geolocation = fromGeolocationText(line);
      if (geolocation) {
        geolocations.push(geolocation);
        lastLocation = geolocation;
      }
      continue;
    }

    // 解析日期行
    if (line.match(/^(?:[-]?\d+d|d\d+)/)) {
      if (currentDay) {
        // 如果有scheduleItems，创建scheduleItemIds
        if (currentDayItems.length > 0) {
          currentDay.scheduleItemIds = currentDayItems.map((item) => item.id);
        }
        model.scheduleDays.push(currentDay);
        model.scheduleItems.push(...currentDayItems);
        currentDayItems = [];
      }

      // 使用fromScheduleDayText解析日期行
      currentDay = fromScheduleDayText(line);
      currentDayInfo = currentDay.name.split(' ')[0]; // 获取day number部分
      currentWeekDate = currentDay.date ? `w${currentDay.weekday}-${currentDay.date}` : null;
      lastLocation = null;
      lastRouteInfo = null;
      continue;
    }

    // 解析路线行
    if (line.startsWith('    ↓')) {
      const routeInfo = line.match(/\((\d+)km-(\d+(?:\.\d+)?)h\)/);
      if (routeInfo && lastLocation) {
        const [_, distanceStr, durationStr] = routeInfo;
        const distance = parseInt(distanceStr);
        const duration = parseFloat(durationStr);
        if (!isNaN(distance) && !isNaN(duration)) {
          lastRouteInfo = { distance, duration };
        }
      }
      continue;
    }

    // 解析地点行
    if (line.match(/^\d{2}:\d{2}/)) {
      const timeMatch = line.match(REG_LOCATION_LINE);
      if (timeMatch) {
        const [_, time, locationInfo, altitude, locationRest = '', routeInfo] = timeMatch;
        const [mainLocation, ...destinations] = (locationInfo + locationRest)
          .split('&')
          .map((s) => s.trim());

        // 检查是否已存在同名地点
        let location = model.locations.find((l) => l.name === mainLocation);

        if (!location) {
          // find destinations from model, create if not exist
          let dests = destinations.map((d) => {
            let dest = model.destinations.find((l) => l.name === d);
            if (!dest) {
              dest = {
                id: hash(d),
                name: d,
              };
              model.destinations.push(dest);
            }
            return dest;
          });
          // 创建新地点
          location = {
            id: hash(mainLocation),
            name: mainLocation,
          };
          if (altitude >= 0) {
            location.altitude = altitude * 1;
          }
          if (dests?.length > 0) {
            location.destinationIds = dests.map((d) => d.id);
          }
          model.locations.push(location);
        }

        // 创建地点项
        const scheduleItemSummary = `${currentDayInfo} ${time} ${location.name}`;
        const scheduleItem = {
          id: hash(scheduleItemSummary),
          name: scheduleItemSummary,
          type: 'location',
          locationId: location.id,
          time: time,
        };

        // 处理route
        if (lastLocation && lastRouteInfo) {
          // 算出scheduleItem.lastScheduleItemOfLocationType.time之间相差的小时数
          let hourDiff = calcHoursBetween(lastScheduleItemOfLocationType.time, scheduleItem.time);
          // 如果相差的小时数大于lastRouteInfo的duration，那么认为多出来的部分为lastScheduleItem的stayTime
          if (hourDiff > lastRouteInfo.duration) {
            lastScheduleItemOfLocationType.stayTime = hourDiff - lastRouteInfo.duration;
          }
          // 查找lastLocation和location之间已经存在的route
          let route = model.routes.find(
            (r) => r.startLocationId === lastLocation.id && r.endLocationId === location.id
          );
          // check if route exists
          if (route) {
            // update the duration
            route.durationForward = lastRouteInfo.duration;
          } else {
            // if the route doesn't exist, try find the backward route
            route = model.routes.find(
              (r) => r.startLocationId === location.id && r.endLocationId === lastLocation.id
            );
            // check if backward route exists
            if (route) {
              // check if possibly same route, if route.distance is too different to lastRouteInfo.distance
              let possiblySameRoute =
                Math.abs(route.distance - lastRouteInfo.distance) < route.distance * 0.05;
              if (possiblySameRoute) {
                route.durationBackward = lastRouteInfo.duration;
              } else {
                // create another route for lastLocation → location because it's actually another route
                const newRoute = {
                  id: hash(`${lastLocation.name} → ${location.name}`),
                  name: `${lastLocation.name} → ${location.name}`,
                  startLocationId: location.id,
                  endLocationId: lastLocation.id,
                  distance: lastRouteInfo.distance,
                  durationForward: lastRouteInfo.duration,
                };
                model.routes.push(newRoute);
                route = newRoute;
              }
            } else {
              route = {
                id: hash(`${lastLocation.name} → ${location.name}`),
                name: `${lastLocation.name} → ${location.name}`,
                startLocationId: lastLocation.id,
                endLocationId: location.id,
                distance: lastRouteInfo.distance,
                durationForward: lastRouteInfo.duration,
              };
              model.routes.push(route);
            }
          }

          // 创建route类型的ScheduleItem
          const scheduleItemSummary = `${currentDayInfo} ${lastScheduleItemOfLocationType.time}-${scheduleItem.time} ${route.name}`;
          currentDayItems.push({
            id: hash(scheduleItemSummary),
            name: scheduleItemSummary,
            type: 'route',
            routeId: route.id,
            direction: route.startLocationId === lastLocation.id ? 'forward' : 'backward',
            distance: lastRouteInfo.distance,
            duration: lastRouteInfo.duration,
          });

          lastRouteInfo = null;
        }

        // 处理路线信息（地点行中的routeInfo表示下一个地点之间的route）
        if (routeInfo) {
          const [distanceStr, durationStr] = routeInfo.split('-');
          const distance = parseInt(distanceStr);
          const duration = parseFloat(durationStr.replace('h', ''));
          if (!isNaN(distance) && !isNaN(duration)) {
            lastRouteInfo = { distance, duration };
          }
        }

        currentDayItems.push(scheduleItem);
        lastScheduleItemOfLocationType = scheduleItem;
        lastLocation = location;
      }
      continue;
    }
    // 解析补充说明
    if (line.match(/^\s{5}/)) {
      if (lastScheduleItemOfLocationType) {
        if (!lastScheduleItemOfLocationType.additionDescriptions) {
          lastScheduleItemOfLocationType.additionDescriptions = [];
        }
        let comment = line.trim();
        if (!comment.startsWith('φ') && !comment.startsWith('★')) {
          comment = '★ ' + comment;
        }
        lastScheduleItemOfLocationType.additionDescriptions.push(comment);
      }
      continue;
    }
  }

  // 处理最后一天
  if (currentDay) {
    // 如果有scheduleItems，创建scheduleItemIds
    if (currentDayItems.length > 0) {
      currentDay.scheduleItemIds = currentDayItems.map((item) => item.id);
    }
    model.scheduleDays.push(currentDay);
    model.scheduleItems.push(...currentDayItems);
  }

  // 合并地理信息到locations
  for (const geo of geolocations) {
    if (geo.name) {
      // 查找同名location
      let location = model.locations.find((l) => l.name === geo.name);
      if (!location) {
        // 创建新location
        location = {
          id: hash(geo.name),
          name: geo.name,
        };
        model.locations.push(location);
      }
      // 更新location
      Object.assign(location, geo);
    }
  }

  return model;
}