import yaml from 'js-yaml';
import TripezModel from './tripez-model.mjs';
import hash from '../tools/hash.mjs';
import {
  REG_LOCATION_LINE,
  calcHoursBetween,
  toGeolocationText,
  fromGeolocationText,
  toDayOrderText,
  toScheduleDayText,
  toScheduleItemText,
} from './tripez-format.mjs';
// 行程工具类
export class Tripez {
  static fromText(text) {
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
      if (line.match(/^(?:[-]?\d+d|d\d+)\s+w\d-\d{4}/)) {
        if (currentDay) {
          // 如果有scheduleItems，创建scheduleItemIds
          if (currentDayItems.length > 0) {
            currentDay.scheduleItemIds = currentDayItems.map((item) => item.id);
          }
          model.scheduleDays.push(currentDay);
          model.scheduleItems.push(...currentDayItems);
          currentDayItems = [];
        }

        const parts = line.split(' ').filter((part) => part.trim());
        currentDayInfo = parts[0];
        currentWeekDate = parts[1];
        let distance = 0;

        // 检查是否有距离信息
        const distancePart = parts.find((part) => part.includes('km'));
        if (distancePart) {
          const distanceMatch = distancePart.match(/(\d+)km/);
          if (distanceMatch) {
            distance = parseInt(distanceMatch[1]);
          }
        }

        currentDay = {
          id: hash(currentDayInfo),
          name: `${currentDayInfo} ${currentWeekDate}`,
          order: parseInt(currentDayInfo.replace('d', '')),
          date: currentWeekDate.split('-')[1],
          weekday: parseInt(currentWeekDate.split('-')[0].replace('w', '')),
          distance: distance,
        };
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

  /**
   * 将TripezModel转换为文本格式
   * @param {TripezModel} model TripezModel实例
   * @param {Object} [options] 输出选项
   * @param {boolean} [options.compactMode=false] 是否使用紧凑模式
   * @returns {string} 行程文本
   */

  static toText(model, options = {}) {
    const lines = [];
    const detailedMap = new Map(); // 记录已显示详细信息的locationId

    for (const day of model.scheduleDays) {
      // 获取当天的行程项
      const dayItems = model.scheduleItems.filter((item) => day.scheduleItemIds.includes(item.id));

      // 计算当天的总距离（直接从scheduleItem获取）
      let totalDistance = 0;
      for (const item of dayItems) {
        if (item.distance) {
          totalDistance += item.distance;
        }
      }

      // 添加日期行
      lines.push(toScheduleDayText(day, totalDistance));

      // 添加分隔行
      lines.push('='.repeat(20));

      for (let i = 0; i < dayItems.length; i++) {
        const item = dayItems[i];
        const context = {
          detailedMap,
          options,
          dayItems,
          index: i
        };
        const { lines: itemLines, newIndex } = toScheduleItemText(item, model, context);
        lines.push(...itemLines);
        i = newIndex;
      }

      // 添加空行
      lines.push('');
    }

    // 收集并添加地理信息
    const geoLines = [];
    for (const loc of model.locations) {
      if (loc.latlng) {
        geoLines.push(toGeolocationText(loc));
      }
    }

    if (geoLines.length > 0) {
      lines.push('');
      lines.push('='.repeat(20)); // 分隔线
      lines.push(...geoLines);
    }

    return lines.join('\n');
  }

  /**
   * 从YAML格式解析行程
   * @param {string} yamlText YAML文本
   * @returns {TripezModel} TripezModel实例
   * @throws {Error} 如果YAML格式无效或缺少必要字段
   */
  static fromYaml(yamlText) {
    if (!yamlText || typeof yamlText !== 'string') {
      throw new Error('Invalid input: yamlText must be a non-empty string');
    }

    let data;
    try {
      data = yaml.load(yamlText);
    } catch (e) {
      throw new Error(`Invalid YAML format: ${e.message}`);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid YAML: must contain a valid trip object');
    }

    const model = new TripezModel();

    // 验证并加载数据
    const validateArray = (arr, name) => {
      if (!Array.isArray(arr)) {
        throw new Error(`Invalid ${name}: must be an array`);
      }
      arr.forEach((item, index) => {
        if (!item.id) {
          throw new Error(`Missing id in ${name}[${index}]`);
        }
      });
    };

    if (data.locations) {
      validateArray(data.locations, 'locations');
      model.locations = data.locations;
    }
    if (data.destinations) {
      validateArray(data.destinations, 'destinations');
      model.destinations = data.destinations;
    }
    if (data.routes) {
      validateArray(data.routes, 'routes');
      model.routes = data.routes;
    }
    if (data.scheduleDays) {
      validateArray(data.scheduleDays, 'scheduleDays');
      model.scheduleDays = data.scheduleDays;
    }
    if (data.scheduleItems) {
      validateArray(data.scheduleItems, 'scheduleItems');
      model.scheduleItems = data.scheduleItems;
    }

    return model;
  }

  /**
   * 将TripezModel转换为YAML格式
   * @param {TripezModel} model TripezModel实例
   * @returns {string} YAML文本
   */
  static toYaml(model) {
    try {
      // 准备locations数据，确保latlng字段正确序列化
      const locations = model.locations.map((loc) => {
        const { latlng, ...rest } = loc;
        if (latlng) {
          return { ...rest, latlng };
        }
        return rest;
      });

      return yaml.dump(
        {
          locations,
          destinations: model.destinations,
          routes: model.routes,
          scheduleDays: model.scheduleDays,
          scheduleItems: model.scheduleItems,
        },
        {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
        }
      );
    } catch (e) {
      throw new Error(`Failed to convert trip to YAML: ${e.message}`);
    }
  }

  /**
   * 验证行程数据的完整性
   * @throws {Error} 如果数据无效
   */
  validate() {
    // 验证所有引用的ID都存在
    const locationIds = new Set(this.model.locations.map((l) => l.id));
    const destinationIds = new Set(this.model.destinations.map((d) => d.id));
    const routeIds = new Set(this.model.routes.map((r) => r.id));

    // 验证地点引用的目的地
    this.model.locations.forEach((location) => {
      location.destinations.forEach((destId) => {
        if (!destinationIds.has(destId)) {
          throw new Error(`Location ${location.id} references non-existent destination ${destId}`);
        }
      });
    });

    // 验证行程日程
    this.model.scheduleDays.forEach((day) => {
      day.scheduleItemIds.forEach((itemId) => {
        const item = this.model.scheduleItems.find((i) => i.id === itemId);
        if (!item) {
          throw new Error(`Schedule day ${day.id} references non-existent item ${itemId}`);
        }
        if (item.locationId && !locationIds.has(item.locationId)) {
          throw new Error(
            `Schedule item ${item.id} references non-existent location ${item.locationId}`
          );
        }
        if (item.routeId && !routeIds.has(item.routeId)) {
          throw new Error(`Schedule item ${item.id} references non-existent route ${item.routeId}`);
        }
      });
    });
  }
}