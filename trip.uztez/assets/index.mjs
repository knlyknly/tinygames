import { getLocationSearchMap } from './tools.mjs';

window.addEventListener('load', () => {
  const locationSearchMap = getLocationSearchMap();
  window._AMapSecurityConfig = {
    securityJsCode: locationSearchMap.amapsec,
  };
  const loaderPromise = import('https://webapi.amap.com/loader.js');
  loaderPromise
    .then(() => AMapLoader.load({
      key: "5e498fe9bb1890f055616e909236564f", //申请好的Web端开发者key，调用 load 时必填
      version: "2.1Beta", //指定要加载的 JS API 的版本，缺省时默认为 1.4.15
    }))
    .then(AMap => {
      window.AMap = AMap;
      return AMap;
    })
    .then(AMap => {
      var map = new AMap.Map('container', {
        rotateEnable: true,//是否开启地图旋转交互 鼠标右键 + 鼠标画圈移动 或 键盘Ctrl + 鼠标画圈移动
        pitchEnable: true, // 是否开启地图倾斜交互 鼠标右键 + 鼠标上下移动或键盘Ctrl + 鼠标上下移动
        zoom: 13.8, //初始化地图层级
        pitch: 80, // 地图俯仰角度，有效范围 0 度- 83 度
        rotation: 80,//初始地图顺时针旋转的角度
        viewMode: '3D', //开启3D视图,默认为关闭
        zooms: [2, 20],//地图显示的缩放级别范围
        center: [120.121282, 30.222719],//初始地图中心经纬度
        terrain: true // 开启地形图
      });
      AMap.plugin(['AMap.ControlBar', 'AMap.ToolBar'], function () {//异步加载插件
        var controlBar = new AMap.ControlBar({//控制地图旋转插件
          position: {
            right: '10px',
            top: '10px'
          }
        });
        map.addControl(controlBar);
        var toolBar = new AMap.ToolBar({//地图缩放插件
          position: {
            right: '40px',
            top: '110px'
          }
        });
        map.addControl(toolBar)
      });
    })
    .catch(reason => console.error(reason));
});

