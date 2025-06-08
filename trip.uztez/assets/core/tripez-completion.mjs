import hash from '../tools/hash.mjs';

/**
 * 补全days的星期信息
 * @param {Array} days - 行程天数数组
 * @returns {Array} 补全星期后的days数组
 */
export const completeDaysWeeks = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    return days;
  }

  // 找到第一个提供了星期数据的day
  const referenceDay = days.find(day => day.weekday !== undefined);
  if (!referenceDay) {
    return days; // 如果没有找到参考数据，直接返回
  }

  // 补全每一天的星期信息
  return days.map(dayItem => {
    // 如果已有星期信息，保留原值
    if (dayItem.weekday !== undefined) {
      return dayItem;
    }

    // 计算与参考天的差距，考虑跨越day0的情况
    let dayDiff = dayItem.order - referenceDay.order;
    
    // 如果两个order跨越了0，需要调整差值
    if (referenceDay.order < 0 && dayItem.order > 0) {
      // 从负数到正数，中间少了一天(day0)
      dayDiff--;
    } else if (referenceDay.order > 0 && dayItem.order < 0) {
      // 从正数到负数，中间少了一天(day0)
      dayDiff++;
    }
    
    // 计算新的星期（1-7，周一-周日）
    let newWeekday;
    if (dayDiff >= 0) {
      // 正数天数：直接计算
      newWeekday = ((referenceDay.weekday - 1 + dayDiff) % 7 + 7) % 7 + 1;
    } else {
      // 负数天数：先计算向前移动的天数
      const backwardDays = (-dayDiff) % 7;
      newWeekday = ((referenceDay.weekday - 1 - backwardDays) % 7 + 7) % 7 + 1;
    }

    return {
      ...dayItem,
      weekday: newWeekday
    };
  });
};

/**
 * 补全days的日期信息
 * @param {Array} days - 行程天数数组
 * @returns {Array} 补全日期后的days数组
 */
export const completeDaysDates = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    return days;
  }

  // 找到第一个提供了日期数据的day
  const referenceDay = days.find(day => day.date !== undefined);
  if (!referenceDay) {
    return days; // 如果没有找到参考数据，直接返回
  }

  // 解析参考日期
  const month = parseInt(referenceDay.date.substring(0, 2)) - 1; // 月份从0开始
  const day = parseInt(referenceDay.date.substring(2, 4));
  
  // 使用当前年份创建参考日期对象
  const currentYear = new Date().getFullYear();
  const referenceDate = new Date(currentYear, month, day);

  // 补全每一天的日期信息
  return days.map(dayItem => {
    // 如果已有日期信息，保留原值
    if (dayItem.date !== undefined) {
      return dayItem;
    }

    // 计算与参考天的差距，考虑跨越day0的情况
    let dayDiff = dayItem.order - referenceDay.order;
    
    // 如果两个order跨越了0，需要调整差值
    if (referenceDay.order < 0 && dayItem.order > 0) {
      // 从负数到正数，中间少了一天(day0)
      dayDiff--;
    } else if (referenceDay.order > 0 && dayItem.order < 0) {
      // 从正数到负数，中间少了一天(day0)
      dayDiff++;
    }
    
    // 计算新的日期
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() + dayDiff);
    
    // 格式化日期为MMDD格式
    const newDateStr = 
      `${(newDate.getMonth() + 1).toString().padStart(2, '0')}${
        newDate.getDate().toString().padStart(2, '0')}`;

    return {
      ...dayItem,
      date: newDateStr
    };
  });
};

/**
 * 补全days的星期和日期信息
 * @param {Array} days - 行程天数数组
 * @returns {Array} 补全后的days数组
 */
export const completeDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    return days;
  }

  // 先补全星期信息
  const daysWithWeeks = completeDaysWeeks(days);
  
  // 再补全日期信息
  const daysWithDates = completeDaysDates(daysWithWeeks);
  
  return daysWithDates;
};

/**
 * 强制调整days的order使其连续
 * @param {Array} days - 行程天数数组
 * @param {number} sinceIndex - 开始调整的数组索引位置（可选）
 * @returns {Array} 调整后的days数组
 */
export const forceOrderDays = (days, sinceIndex = undefined) => {
  if (!Array.isArray(days) || days.length === 0) {
    return days;
  }

  // 如果sinceIndex未定义或无效，从第一天开始
  const startIndex = sinceIndex !== undefined && sinceIndex >= 0 && sinceIndex < days.length ? 
    sinceIndex : 
    0;

  const result = [...days];
  // 从startIndex开始，调整后续天数的order
  for (let i = startIndex + 1; i < result.length; i++) {
    const prevOrder = result[i - 1].order;
    let nextOrder;

    // 如果前一天是-1，下一天应该是1
    if (prevOrder === -1) {
      nextOrder = 1;
    } else {
      nextOrder = prevOrder + 1;
    }
    
    // 只有当order真的需要改变时才更新
    if (result[i].order !== nextOrder) {
      result[i] = {
        ...result[i],
        order: nextOrder
      };

      // 如果有name字段，也需要更新
      if (result[i].name) {
        const nameParts = result[i].name.split(' ');
        const newDayInfo = nextOrder > 0 ? `d${nextOrder}` : `${nextOrder}d`;
        
        // 只有当天数部分确实改变时才更新name和id
        if (nameParts[0] !== newDayInfo) {
          nameParts[0] = newDayInfo;
          result[i].name = nameParts.join(' ');
          result[i].id = hash(newDayInfo);
        }
      }
    }
  }

  return result;
};