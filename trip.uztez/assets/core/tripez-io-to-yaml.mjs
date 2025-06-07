import yaml from 'js-yaml';

/**
 * 将TripezModel转换为YAML格式
 * @param {TripezModel} model TripezModel实例
 * @returns {string} YAML文本
 */
export function toYaml(model) {
  try {
    // 准备locations数据，确保latlng字段正确序列化
    const locations = model.locations.map((loc) => {
      const { latlng, ...rest } = loc;
      if (latlng) {
        return { ...rest, latlng };
      }
      return rest;
    });

    return yaml.dump(
      {
        locations,
        destinations: model.destinations,
        routes: model.routes,
        scheduleDays: model.scheduleDays,
        scheduleItems: model.scheduleItems,
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