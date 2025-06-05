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
    items.push(`φ ${location.name}`);
  }
  if (location.altitude) {
    items.push(`⩘ ${location.altitude}`);
  }
  if (location.latlng) {
    items.push(`◑ ${location.latlng.longitude}`);
    items.push(`◒ ${location.latlng.latitude}`);
  }
  return items.join(' ');
}

// 解析一个地点的详细地理信息
export function fromGeolocationText(text) {
  const items = text.split(' ');
  const location = {};
  for (let i = 0; i < items.length; i += 2) {
    const icon = items[i];
    const value = items[i + 1];
    if (icon === 'φ') {
      location.name = value;
    } else if (icon === '⩘') {
      location.altitude = parseInt(value);
    } else if (icon === '◑') {
      location.latlng = { ...(location.latlng || {}), longitude: value };
    } else if (icon === '◒') {
      location.latlng = { ...(location.latlng || {}), latitude: value };
    }
  }
  return location;
}