import hash from '../tools/hash.mjs';

// 正则表达式：匹配地点行格式
export const REG_LOCATION_LINE = /^(\d{2}:\d{2})\s+([^↑(⩘]+)(?:[↑⩘](\d+))?([^(]*)(?:\s*\((.*?)\))?$/;

// 计算两个时间之间相差几个小时
export function calcHoursBetween(start, end) {
  const startParts = start.split(':');
  const endParts = end.split(':');
  const startHours = parseInt(startParts[0]);
  const startMinutes = parseInt(startParts[1]);
  const endHours = parseInt(endParts[0]);
  const endMinutes = parseInt(endParts[1]);
  const hours = endHours - startHours;
  const minutes = endMinutes - startMinutes;
  return Math.floor(hours + minutes / 60);
}

// 显示一个地点的详细地理信息
export function toGeolocationText(location) {
  const items = [];
  if (location.name) {
    items.push(`φ${location.name}`);
  }
  if (location.latlng) {
    items.push(`◑${location.latlng.longitude || '0'}`);
    items.push(`◒${location.latlng.latitude || '0'}`);
  }
  return items.join(' ');
}

// 解析一个地点的详细地理信息
export function fromGeolocationText(text) {
  const items = text.split(' ');
  const location = {};
  for (let i = 0; i < items.length; i++) {
    const icon = items[i].charAt(0);
    const value = items[i].substring(1);
    if (icon === 'φ') {
      location.name = value;
    } else if (icon === '⊼') {
      location.altitude = parseInt(value);
    } else if (icon === '◑') {
      location.latlng = { ...(location.latlng || {}), longitude: value };
    } else if (icon === '◒') {
      location.latlng = { ...(location.latlng || {}), latitude: value };
    }
  }
  return location;
}

/**
 * 生成天数文本
 * @param {number|string} order 天数序号
 * @returns {string} 天数文本，如"d1"或"-2d"
 */
export function toDayOrderText(order) {
  // 确保order是数字
  const orderNum = typeof order === 'string' ? parseInt(order) : order;
  
  if (orderNum >= 0) {
    // 正数天数，格式为 "d1", "d2", ...
    return `d${orderNum}`;
  } else {
    // 负数天数，格式为 "-2d", "-1d", ...
    return `${orderNum}d`;
  }
}

/**
 * 解析行程日期行文本
 * @param {string} text 行程日期行文本
 * @returns {Object} 解析后的day对象
 */
export function fromScheduleDayText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const parts = text.split(' ').filter(part => part.trim());
  if (parts.length === 0) {
    throw new Error('Invalid day text format');
  }

  // 解析day number
  const dayInfo = parts[0];
  if (!dayInfo.match(/^(?:[-]?\d+d|d\d+)/)) {
    throw new Error('Invalid day number format');
  }

  // 创建基本的day对象
  const day = {
    id: hash(dayInfo),
    order: parseInt(dayInfo.replace('d', '')),
  };

  // 解析其他部分
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // 解析日期信息
    if (part.match(/w\d-\d{4}/)) {
      day.date = part.split('-')[1];
      day.weekday = parseInt(part.split('-')[0].replace('w', ''));
      continue;
    }
    
    // 解析距离信息
    if (part.match(/\d+km/)) {
      const distanceMatch = part.match(/(\d+)km/);
      if (distanceMatch) {
        day.distance = parseInt(distanceMatch[1]);
      }
      continue;
    }
  }

  // 设置name
  day.name = dayInfo + (day.date ? ` w${day.weekday}-${day.date}` : '');

  return day;
}

/**
 * 生成行程日期行文本
 * @param {Object} day 行程日对象
 * @param {number} totalDistance 当天总距离
 * @returns {string} 行程日期行文本
 */
export function toScheduleDayText(day, totalDistance = 0) {
  // 获取天数文本
  let dayLine = toDayOrderText(day.order);
  
  // 只有在同时有weekday和date时才添加日期信息
  if (typeof day.weekday === 'number' && day.date) {
    dayLine = `${dayLine} w${day.weekday}-${day.date}`;
  }

  // 添加距离信息
  if (totalDistance > 0) {
    dayLine += ` ${totalDistance}km`;
  }
  return dayLine;
}

/**
 * 生成行程项文本
 * @param {Object} item 行程项对象
 * @param {Object} model TripezModel实例
 * @param {Object} context 上下文对象
 * @param {Map} context.detailedMap 记录已显示详细信息的locationId的Map
 * @param {Object} context.options 输出选项
 * @param {Array} context.dayItems 当天所有行程项
 * @param {number} context.index 当前项在dayItems中的索引
 * @returns {Object} 包含生成的文本行和新索引的对象
 */
export function toScheduleItemText(item, model, context) {
  const lines = [];
  let newIndex = context.index;

  if (item.locationId) {
    // 处理地点
    const location = model.locations.find((l) => l.id === item.locationId);
    if (location) {
      let locationLine = `${item.time} ${location.name}`;

      // 检查是否满足紧凑模式条件
      const hasNoMuchExtraInfo =
        (location.altitude ? 1 : 0) + (location.destinationIds?.length || 0) <= 1;
      const willHideExtraInfo = context.detailedMap.has(location.id);
      let compactRouteText = '';

      if (context.options.compactMode && (hasNoMuchExtraInfo || willHideExtraInfo)) {
        // 紧凑模式：检查下一个项是否为route类型
        const nextItem = context.dayItems[context.index + 1];
        if (nextItem && nextItem.type === 'route') {
          compactRouteText = `(${nextItem.distance}km-${nextItem.duration}h)`;
          // 跳过下一个route项的处理
          newIndex++;
        }
      }

      // 第一次出现时显示目的地和海拔
      if (!context.detailedMap.has(location.id)) {
        // 添加目的地
        if (location.destinationIds?.length > 0) {
          const destinations = location.destinationIds
            .map((id) => model.destinations.find((d) => d.id === id))
            .filter(Boolean)
            .map((d) => d.name);
          locationLine += '&' + destinations.join('&');
        }

        // 添加海拔
        if (location.altitude) {
          locationLine += `⩘${location.altitude}`;
        }

        context.detailedMap.set(location.id, true);
      }

      if (compactRouteText) {
        locationLine += compactRouteText;
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
    const route = model.routes.find((r) => r.id === item.routeId);
    if (route) {
      // 确保距离和时间是有效的数字
      const distance = !isNaN(route.distance) ? route.distance : 0;
      const duration = !isNaN(route.durationForward) ? route.durationForward : 0;
      lines.push(`    ↓ (${distance}km-${duration}h)`);
    }
  }

  return { lines, newIndex };
}