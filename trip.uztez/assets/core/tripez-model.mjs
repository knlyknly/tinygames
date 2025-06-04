/**
 * @typedef {Object} Location
 * @property {number} id - 唯一标识符
 * @property {string} name - 地点名称
 * @property {number|null} altitude - 海拔高度
 * @property {string[]} additionDescriptions - 附加描述
 * @property {string[]} labels - 标签
 * @property {number[]} destinations - 目的地ID列表
 */

/**
 * @typedef {Object} Destination
 * @property {number} id - 唯一标识符
 * @property {string} name - 目的地名称
 * @property {string|null} direction - 方向
 * @property {number|null} distance - 距离
 */

/**
 * @typedef {Object} Route
 * @property {number} id - 唯一标识符
 * @property {string} name - 路线名称
 * @property {string} startPlaceName - 起点名称
 * @property {string|null} endLocationName - 终点名称
 * @property {number} distance - 距离
 * @property {number} durationForward - 正向耗时
 * @property {number} durationBackward - 反向耗时
 */

/**
 * @typedef {Object} ScheduleDay
 * @property {number} id - 唯一标识符
 * @property {number} order - 顺序
 * @property {string} date - 日期
 * @property {number[]} scheduleItemIds - 行程项ID列表
 */

/**
 * @typedef {Object} ScheduleItem
 * @property {number} id - 唯一标识符
 * @property {string|null} time - 时间
 * @property {number|null} locationId - 地点ID
 * @property {number|null} routeId - 路线ID
 * @property {'forward'|'backward'|null} direction - 路线方向(仅route类型)
 * @property {number|null} distance - 路线距离(米,仅route类型)
 * @property {number|null} duration - 路线时长(分钟,仅route类型)
 * @property {number|null} stayTime - 停留时间
 */

// 数据模型类
export class TripModel {
  constructor() {
    this.locations = []; // Location[]
    this.destinations = []; // Destination[]
    this.routes = []; // Route[]
    this.scheduleDays = []; // ScheduleDay[]
    this.scheduleItems = []; // ScheduleItem[]
  }
}

export default TripModel;