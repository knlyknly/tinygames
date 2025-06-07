import yaml from 'js-yaml';
import TripezModel from './tripez-model.mjs';

/**
 * 从YAML格式解析行程
 * @param {string} yamlText YAML文本
 * @returns {TripezModel} TripezModel实例
 * @throws {Error} 如果YAML格式无效或缺少必要字段
 */
export function fromYaml(yamlText) {
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