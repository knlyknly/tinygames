import { completeLocations } from '../assets/core/tripez-completion.mjs';
import assert from 'assert';

// 测试completeLocations函数
console.log('开始测试 completeLocations 函数...\n');

// 模拟查询经纬度的函数
const mockQueryLatLng = async (name) => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 模拟不同地点的响应
  if (name === '地点A' || name === '北京') {
    return { latitude: '39.9042', longitude: '116.4074' };
  } else if (name === '地点B' || name === '上海') {
    return { latitude: '31.2304', longitude: '121.4737' };
  } else if (name === '地点C' || name === '广州') {
    return { latitude: '23.1291', longitude: '113.2644' };
  } else {
    // 模拟未知地点的错误
    throw new Error(`无法找到地点 "${name}" 的经纬度信息`);
  }
};

// 测试用例1：基本场景 - 补全经纬度信息
const testCase1 = async () => {
  console.log('测试用例1：基本场景 - 补全经纬度信息');
  
  const locations = [
    { id: 1, name: '地点A' },
    { id: 2, name: '地点B', latlng: { latitude: '31.2305', longitude: '121.4738' } }, // 使用不同的经纬度值
    { id: 3, name: '地点C' }
  ];
  
  const result = await completeLocations(locations, mockQueryLatLng);
  
  // 验证结果
  assert.deepStrictEqual(result[0].latlng, { latitude: '39.9042', longitude: '116.4074' }, '地点A经纬度不正确');
  assert.deepStrictEqual(result[1].latlng, { latitude: '31.2305', longitude: '121.4738' }, '地点B经纬度被错误地修改');
  assert.deepStrictEqual(result[2].latlng, { latitude: '23.1291', longitude: '113.2644' }, '地点C经纬度不正确');
  
  console.log('✓ 通过\n');
};

// 测试用例2：频率控制
const testCase2 = async () => {
  console.log('测试用例2：频率控制');
  
  const locations = [
    { id: 1, name: '地点A' },
    { id: 2, name: '地点C' }  // 保持ID为2，但修改测试断言
  ];
  
  const startTime = Date.now();
  
  // 设置频率为每秒2次
  await completeLocations(locations, mockQueryLatLng, { queryFrequency: 2 });
  
  const duration = Date.now() - startTime;
  
  // 验证结果：两次查询至少需要500ms
  assert.ok(duration >= 500, `查询间隔过短: ${duration}ms`);
  
  console.log('✓ 通过\n');
};

// 测试用例3：进度监听
const testCase3 = async () => {
  console.log('测试用例3：进度监听');
  
  const locations = [
    { id: 1, name: '地点A' },
    { id: 2, name: '地点C' }
  ];
  
  const progressEvents = [];
  
  await completeLocations(locations, mockQueryLatLng, {
    progressListener: (progress) => {
      progressEvents.push({ ...progress });
    }
  });
  
  // 验证结果
  assert.strictEqual(progressEvents.length, 2, '进度事件数量不正确'); // 处理第一个、处理第二个
  
  // 验证进度通知数量
  assert.strictEqual(progressEvents.length, 2, '应该有2次进度通知');
  
  // 验证第一个地点处理
  assert.deepStrictEqual({
    completed: progressEvents[0].completed,
    progress: progressEvents[0].progress,
    total: progressEvents[0].total
  }, {
    completed: false,
    progress: 1,
    total: 2
  }, '第一个地点进度状态不正确');
  
  // 验证第二个地点处理
  assert.deepStrictEqual({
    completed: progressEvents[1].completed,
    progress: progressEvents[1].progress,
    total: progressEvents[1].total
  }, {
    completed: true,
    progress: 2,
    total: 2
  }, '第二个地点进度状态不正确');
  
  // 验证所有progress值都在合法范围内
  progressEvents.forEach((event, index) => {
    assert.ok(
      event.progress >= 0 && event.progress <= event.total,
      `进度事件${index}的progress值超出范围: ${event.progress}`
    );
  });
  
  console.log('✓ 通过\n');
};

// 测试用例4：错误处理
const testCase4 = async () => {
  console.log('测试用例4：错误处理');
  
  const locations = [
    { id: 1, name: '未知地点' }
  ];
  
  let errorThrown = false;
  
  try {
    await completeLocations(locations, mockQueryLatLng);
    assert.fail('应该抛出未知地点错误，但没有抛出');
  } catch (error) {
    errorThrown = true;
    if (!error.message.includes('未知地点')) {
      throw new Error(`错误消息应该包含"未知地点"，但实际是: ${error.message}`);
    }
  }
  
  assert.strictEqual(errorThrown, true, '应该抛出错误');
  console.log('✓ 通过：正确捕获到错误\n');
};

// 测试用例5：边界情况
const testCase5 = async () => {
  console.log('测试用例5：边界情况');
  
  // 测试空数组
  let result = await completeLocations([], mockQueryLatLng);
  assert.deepStrictEqual(result, [], '空数组应原样返回');
  
  // 测试全部已有经纬度
  const locationsWithLatLng = [
    { 
      id: 1, 
      name: '地点A',
      latlng: { latitude: '39.9042', longitude: '116.4074' }
    },
    {
      id: 2,
      name: '地点B',
      latlng: { latitude: '31.2304', longitude: '121.4737' }
    }
  ];
  
  result = await completeLocations(locationsWithLatLng, mockQueryLatLng);
  assert.deepStrictEqual(result, locationsWithLatLng, '已有经纬度的地点不应改变');
  
  console.log('✓ 通过\n');
};

// 测试用例6：正常情况 - 所有地点都能找到经纬度
const testCase6 = async () => {
  console.log('测试用例6：正常情况 - 所有地点都能找到经纬度');
  
  const locations = [
    { id: 1, name: '北京' },
    { id: 2, name: '上海' }
  ];
  
  const result = await completeLocations(locations, mockQueryLatLng);
  
  assert.deepStrictEqual(result[0].latlng, { latitude: '39.9042', longitude: '116.4074' });
  assert.deepStrictEqual(result[1].latlng, { latitude: '31.2304', longitude: '121.4737' });
  
  console.log('✓ 通过\n');
};

// 测试用例7：错误情况 - 包含未知地点
const testCase7 = async () => {
  console.log('测试用例7：错误情况 - 包含未知地点');
  
  const locations = [
    { id: 1, name: '北京' },
    { id: 2, name: '未知城市' },
    { id: 3, name: '上海' }
  ];
  
  try {
    await completeLocations(locations, mockQueryLatLng);
    assert.fail('应该抛出错误');
  } catch (error) {
    assert.ok(error.message.includes('无法找到地点'), '错误消息不正确');
  }
  
  console.log('✓ 通过\n');
};

// 测试用例8：错误情况 - 第一个地点就失败
const testCase8 = async () => {
  console.log('测试用例8：错误情况 - 第一个地点就失败');
  
  const locations = [
    { id: 1, name: '无效地点' },
    { id: 2, name: '上海' }
  ];
  
  try {
    await completeLocations(locations, mockQueryLatLng);
    assert.fail('应该抛出错误');
  } catch (error) {
    assert.ok(error.message.includes('无法找到地点'), '错误消息不正确');
  }
  
  console.log('✓ 通过\n');
};

// 测试用例9：错误情况 - 最后一个地点失败
const testCase9 = async () => {
  console.log('测试用例9：错误情况 - 最后一个地点失败');
  
  const locations = [
    { id: 1, name: '北京' },
    { id: 2, name: '无效地点' }
  ];
  
  try {
    await completeLocations(locations, mockQueryLatLng);
    assert.fail('应该抛出错误');
  } catch (error) {
    assert.ok(error.message.includes('无法找到地点'), '错误消息不正确');
  }
  
  console.log('✓ 通过\n');
};

// 运行所有测试用例
const runTests = async () => {
  try {
    await testCase1();
    await testCase2();
    await testCase3();
    await testCase4();
    await testCase5();
    await testCase6();
    await testCase7();
    await testCase8();
    await testCase9();
    
    console.log('所有测试用例通过！');
    process.exit(0); // 成功退出
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1); // 失败退出
  }
};

// 处理未捕获的Promise拒绝
process.on('unhandledRejection', (error) => {
  console.error('未捕获的Promise拒绝:', error);
  process.exit(1);
});

runTests();