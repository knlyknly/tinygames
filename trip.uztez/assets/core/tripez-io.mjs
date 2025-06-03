import yaml from 'js-yaml';
import TripModel from './tripez-model.mjs';

// 行程类
export class Trip {
  // FIXME add definition of member variables
  constructor() {
    this.model = new TripModel();
  }

  /**
   * 从文本格式解析行程
   * @param {string} text 行程文本
   * @returns {Trip} 行程对象
   * @throws {Error} 如果文本格式无效
   */
  static fromText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    const trip = new Trip();
    const lines = text.split('\n').map(line => line.trim());
    let currentDay = null;
    let currentDayItems = [];
    let lastLocation = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 跳过空行
      if (!line) continue;
      
      // 跳过分隔行
      if (line.startsWith('=')) continue;

      // 解析日期行
      if (line.match(/^[-]?\d+d\s+w\d-\d{4}/)) {
        // 如果已有当前天，先保存
        if (currentDay) {
          trip._processDay(currentDay, currentDayItems);
          currentDayItems = [];
        }

        const parts = line.split(' ').filter(part => part.trim());
        const dayInfo = parts[0];
        const weekDate = parts[1];
        let distance = 0;

        // 检查是否有距离信息
        const distancePart = parts.find(part => part.includes('km'));
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
          distance: distance
        };
        continue;
      }

      // 解析路线行
      if (line.startsWith('-----')) {
        const routeInfo = line.match(/\((\d+)km-(\d+(?:\.\d+)?)h\)/);
        if (routeInfo && lastLocation) {
          const [_, distanceStr, durationStr] = routeInfo;
          const distance = parseInt(distanceStr);
          const duration = parseFloat(durationStr);
          
          if (!isNaN(distance) && !isNaN(duration)) {
            currentDayItems.push({
              type: 'route',
              distance: distance,
              duration: duration
            });
          }
        }
        continue;
      }

      // 解析地点行
      if (line.match(/^\d{2}:\d{2}/)) {
        const timeMatch = line.match(/^(\d{2}:\d{2})\s+(.+?)(?:\s*↑(\d+))?\s*(?:\((.*?)\))?$/);
        if (timeMatch) {
          const [_, time, locationInfo, altitude, routeInfo] = timeMatch;
          
          // 解析地点和可选目的地
          const [mainLocation, ...destinations] = locationInfo.split('&').map(s => s.trim());
          
          const location = {
            name: mainLocation,
            altitude: altitude ? parseInt(altitude) : null,
            time: time,
            destinations: destinations
          };

          // 添加路线信息
          if (routeInfo) {
            const [distance, duration] = routeInfo.split('-');
            location.nextRoute = {
              distance: parseInt(distance),
              duration: parseFloat(duration.replace('h', ''))
            };
          }

          currentDayItems.push({
            type: 'location',
            ...location
          });
          lastLocation = location;
          continue;
        }
      }

      // 解析补充说明
      if (line.startsWith('     ')) {
        if (lastLocation) {
          if (!lastLocation.descriptions) {
            lastLocation.descriptions = [];
          }
          lastLocation.descriptions.push(line.trim());
        }
        continue;
      }
    }

    // 处理最后一天
    if (currentDay) {
      trip._processDay(currentDay, currentDayItems);
    }

    return trip;
  }

  /**
   * 将行程转换为文本格式
   * @returns {string} 行程文本
   */
  toText() {
    const lines = [];
    
    for (const day of this.model.scheduleDays) {
      // 获取当天的行程项
      const dayItems = this.model.scheduleItems.filter(item => 
        day.scheduleStopIds.includes(item.id) || day.scheduleRouteIds.includes(item.id)
      );

      // 计算当天的总距离
      let totalDistance = 0;
      for (const item of dayItems) {
        if (item.routeId) {
          const route = this.model.routes.find(r => r.id === item.routeId);
          if (route && route.distance) {
            totalDistance += route.distance;
          }
        }
      }

      // 添加日期行
      const dayPrefix = day.order >= 0 ? '' : '-';
      // 确保 weekday 是有效的数字，如果不是则使用默认值
      const weekday = day.weekday ? `w${day.weekday}` : 'w1';
      const date = day.date || '';
      let dayLine = `${dayPrefix}${day.order} ${weekday}-${date}`;
      if (totalDistance > 0) {
        dayLine += ` ${totalDistance}km`;
      }
      lines.push(dayLine);
      
      // 添加分隔行
      lines.push('='.repeat(20));

      for (const item of dayItems) {
        if (item.locationId) {
          // 处理地点
          const location = this.model.locations.find(l => l.id === item.locationId);
          if (location) {
            let locationLine = `${item.time} ${location.name}`;
            if (location.altitude) {
              locationLine += `↑${location.altitude}`;
            }
            
            // 添加目的地
            const destinations = this.model.destinations.filter(d => 
              location.destinations.includes(d.id)
            );
            if (destinations.length > 0) {
              locationLine += '&' + destinations.map(d => d.name).join('&');
            }

            // 添加路线信息
            const nextRoute = this.model.routes.find(r => r.id === item.routeId);
            if (nextRoute) {
              locationLine += ` (${nextRoute.distance}km-${nextRoute.durationForward}h)`;
            }

            lines.push(locationLine);

            // 添加描述
            if (location.additionDescriptions) {
              for (const desc of location.additionDescriptions) {
                lines.push(`     ${desc}`);
              }
            }
          }
        } else if (item.routeId) {
          // 处理路线
          const route = this.model.routes.find(r => r.id === item.routeId);
          if (route) {
            // 确保距离和时间是有效的数字
            const distance = !isNaN(route.distance) ? route.distance : 0;
            const duration = !isNaN(route.durationForward) ? route.durationForward : 0;
            lines.push(`----- (${distance}km-${duration}h)`);
          }
        }
      }

      // 添加空行
      lines.push('');
    }

    return lines.join('\n');
  }

  // 静态序列号生成器
  static #nextId = 0xcafebabe;
  static #generateId() {
    return ++Trip.#nextId;
  }

  /**
   * 从YAML格式解析行程
   * @param {string} yamlText YAML文本
   * @returns {Trip} 行程对象
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

    const trip = new Trip();

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
      ...trip.model.locations.map(l => l.id),
      ...trip.model.destinations.map(d => d.id),
      ...trip.model.routes.map(r => r.id),
      ...trip.model.scheduleDays.map(d => d.id),
      ...trip.model.scheduleItems.map(i => i.id)
    );
    Trip.#nextId = Math.max(Trip.#nextId, maxId);

    return trip;
  }

  /**
   * 将行程转换为YAML格式
   * @returns {string} YAML文本
   */
  toYaml() {
    try {
      return yaml.dump({
        locations: this.model.locations,
        destinations: this.model.destinations,
        routes: this.model.routes,
        scheduleDays: this.model.scheduleDays,
        scheduleItems: this.model.scheduleItems
      }, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
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
    const locationIds = new Set(this.model.locations.map(l => l.id));
    const destinationIds = new Set(this.model.destinations.map(d => d.id));
    const routeIds = new Set(this.model.routes.map(r => r.id));

    // 验证地点引用的目的地
    this.model.locations.forEach(location => {
      location.destinations.forEach(destId => {
        if (!destinationIds.has(destId)) {
          throw new Error(`Location ${location.id} references non-existent destination ${destId}`);
        }
      });
    });

    // 验证行程日程
    this.model.scheduleDays.forEach(day => {
      day.scheduleStopIds.forEach(stopId => {
        const item = this.model.scheduleItems.find(i => i.id === stopId);
        if (!item) {
          throw new Error(`Schedule day ${day.id} references non-existent stop ${stopId}`);
        }
        if (item.locationId && !locationIds.has(item.locationId)) {
          throw new Error(`Schedule item ${item.id} references non-existent location ${item.locationId}`);
        }
      });

      day.scheduleRouteIds.forEach(routeId => {
        if (!routeIds.has(routeId)) {
          throw new Error(`Schedule day ${day.id} references non-existent route ${routeId}`);
        }
      });
    });
  }

  // 私有方法：处理一天的行程数据
  _processDay(day, items) {
    // 创建ScheduleDay
    const scheduleDay = {
      id: Trip.#generateId(),
      order: day.order,
      date: day.date,
      scheduleStopIds: [],
      scheduleRouteIds: []
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type === 'location') {
        // 创建Location
        const locationId = Trip.#generateId();
        const location = {
          id: locationId,
          name: item.name,
          altitude: item.altitude,
          additionDescriptions: item.descriptions || [],
          labels: [],
          destinations: []
        };

        // 创建Destinations
        if (item.destinations) {
          for (const destName of item.destinations) {
            const destId = Trip.#generateId();
            const destination = {
              id: destId,
              name: destName,
              direction: null,
              distance: null
            };
            location.destinations.push(destId);
            this.model.destinations.push(destination);
          }
        }

        this.model.locations.push(location);

        // 创建ScheduleItem (stop)
        const scheduleItem = {
          id: Trip.#generateId(),
          order: i,
          time: item.time,
          locationId: locationId,
          routeId: null,
          destinationId: null,
          description: null,
          stayTime: null
        };

        scheduleDay.scheduleStopIds.push(scheduleItem.id);
        this.model.scheduleItems.push(scheduleItem);

        // 如果有下一段路线，创建Route
        if (item.nextRoute) {
          const routeId = Trip.#generateId();
          const route = {
            id: routeId,
            name: `${item.name} to next`,
            startPlaceName: item.name,
            endLocationName: null,
            distance: item.nextRoute.distance,
            durationForward: item.nextRoute.duration,
            durationBackward: item.nextRoute.duration
          };
          this.model.routes.push(route);

          // 创建ScheduleItem (route)
          const routeScheduleItem = {
            id: Trip.#generateId(),
            order: i + 1,
            time: null,
            locationId: null,
            routeId: routeId,
            destinationId: null,
            description: null,
            stayTime: null
          };

          scheduleDay.scheduleRouteIds.push(routeScheduleItem.id);
          this.model.scheduleItems.push(routeScheduleItem);
        }
      }
    }

    this.model.scheduleDays.push(scheduleDay);
  }
}