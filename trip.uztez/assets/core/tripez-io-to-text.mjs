import {
  toGeolocationText,
  toScheduleDayText,
  toScheduleItemText,
} from './tripez-format.mjs';

/**
 * 将TripezModel转换为文本格式
 * @param {TripezModel} model TripezModel实例
 * @param {Object} [options] 输出选项
 * @param {boolean} [options.compactMode=false] 是否使用紧凑模式
 * @returns {string} 行程文本
 */
export function toText(model, options = {}) {
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