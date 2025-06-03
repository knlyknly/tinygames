export default class GeoService {
  // 高德地图 API key，需要替换为您自己的 key
  constructor(apiKey) {
    this.apiKey = apiKey || 'e425795b04aef45e57c9b0827af8fcbf';
  }

  // 根据地址文本查询位置信息
  promptLocations = async (text) => {
    try {
      // 使用高德地图地理编码 API
      const encodedText = encodeURIComponent(text);
      const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodedText}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1') {
        return data.geocodes || [];
      } else {
        console.error('地理编码查询失败:', data.info);
        return [];
      }
    } catch (error) {
      console.error('地理编码查询出错:', error);
      return [];
    }
  }

  // 根据经纬度获取地址信息
  regeocode = async (longitude, latitude) => {
    try {
      // 使用高德地图逆地理编码 API
      const location = `${longitude},${latitude}`;
      const url = `https://restapi.amap.com/v3/geocode/regeo?location=${location}&key=${this.apiKey}&extensions=all`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1') {
        return data.regeocode || {};
      } else {
        console.error('逆地理编码查询失败:', data.info);
        return {};
      }
    } catch (error) {
      console.error('逆地理编码查询出错:', error);
      return {};
    }
  }
}