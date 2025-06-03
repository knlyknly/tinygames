import yaml from 'js-yaml';

/**
 * TXT格式说明
 * 1. 当出现日期定义行，且下一行为很多个"="号时，表示一天的行程计划的开始，后续行表示该天的行程计划，以一个空行结束
 * 2. 以五个空格开头的行是上一行的补充说明，应当保留，但不应当被解析
 * 3. "&"符号代表后面的地名为当前地点附近的可选目的地
 * 4. 日期序号并不一定从1d开始，-1d的下一天可能是0d，也可能是1d，取决于原始数据的选择
 * 5. 一个示例的日期行如：-2d w4-0724 247km；其中-2d表示行程开始的前两天；w4表示星期四，0724表示7月24日，247km表示当日总行程247公里
 * 6. 另一个示例的日期行如：d3 w1-0728；d3表示行程开始的第三天；w1表示星期一，0728表示7月28日，没有总行程的日期，程序生成时应当补全
 * 7. 一个示例的地点行如：20:00 折多山↑4298（36km-1h）；其中20:00表示到达的时间，折多山表示地点名称，↑4298表示海拔高度，36km-1h表示距离下一个地点36公里，需要1小时
 * 8. 另一个示例的地点行如：19:00 崇州&望蜀里&川藏线起点(104km-1h)；其中19:00表示到达的时间，崇州表示地点名称，"&望蜀里"和"&川藏线起点"表示附近有两个可选目的地
 * 9. 有时候，两个地点行到达时间的间隔会比较大，明显多于第一行的行程时间，那就说明在第一行会有一段显著的停留时间，时长为二者之差
 * 10. 由于行程表的不确定性，如果所有时间都是整小时为单位的，那么所有的时间都应当以小时为单位，而不精细到分钟
 * 11. 以五个短线开头的行是另一种形式的行程计划，等价于地点行后面以括号括起的部分，例如：----- (104km-1h)，程序生成TXT格式的行程时应当始终使用这一格式
 * YAML格式说明
 * 1. YAML包含多个数组，每个数组代表一个数据表，在YAML文件中，表名以小写单词表示，例如：locations, destinations, routes, schedule-days, schedule-items
 * 2. 数据表的类型分别为：Location, Destination, Route, ScheduleDay, ScheduleItem
 * 3. Location: 代表地点，包含id, name, altitude, description?, additionDescriptions, latlng?, labels, destinations
 * 4. Destination: 代表目的地，包含id, name, direction, distance
 * 5. Route: 代表路线，包含id, name, startPlaceName, endLocationName, distance, durationForward, durationBackward
 * 6. ScheduleDay: 代表行程日，包含id, order, date, scheduleItemIds
 * 7. ScheduleItem: 代表行程项，包含id, order, time, locationId, routeId, destinationId, description, stayTime
 *    ScheduleItem分为两类，即停留地点和行进路线，停留地点的routeId为null，行进路线的locationId为null
 * 8. 所有的id都是自增的整数
 */

/**
 * Reader类，用于处理TXT和YAML格式的行程数据转换
 */
class Reader {
  constructor() {
    // 内部数据结构
    this.data = {
      locations: [],
      destinations: [],
      routes: [],
      scheduleDays: [],
      scheduleItems: []
    };
    
    // ID计数器
    this.locationId = 1;
    this.destinationId = 1;
    this.routeId = 1;
    this.scheduleDayId = 1;
    this.scheduleItemId = 1;
    
    // 缓存已存在的路线
    this.routeCache = new Map(); // key: "startName->endName", value: routeId
  }
  
  /**
   * 解析TXT格式的行程表
   * @param {string} text - TXT格式的行程表文本
   * @returns {Object} 解析后的数据结构
   */
  parseText(text) {
    // 重置数据和缓存
    this.data = {
      locations: [],
      destinations: [],
      routes: [],
      scheduleDays: [],
      scheduleItems: []
    };
    this.routeCache = new Map();
    
    // 重置ID计数器
    this.locationId = 1;
    this.destinationId = 1;
    this.routeId = 1;
    this.scheduleDayId = 1;
    this.scheduleItemId = 1;
    
    // 按行分割文本
    const lines = text.split('\n');
    
    let currentDay = null;
    let currentDayIndex = -1;
    let lastLocation = null;
    let lastTime = null;
    let lineIndex = 0;
    
    // 处理每一行
    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      lineIndex++;
      
      // 跳过空行
      if (!line) continue;
      
      // 处理日期行
      if (this.isDayLine(line)) {
        const dayInfo = this.parseDayLine(line);
        if (!dayInfo) continue;
        
        // 检查下一行是否为分隔线
        if (lineIndex < lines.length && lines[lineIndex].trim().startsWith('=')) {
          lineIndex++; // 跳过分隔线
          
          // 创建新的行程日
          currentDay = {
            id: this.scheduleDayId++,
            order: dayInfo.dayOrder,
            date: `w${dayInfo.weekday}-${dayInfo.date}`,
            totalDistance: dayInfo.distance,
            scheduleStopIds: [],
            scheduleRouteIds: []
          };
          
          this.data.scheduleDays.push(currentDay);
          lastLocation = null;
          lastTime = null;
        }
        continue;
      }
      
      // 处理路线行（以五个短线开头）
      if (line.startsWith('-----')) {
        const routeInfo = this.parseRouteLine(line);
        if (routeInfo && lastLocation) {
          const routeId = this.findOrCreateRoute(lastLocation.name, null, routeInfo.distance, routeInfo.duration);
          
          if (currentDay && routeId) {
            const scheduleItem = {
              id: this.scheduleItemId++,
              order: this.scheduleItemId,
              routeId: routeId,
              locationId: null,
              time: null,
              description: null,
              stayTime: 0
            };
            
            currentDay.scheduleRouteIds.push(scheduleItem.id);
            this.data.scheduleItems.push(scheduleItem);
          }
        }
        continue;
      }
      
      // 处理地点行
      const locationInfo = this.parseLocationLine(line);
      if (locationInfo) {
        // 处理主地点
        const mainLocation = this.processLocation(locationInfo.mainLocation);
        
        // 处理可选目的地
        for (const destInfo of locationInfo.destinations) {
          const destination = {
            id: this.destinationId++,
            name: destInfo.name,
            direction: null,
            distance: null
          };
          
          this.data.destinations.push(destination);
          
          // 将目的地关联到主地点
          mainLocation.destinations = mainLocation.destinations || [];
          mainLocation.destinations.push(destination.id);
        }
        
        // 如果有上一个地点，创建或查找路线
        if (lastLocation && locationInfo.routeInfo) {
          const routeId = this.findOrCreateRoute(
            lastLocation.name,
            mainLocation.name,
            locationInfo.routeInfo.distance,
            locationInfo.routeInfo.duration
          );
          
          if (currentDay && routeId) {
            const scheduleItem = {
              id: this.scheduleItemId++,
              order: this.scheduleItemId,
              routeId: routeId,
              locationId: null,
              time: null,
              description: null,
              stayTime: 0
            };
            
            currentDay.scheduleRouteIds.push(scheduleItem.id);
            this.data.scheduleItems.push(scheduleItem);
          }
        }
        
        // 创建行程项（停留地点）
        if (currentDay) {
          // 计算停留时间
          let stayTime = 0;
          if (lastTime && locationInfo.time) {
            const currentTimeMinutes = this.timeToMinutes(locationInfo.time);
            const lastTimeMinutes = this.timeToMinutes(lastTime);
            
            // 如果有路线信息，减去路线时间
            if (locationInfo.routeInfo) {
              const routeDurationMinutes = locationInfo.routeInfo.duration * 60;
              stayTime = Math.max(0, currentTimeMinutes - lastTimeMinutes - routeDurationMinutes);
            }
          }
          
          const scheduleItem = {
            id: this.scheduleItemId++,
            order: this.scheduleItemId,
            locationId: mainLocation.id,
            routeId: null,
            time: locationInfo.time,
            description: null,
            stayTime: Math.round(stayTime / 60) // 转换为小时
          };
          
          currentDay.scheduleStopIds.push(scheduleItem.id);
          this.data.scheduleItems.push(scheduleItem);
        }
        
        // 检查下一行是否为补充说明
        if (lineIndex < lines.length && lines[lineIndex].startsWith('     ')) {
          const description = lines[lineIndex].trim();
          lineIndex++;
          
          // 更新地点的补充说明
          mainLocation.additionalDescriptions = mainLocation.additionalDescriptions || [];
          mainLocation.additionalDescriptions.push(description);
          
          // 更新最后一个行程项的描述
          if (this.data.scheduleItems.length > 0) {
            const lastItem = this.data.scheduleItems[this.data.scheduleItems.length - 1];
            lastItem.description = description;
          }
        }
        
        lastLocation = mainLocation;
        lastTime = locationInfo.time;
      }
    }
    
    return this.data;
  }
  
  /**
   * 将内部数据结构转换为TXT格式
   * @returns {string} TXT格式的行程表文本
   */
  toText() {
    let result = '';
    
    // 按天生成行程表
    for (const day of this.data.scheduleDays) {
      // 生成日期行
      const dayLine = this.formatDayLine(day);
      result += dayLine + '\n';
      result += '====================\n';
      
      // 获取该天的所有行程项
      const dayItems = [];
      
      // 添加停留地点
      for (const stopId of day.scheduleStopIds) {
        const stop = this.data.scheduleItems.find(item => item.id === stopId);
        if (stop) {
          const location = this.data.locations.find(loc => loc.id === stop.locationId);
          if (location) {
            dayItems.push({
              type: 'stop',
              time: stop.time,
              location,
              description: stop.description,
              order: stop.order
            });
          }
        }
      }
      
      // 添加路线
      for (const routeId of day.scheduleRouteIds) {
        const routeItem = this.data.scheduleItems.find(item => item.id === routeId);
        if (routeItem) {
          const route = this.data.routes.find(r => r.id === routeItem.routeId);
          if (route) {
            dayItems.push({
              type: 'route',
              route,
              order: routeItem.order
            });
          }
        }
      }
      
      // 按顺序排序
      dayItems.sort((a, b) => a.order - b.order);
      
      // 生成行程项
      for (const item of dayItems) {
        if (item.type === 'stop') {
          // 生成地点行
          const locationLine = this.formatLocationLine(item.location, item.time);
          result += locationLine;
          
          // 添加目的地信息
          if (item.location.destinations && item.location.destinations.length > 0) {
            const destinations = item.location.destinations.map(destId => {
              const dest = this.data.destinations.find(d => d.id === destId);
              return dest ? dest.name : '';
            }).filter(Boolean);
            
            if (destinations.length > 0) {
              result += '&' + destinations.join('&');
            }
          }
          
          // 添加路线信息
          const nextRouteItem = dayItems.find(ri => 
            ri.type === 'route' && 
            ri.route.startPlaceName === item.location.name
          );
          
          if (nextRouteItem) {
            const route = nextRouteItem.route;
            result += ` (${route.distance}km-${route.durationForward}h)`;
          }
          
          result += '\n';
          
          // 添加描述
          if (item.description) {
            result += `      ${item.description}\n`;
          }
        } else if (item.type === 'route') {
          // 使用短线格式表示路线
          const route = item.route;
          result += `----- (${route.distance}km-${route.durationForward}h)\n`;
        }
      }
      
      // 天与天之间添加空行
      result += '\n';
    }
    
    return result;
  }
  
  /**
   * 解析YAML格式的行程数据
   * @param {string} yamlText - YAML格式的行程数据文本
   * @returns {Object} 解析后的数据结构
   */
  parseYaml(yamlText) {
    try {
      const data = yaml.load(yamlText);
      
      // 重置内部数据
      this.data = {
        locations: data.locations || [],
        destinations: data.destinations || [],
        routes: data.routes || [],
        scheduleDays: data['schedule-days'] || [],
        scheduleItems: data['schedule-items'] || []
      };
      
      // 更新ID计数器
      this.updateIdCounters();
      
      return this.data;
    } catch (error) {
      console.error('解析YAML失败:', error);
      return null;
    }
  }
  
  /**
   * 将内部数据结构转换为YAML格式
   * @returns {string} YAML格式的行程数据文本
   */
  toYaml() {
    const yamlData = {
      locations: this.data.locations,
      destinations: this.data.destinations,
      routes: this.data.routes,
      'schedule-days': this.data.scheduleDays,
      'schedule-items': this.data.scheduleItems
    };
    
    return yaml.dump(yamlData);
  }
  
  /**
   * 查找或创建路线
   * @param {string} startName - 起点名称
   * @param {string} endName - 终点名称（可选）
   * @param {number} distance - 距离
   * @param {number} duration - 时长
   * @returns {number} 路线ID
   */
  findOrCreateRoute(startName, endName, distance, duration) {
    // 标准化地点名称
    startName = this.normalizeLocationName(startName);
    endName = endName ? this.normalizeLocationName(endName) : null;
    
    // 生成路线键
    const key = endName ? `${startName}->${endName}` : startName;
    
    // 检查缓存中是否已存在该路线
    if (this.routeCache.has(key)) {
      return this.routeCache.get(key);
    }
    
    // 检查是否存在相反方向的路线
    const reverseKey = endName ? `${endName}->${startName}` : null;
    if (reverseKey && this.routeCache.has(reverseKey)) {
      return this.routeCache.get(reverseKey);
    }
    
    // 创建新路线
    const route = {
      id: this.routeId++,
      startPlaceName: startName,
      endPlaceName: endName,
      distance: distance,
      durationForward: duration,
      durationBackward: duration // 假设来回时间相同
    };
    
    this.data.routes.push(route);
    this.routeCache.set(key, route.id);
    
    return route.id;
  }
  
  /**
   * 标准化地点名称
   * @param {string} name - 原始地点名称
   * @returns {string} 标准化后的名称
   */
  normalizeLocationName(name) {
    // 移除多余的空格
    name = name.trim().replace(/\s+/g, ' ');
    
    // 处理特殊情况
    const specialCases = {
      '泸定县': '泸定大渡河泸定桥',
      '泸定桥': '泸定大渡河泸定桥',
      '雅江县': '雅江县雅砻江',
      '雅砻江': '雅江县雅砻江',
      '省界金沙江大桥': '省界金沙江大桥海通沟',
      '金沙江大桥': '省界金沙江大桥海通沟',
      '海通沟': '省界金沙江大桥海通沟',
      '波密县': '波密县波密森林',
      '波密森林': '波密县波密森林',
      '色季拉山': '色季拉山口',
      '南迦巴瓦观景台': '色季拉山口',
      '索松村': '索松村南迦巴瓦',
      '南迦巴瓦': '索松村南迦巴瓦',
      '扎西半岛': '扎西半岛纳木错',
      '纳木错': '扎西半岛纳木错',
      '达则错': '达则错大地之树',
      '大地之树': '达则错大地之树',
      '佩枯错': '佩枯错希夏邦马观景台',
      '希夏邦马': '佩枯错希夏邦马观景台',
      '佩枯错观景台': '佩枯错希夏邦马观景台',
      '东巴村': '东巴村珠峰古堡',
      '珠峰古堡': '东巴村珠峰古堡'
    };
    
    // 检查完整名称匹配
    if (specialCases[name]) {
      return specialCases[name];
    }
    
    // 检查部分名称匹配
    for (const [key, value] of Object.entries(specialCases)) {
      if (name.includes(key)) {
        return value;
      }
    }
    
    return name;
  }
  
  /**
   * 判断是否为日期行
   * @param {string} line - 行文本
   * @returns {boolean} 是否为日期行
   */
  isDayLine(line) {
    // 匹配如 "-2d w4-0724 247km" 或 "d3 w1-0728" 的格式
    return /^-?\d+d\s+w\d+-\d{4}/.test(line) || /^d\d+\s+w\d+-\d{4}/.test(line);
  }
  
  /**
   * 解析日期行
   * @param {string} line - 日期行文本
   * @returns {Object} 解析后的日期信息
   */
  parseDayLine(line) {
    // 匹配如 "-2d w4-0724 247km" 或 "d3 w1-0728" 的格式
    const dayMatch = line.match(/^(?:-?(\d+)d|d(\d+))\s+w(\d+)-(\d{4})(?:\s+(\d+)km)?/);
    if (!dayMatch) return null;
    
    const dayOrder = dayMatch[1] !== undefined ? parseInt(dayMatch[1], 10) : parseInt(dayMatch[2], 10);
    const weekday = parseInt(dayMatch[3], 10);
    const date = dayMatch[4];
    const distance = dayMatch[5] ? parseInt(dayMatch[5], 10) : null;
    
    return {
      dayOrder,
      weekday,
      date,
      distance
    };
  }
  
  /**
   * 解析地点行
   * @param {string} line - 地点行文本
   * @returns {Object|null} 解析后的地点信息
   */
  parseLocationLine(line) {
    // 匹配如 "20:00 折多山↑4298（36km-1h）" 或 "19:00 崇州&望蜀里&川藏线起点(104km-1h)"
    const match = line.match(/^(\d{2}:\d{2})\s+([^(]+?)(?:\s*\(([^)]+)\))?$/);
    if (!match) return null;
    
    const [, time, locationText, routeInfo] = match;
    
    // 分割主地点和可选目的地
    const locationParts = locationText.split('&').map(part => part.trim());
    const mainLocationText = locationParts[0];
    const destinationTexts = locationParts.slice(1);
    
    // 解析主地点
    const mainLocation = this.parseLocationInfo(mainLocationText);
    if (!mainLocation) return null;
    
    // 解析可选目的地
    const destinations = destinationTexts.map(text => this.parseLocationInfo(text)).filter(Boolean);
    
    // 解析路线信息
    let parsedRouteInfo = null;
    if (routeInfo) {
      const routeMatch = routeInfo.match(/(\d+)km-(\d+(?:\.\d+)?)h/);
      if (routeMatch) {
        parsedRouteInfo = {
          distance: parseInt(routeMatch[1], 10),
          duration: parseFloat(routeMatch[2])
        };
      }
    }
    
    return {
      time,
      mainLocation,
      destinations,
      routeInfo: parsedRouteInfo
    };
  }
  
  /**
   * 解析路线行
   * @param {string} line - 路线行文本
   * @returns {Object|null} 解析后的路线信息
   */
  parseRouteLine(line) {
    // 匹配如 "----- (104km-1h)"
    const match = line.match(/-----\s*\((\d+)km-(\d+(?:\.\d+)?)h\)/);
    if (!match) return null;
    
    return {
      distance: parseInt(match[1], 10),
      duration: parseFloat(match[2])
    };
  }
  
  /**
   * 解析地点信息
   * @param {string} text - 地点文本
   * @returns {Object|null} 解析后的地点信息
   */
  parseLocationInfo(text) {
    if (!text || typeof text !== 'string') return null;
    
    let name = text.trim();
    const isPhotoSpot = name.includes('★');
    name = name.replace('★', '');
    
    // 提取海拔信息
    let altitude;
    const altitudeMatch = name.match(/↑(\d+)/);
    if (altitudeMatch) {
      altitude = parseInt(altitudeMatch[1], 10);
      name = name.replace(/↑\d+/, '');
    }
    
    name = name.trim();
    if (!name) return null;
    
    return {
      name,
      altitude,
      isPhotoSpot
    };
  }
  
  /**
   * 处理地点信息，添加到数据结构中
   * @param {Object} locationInfo - 地点信息
   * @returns {Object} 处理后的地点对象
   */
  processLocation(locationInfo) {
    // 标准化地点名称
    const normalizedName = this.normalizeLocationName(locationInfo.name);
    
    // 检查地点是否已存在
    let location = this.data.locations.find(loc => loc.name === normalizedName);
    
    if (!location) {
      // 创建新地点
      location = {
        id: this.locationId++,
        name: normalizedName,
        destinations: []
      };
      
      // 添加海拔信息
      if (locationInfo.altitude) {
        location.altitude = locationInfo.altitude;
      }
      
      // 添加标签
      if (locationInfo.isPhotoSpot) {
        location.labels = ['activity:photo'];
      }
      
      this.data.locations.push(location);
    } else {
      // 更新现有地点的信息
      if (locationInfo.altitude && !location.altitude) {
        location.altitude = locationInfo.altitude;
      }
      if (locationInfo.isPhotoSpot && (!location.labels || !location.labels.includes('activity:photo'))) {
        location.labels = location.labels || [];
        location.labels.push('activity:photo');
      }
    }
    
    return location;
  }
  
  /**
   * 将时间字符串转换为分钟数
   * @param {string} timeStr - 时间字符串 (HH:MM)
   * @returns {number} 分钟数
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * 格式化日期行
   * @param {Object} day - 行程日对象
   * @returns {string} 格式化后的日期行
   */
  formatDayLine(day) {
    let result = `d${day.order}`;
    
    // 添加日期信息
    if (day.date) {
      // 假设日期格式为 "w1-0728"
      result += ` ${day.date}`;
    }
    
    // 添加总距离
    if (day.totalDistance) {
      result += ` ${day.totalDistance}km`;
    }
    
    return result;
  }
  
  /**
   * 格式化地点行
   * @param {Object} location - 地点对象
   * @param {string} time - 时间字符串
   * @returns {string} 格式化后的地点行
   */
  formatLocationLine(location, time) {
    let result = `${time} `;
    
    // 添加拍照点标记
    if (location.labels && location.labels.includes('activity:photo')) {
      result += '★';
    }
    
    // 添加地点名称
    result += location.name;
    
    // 添加海拔信息
    if (location.altitude) {
      result += `↑${location.altitude}`;
    }
    
    return result;
  }
  
  /**
   * 更新ID计数器
   */
  updateIdCounters() {
    if (this.data.locations.length > 0) {
      this.locationId = Math.max(...this.data.locations.map(loc => loc.id)) + 1;
    }
    
    if (this.data.destinations.length > 0) {
      this.destinationId = Math.max(...this.data.destinations.map(dest => dest.id)) + 1;
    }
    
    if (this.data.routes.length > 0) {
      this.routeId = Math.max(...this.data.routes.map(route => route.id)) + 1;
    }
    
    if (this.data.scheduleDays.length > 0) {
      this.scheduleDayId = Math.max(...this.data.scheduleDays.map(day => day.id)) + 1;
    }
    
    if (this.data.scheduleItems.length > 0) {
      this.scheduleItemId = Math.max(...this.data.scheduleItems.map(item => item.id)) + 1;
    }
  }
}

/**
 * 将人类可读的行程表解析为结构化数据
 * @param {string} text - 行程表文本内容
 * @returns {Object} 包含locations和routes的结构化数据
 */
export function parse(text) {
  const reader = new Reader();
  return reader.parseText(text);
}

/**
 * 将结构化数据生成为人类可读的行程表
 * @param {Object} data - 包含locations和routes的结构化数据
 * @returns {string} 格式化的行程表文本
 */
export function generate(data) {
  const reader = new Reader();
  reader.data = data;
  return reader.toText();
}