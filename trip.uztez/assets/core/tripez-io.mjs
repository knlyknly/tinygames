/**
 * 将人类可读的行程表解析为结构化数据
 * @param {string} text - 行程表文本内容
 * @returns {Object} 包含locations和routes的结构化数据
 */
export function parse(text) {
  const locations = new Map();
  const routes = [];
  let lastLocation = null;
  
  // 按行分割并过滤掉空行
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过日期行、分隔线和注释
    if (line.startsWith('d') || line.includes('==') || line.startsWith('-')) {
      continue;
    }
    
    // 匹配时间和地点信息
    // 格式: "HH:MM 地点名称[★][↑海拔] [(距离km-时间h)]"
    const match = line.match(/^(\d{2}:\d{2})\s+([^(]+?)(?:\s*\(([^)]+)\))?$/);
    if (!match) continue;
    
    const [, time, locationText, routeInfo] = match;
    
    // 处理可能包含多个地点的情况（用&连接）
    const locationParts = locationText.split('&').map(part => part.trim());
    
    for (const part of locationParts) {
      // 解析地点信息（名称、海拔、是否为拍照点）
      const locationInfo = parseLocationInfo(part);
      if (!locationInfo) continue;
      
      const { name, altitude, isPhotoSpot } = locationInfo;
      
      // 将地点添加到locations集合中
      if (!locations.has(name)) {
        const location = { name };
        if (altitude !== undefined) {
          location.altitude = altitude;
        }
        if (isPhotoSpot) {
          location.labels = ['activity:photo'];
        }
        locations.set(name, location);
      }
    }
    
    // 获取主要地点名称（第一个地点）
    const mainLocationInfo = parseLocationInfo(locationParts[0]);
    if (!mainLocationInfo) continue;
    
    // 如果有路线信息且有上一个地点，则添加路线
    if (lastLocation && routeInfo) {
      const [distance, duration] = parseDistanceTime(routeInfo);
      if (distance !== undefined && duration !== undefined) {
        routes.push({
          startPlaceName: lastLocation,
          endPlaceName: mainLocationInfo.name,
          distance,
          durationForward: duration
        });
      }
    }
    
    lastLocation = mainLocationInfo.name;
  }
  
  return {
    locations: Array.from(locations.values()),
    routes
  };
}

/**
 * 将结构化数据生成为人类可读的行程表
 * @param {Object} data - 包含locations和routes的结构化数据
 * @returns {string} 格式化的行程表文本
 */
export function generate(data) {
  const { locations, routes } = data;
  
  // 创建地点信息查找表
  const locationMap = new Map(
    locations.map(loc => [loc.name, loc])
  );
  
  // 按路线顺序组织行程
  let result = '';
  let currentTime = new Date();
  currentTime.setHours(8, 0, 0); // 默认从早上8点开始
  
  let dayCount = 1;
  result += `d${dayCount}\n====================\n`;
  
  // 添加第一个地点
  if (routes.length > 0) {
    const firstPlace = locationMap.get(routes[0].startPlaceName);
    result += `${formatTime(currentTime)} ${formatLocation(firstPlace)}\n`;
  }
  
  // 处理所有路线
  for (const route of routes) {
    // 更新时间
    currentTime.setTime(currentTime.getTime() + route.durationForward * 60 * 60 * 1000);
    
    // 如果时间超过晚上20点，开始新的一天
    if (currentTime.getHours() >= 20) {
      dayCount++;
      currentTime = new Date();
      currentTime.setHours(8, 0, 0);
      result += `\nd${dayCount}\n====================\n`;
    }
    
    // 格式化目的地
    const endPlace = locationMap.get(route.endPlaceName);
    const formattedLocation = formatLocation(endPlace);
    
    // 添加时间和地点信息
    result += `${formatTime(currentTime)} ${formattedLocation}`;
    
    // 添加距离和时间信息
    if (route.distance !== undefined && route.durationForward !== undefined) {
      result += ` (${route.distance}km-${route.durationForward}h)`;
    }
    
    result += '\n';
  }
  
  return result;
}

// 辅助函数

/**
 * 解析地点信息
 * @param {string} text - 地点文本
 * @returns {Object|null} 解析后的地点信息
 */
function parseLocationInfo(text) {
  // 检查是否为空
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
 * 解析距离和时间信息
 * @param {string} text - 距离和时间文本
 * @returns {[number|undefined, number|undefined]} 距离和时间
 */
function parseDistanceTime(text) {
  if (!text) return [undefined, undefined];
  
  const match = text.match(/(\d+)km-(\d+(?:\.\d+)?)h/);
  if (!match) return [undefined, undefined];
  
  return [
    parseInt(match[1], 10),
    parseFloat(match[2])
  ];
}

/**
 * 格式化地点信息
 * @param {Object} location - 地点信息对象
 * @returns {string} 格式化后的地点信息文本
 */
function formatLocation(location) {
  if (!location) return '';
  
  let result = '';
  
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
 * 格式化时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串 (HH:MM)
 */
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}