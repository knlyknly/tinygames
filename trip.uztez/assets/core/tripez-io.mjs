import yaml from 'js-yaml';
import TripModel from './tripez-model.mjs';
import {
  REG_LOCATION_LINE,
  calcHoursBetween,
  toGeolocationText,
  fromGeolocationText,
} from './tripez-format.mjs';
// 行程类
export class Tripez {
  /**
   * @type {TripModel} 行程数据模型
   */
  model;

  constructor() {
    this.model = new TripModel();
  }

  static fromText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    // 标准化行尾，确保在Windows和MacOS上行为一致
    const normalizedText = text.replace(/\r\n/g, '\n');

    const trip = new Tripez();
    const lines = normalizedText.split('\n');
    let currentDay = null;
    let currentDayItems = [];
    let lastLocation = null;
    let lastRouteInfo = null;
    let lastScheduleItemOfLocationType = null;
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
          trip._processDay(currentDay, currentDayItems);
          currentDayItems = [];
        }

        const parts = line.split(' ').filter((part) => part.trim());
        const dayInfo = parts[0];
        const weekDate = parts[1];
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
          order: parseInt(dayInfo.replace('d', '')),
          date: weekDate.split('-')[1],
          weekday: parseInt(weekDate.split('-')[0].replace('w', '')),
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
          let location = trip.model.locations.find((l) => l.name === mainLocation);

          if (!location) {
            // find destinations from trip.model, create if not exist
            let dests = destinations.map((d) => {
              let dest = trip.model.destinations.find((l) => l.name === d);
              if (!dest) {
                dest = {
                  id: Tripez.generateId(),
                  name: d,
                };
                trip.model.destinations.push(dest);
              }
              return dest;
            });
            // 创建新地点
            const locationId = Tripez.generateId();
            location = {
              id: locationId,
              name: mainLocation,
              altitude: altitude ? parseInt(altitude) : null,
            };
            if (dests?.length > 0) {
              location.destinationIds = dests.map((d) => d.id);
            }
            trip.model.locations.push(location);
          }

          // 创建地点项
          const scheduleItem = {
            type: 'location',
            locationId: location.id,
            time: time,
          };

          // 处理route
          if (lastLocation && lastRouteInfo) {
            // 算出scheduleItem.lastScheduleItemOfLocationType.time之间相差的小时数
            let hourDiff = calcHoursBetween(scheduleItem.time, lastScheduleItemOfLocationType.time);
            // 如果相差的小时数大于lastRouteInfo的duration，那么认为多出来的部分为lastScheduleItem的stayTime
            if (hourDiff > lastRouteInfo.duration) {
              lastScheduleItemOfLocationType.stayTime = hourDiff - lastRouteInfo.duration;
            }
            // 查找lastLocation和location之间已经存在的route
            let route = trip.model.routes.find(
              (r) => r.startLocationId === lastLocation.id && r.endLocationId === location.id
            );
            // if the route doesn't exist, try find the backward route
            if (!route) {
              route = trip.model.routes.find(
                (r) => r.startLocationId === location.id && r.endLocationId === lastLocation.id
              );
              if (!route) {
                route = {
                  id: Tripez.generateId(),
                  name: `${lastLocation.name} → ${location.name}`,
                  startLocationId: lastLocation.id,
                  endLocationId: location.id,
                  distance: lastRouteInfo.distance,
                  durationForward: lastRouteInfo.duration,
                  durationBackward: lastRouteInfo.duration,
                };
                trip.model.routes.push(route);
              } else {
                // check if route.distance is too different to lastRouteInfo.distance
                if (Math.abs(route.distance - lastRouteInfo.distance) > route.distance * 0.05) {
                  // create another route for lastLocation → location because it's actually another route
                  const routeId = Tripez.generateId();
                  const newRoute = {
                    id: routeId,
                    name: `${lastLocation.name} → ${location.name}`,
                    startLocationId: lastLocation.id,
                    endLocationId: location.id,
                    distance: lastRouteInfo.distance,
                    durationForward: lastRouteInfo.duration,
                    durationBackward: lastRouteInfo.duration,
                  };
                  trip.model.routes.push(newRoute);
                  route = newRoute;
                } else {
                  route.durationBackward = lastRouteInfo.duration;
                }
              }
            } else {
              // update the duration
              route.durationForward = lastRouteInfo.duration;
            }

            // 创建route类型的ScheduleItem
            currentDayItems.push({
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
      trip._processDay(currentDay, currentDayItems);
    }

    // 合并地理信息到locations
    for (const geo of geolocations) {
      if (geo.name) {
        // 查找同名location
        let location = trip.model.locations.find((l) => l.name === geo.name);
        if (!location) {
          // 创建新location
          location = {
            id: Tripez.generateId(),
            name: geo.name,
          };
          trip.model.locations.push(location);
        }
        // 更新location
        Object.assign(location, geo);
      }
    }

    return trip;
  }

  /**
   * 将行程转换为文本格式
   * @param {Object} [options] 输出选项
   * @param {boolean} [options.compactMode=false] 是否使用紧凑模式
   * @returns {string} 行程文本
   */
  toText(options = {}) {
    const lines = [];
    const detailedMap = new Map(); // 记录已显示详细信息的locationId

    for (const day of this.model.scheduleDays) {
      // 获取当天的行程项
      const dayItems = this.model.scheduleItems.filter((item) =>
        day.scheduleItemIds.includes(item.id)
      );

      // 计算当天的总距离（直接从scheduleItem获取）
      let totalDistance = 0;
      for (const item of dayItems) {
        if (item.distance) {
          totalDistance += item.distance;
        }
      }

      // 添加日期行
      let dayLine;
      if (day.order >= 0) {
        // 正数天数，格式为 "d1", "d2", ...
        dayLine = `d${day.order}`;
      } else {
        // 负数天数，格式为 "-2d", "-1d", ...
        // 注意：这里不能直接使用 day.order，因为它可能是字符串
        const order = parseInt(day.order);
        dayLine = `${order}d`;
      }
      // 使用原始的星期信息
      const weekday = typeof day.weekday === 'number' ? `w${day.weekday}` : 'w0';
      const date = day.date || '';
      dayLine = `${dayLine} ${weekday}-${date}`;
      if (totalDistance > 0) {
        dayLine += ` ${totalDistance}km`;
      }
      lines.push(dayLine);

      // 添加分隔行
      lines.push('='.repeat(20));

      for (let i = 0; i < dayItems.length; i++) {
        const item = dayItems[i];
        if (item.locationId) {
          // 处理地点
          const location = this.model.locations.find((l) => l.id === item.locationId);
          if (location) {
            let locationLine = `${item.time} ${location.name}`;

            // 检查是否满足紧凑模式条件
            const hasNoMuchExtraInfo =
              (location.altitude ? 1 : 0) + (location.destinationIds?.length || 0) <= 1;
            const willHideExtraInfo = detailedMap.has(location.id);
            let compactRouteText = '';

            if (options.compactMode && (hasNoMuchExtraInfo || willHideExtraInfo)) {
              // 紧凑模式：检查下一个项是否为route类型
              const nextItem = dayItems[i + 1];
              if (nextItem && nextItem.type === 'route') {
                compactRouteText = `(${nextItem.distance}km-${nextItem.duration}h)`;
              }
            }

            // 第一次出现时显示目的地和海拔
            if (!detailedMap.has(location.id)) {
              // 添加目的地
              if (location.destinationIds?.length > 0) {
                const destinations = location.destinationIds
                  .map((id) => this.model.destinations.find((d) => d.id === id))
                  .filter(Boolean)
                  .map((d) => d.name);
                locationLine += '&' + destinations.join('&');
              }

              // 添加海拔
              if (location.altitude) {
                locationLine += `⩘${location.altitude}`;
              }

              detailedMap.set(location.id, true);
            }

            if (compactRouteText) {
              locationLine += compactRouteText;
              // 跳过下一个route项的处理
              i++;
            }

            lines.push(locationLine);

            // 添加描述
            if (item.additionDescriptions) {
              for (const desc of item.additionDescriptions) {
                // 保留原始缩进格式
                lines.push(`      ${desc}`);
              }
            }
          }
        } else if (item.routeId) {
          // 处理路线
          const route = this.model.routes.find((r) => r.id === item.routeId);
          if (route) {
            // 确保距离和时间是有效的数字
            const distance = !isNaN(route.distance) ? route.distance : 0;
            const duration = !isNaN(route.durationForward) ? route.durationForward : 0;
            lines.push(`    ↓ (${distance}km-${duration}h)`);
          }
        }
      }

      // 添加空行
      lines.push('');
    }

    // 收集并添加地理信息
    const geoLines = [];
    for (const loc of this.model.locations) {
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

  // 静态序列号生成器
  static nextId = 0xcafebabe;
  static generateId() {
    return ++Tripez.nextId;
  }

  /**
   * 从YAML格式解析行程
   * @param {string} yamlText YAML文本
   * @returns {Tripez} 行程对象
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

    const trip = new Tripez();

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
      trip.model.locations = data.locations;
    }
    if (data.destinations) {
      validateArray(data.destinations, 'destinations');
      trip.model.destinations = data.destinations;
    }
    if (data.routes) {
      validateArray(data.routes, 'routes');
      trip.model.routes = data.routes;
    }
    if (data.scheduleDays) {
      validateArray(data.scheduleDays, 'scheduleDays');
      trip.model.scheduleDays = data.scheduleDays;
    }
    if (data.scheduleItems) {
      validateArray(data.scheduleItems, 'scheduleItems');
      trip.model.scheduleItems = data.scheduleItems;
    }

    // 更新序列号生成器的起始值
    const maxId = Math.max(
      ...trip.model.locations.map((l) => l.id),
      ...trip.model.destinations.map((d) => d.id),
      ...trip.model.routes.map((r) => r.id),
      ...trip.model.scheduleDays.map((d) => d.id),
      ...trip.model.scheduleItems.map((i) => i.id)
    );
    Tripez.nextId = Math.max(Tripez.nextId, maxId);

    return trip;
  }

  /**
   * 将行程转换为YAML格式
   * @returns {string} YAML文本
   */
  toYaml() {
    try {
      // 准备locations数据，确保latlng字段正确序列化
      const locations = this.model.locations.map((loc) => {
        const { latlng, ...rest } = loc;
        if (latlng) {
          return { ...rest, latlng };
        }
        return rest;
      });

      return yaml.dump(
        {
          locations,
          destinations: this.model.destinations,
          routes: this.model.routes,
          scheduleDays: this.model.scheduleDays,
          scheduleItems: this.model.scheduleItems,
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

  // 私有方法：处理一天的行程数据
  _processDay(day, items) {
    // 创建ScheduleDay
    const scheduleDay = {
      id: Tripez.generateId(),
      order: day.order,
      date: day.date,
      weekday: day.weekday,
      scheduleItemIds: [],
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // 直接使用传入的scheduleItem，只需添加id
      const scheduleItem = {
        ...item,
        id: Tripez.generateId(),
      };

      scheduleDay.scheduleItemIds.push(scheduleItem.id);
      this.model.scheduleItems.push(scheduleItem);
    }

    this.model.scheduleDays.push(scheduleDay);
  }
}
