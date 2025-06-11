import { forceOrderDays } from '../assets/core/tripez-completion.mjs';
import hash from '../assets/tools/hash.mjs';
import assert from 'assert';

// 测试forceOrderDays函数
console.log('开始测试 forceOrderDays 函数...\n');

// 测试用例1：基本场景 - 从头开始调整order
const testCase1 = () => {
  console.log('测试用例1：基本场景 - 从头开始调整order');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 3, name: 'd3' }, // 不连续
    { id: '3', order: 5, name: 'd5' }, // 不连续
    { id: '4', order: 8, name: 'd8' }  // 不连续
  ];
  
  const result = forceOrderDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].order, 1, '第1天order不正确');
  assert.strictEqual(result[0].name, 'd1', '第1天name不正确');
  assert.strictEqual(result[0].id, '1', '第1天id应保持不变，因为order和name未改变');
  
  assert.strictEqual(result[1].order, 2, '第2天order不正确');
  assert.strictEqual(result[1].name, 'd2', '第2天name不正确');
  assert.strictEqual(result[1].id, hash('d2'), '第2天id应更新，因为name改变');
  
  assert.strictEqual(result[2].order, 3, '第3天order不正确');
  assert.strictEqual(result[2].name, 'd3', '第3天name不正确');
  assert.strictEqual(result[2].id, hash('d3'), '第3天id应更新，因为name改变');
  
  assert.strictEqual(result[3].order, 4, '第4天order不正确');
  assert.strictEqual(result[3].name, 'd4', '第4天name不正确');
  assert.strictEqual(result[3].id, hash('d4'), '第4天id应更新，因为name改变');
  
  console.log('✓ 通过\n');
};

// 测试用例2：指定since参数 - 从中间开始调整
const testCase2 = () => {
  console.log('测试用例2：指定since参数 - 从中间开始调整');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2' },
    { id: '3', order: 5, name: 'd5' }, // 从这里开始调整
    { id: '4', order: 8, name: 'd8' }
  ];
  
  const result = forceOrderDays(days, 2);
  
  // 验证结果
  assert.strictEqual(result[0].order, 1, '第1天order不正确');
  assert.strictEqual(result[0].name, 'd1', '第1天name不正确');
  assert.strictEqual(result[0].id, '1', '第1天id应保持不变');
  
  assert.strictEqual(result[1].order, 2, '第2天order不正确');
  assert.strictEqual(result[1].name, 'd2', '第2天name不正确');
  assert.strictEqual(result[1].id, '2', '第2天id应保持不变');
  
  assert.strictEqual(result[2].order, 5, '第3天order不正确'); // 保持不变
  assert.strictEqual(result[2].name, 'd5', '第3天name不正确');
  assert.strictEqual(result[2].id, '3', '第3天id应保持不变');
  
  assert.strictEqual(result[3].order, 6, '第4天order不正确'); // 调整为连续
  assert.strictEqual(result[3].name, 'd6', '第4天name不正确');
  assert.strictEqual(result[3].id, hash('d6'), '第4天id应更新');
  
  console.log('✓ 通过\n');
};

// 测试用例3：处理-1d到1d的特殊情况
const testCase3 = () => {
  console.log('测试用例3：处理-1d到1d的特殊情况');
  
  const days = [
    { id: '1', order: -2, name: '-2d' },
    { id: '2', order: -1, name: '-1d' },
    { id: '3', order: 3, name: 'd3' }, // 应该变成1
    { id: '4', order: 5, name: 'd5' }  // 应该变成2
  ];
  
  const result = forceOrderDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].order, -2, '第1天order不正确');
  assert.strictEqual(result[0].name, '-2d', '第1天name不正确');
  assert.strictEqual(result[0].id, '1', '第1天id应保持不变');
  
  assert.strictEqual(result[1].order, -1, '第2天order不正确');
  assert.strictEqual(result[1].name, '-1d', '第2天name不正确');
  assert.strictEqual(result[1].id, '2', '第2天id应保持不变');
  
  assert.strictEqual(result[2].order, 1, '第3天order不正确'); // -1d的下一天是1d
  assert.strictEqual(result[2].name, 'd1', '第3天name不正确');
  assert.strictEqual(result[2].id, hash('d1'), '第3天id应更新');
  
  assert.strictEqual(result[3].order, 2, '第4天order不正确');
  assert.strictEqual(result[3].name, 'd2', '第4天name不正确');
  assert.strictEqual(result[3].id, hash('d2'), '第4天id应更新');
  
  console.log('✓ 通过\n');
};

// 测试用例4：错误处理 - 空数组
const testCase4 = () => {
  console.log('测试用例4：错误处理 - 空数组');
  
  const days = [];
  const result = forceOrderDays(days);
  
  assert.deepStrictEqual(result, [], '应该返回空数组');
  
  console.log('✓ 通过\n');
};

// 测试用例5：错误处理 - 无效的since参数
const testCase5 = () => {
  console.log('测试用例5：错误处理 - 无效的since参数');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2' }
  ];
  
  const result = forceOrderDays(days, 999); // 不存在的order
  
  // 验证结果 - 应该原样返回
  assert.deepStrictEqual(result, days, '应该原样返回');
  
  console.log('✓ 通过\n');
};

// 测试用例6：验证ID更新逻辑 - 基本场景
const testCase6 = () => {
  console.log('测试用例6：验证ID更新逻辑 - 基本场景');
  
  // 准备测试数据
  const days = [
    { id: 'original1', name: 'd1', order: 1 },  // order不变，ID应保持不变
    { id: 'original2', name: 'd2', order: 2 },  // order不变，ID应保持不变
    { id: 'original3', name: 'd3', order: 3 },  // order不变，ID应保持不变
    { id: 'original4', name: 'd5', order: 5 }   // order改变且name前缀也改变，ID应更新
  ];
  
  // 执行函数
  const result = forceOrderDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].order, 1, '第1天order应保持不变');
  assert.strictEqual(result[0].name, 'd1', '第1天name应保持不变');
  assert.strictEqual(result[0].id, 'original1', '第1天id应保持不变');
  
  assert.strictEqual(result[1].order, 2, '第2天order应保持不变');
  assert.strictEqual(result[1].name, 'd2', '第2天name应保持不变');
  assert.strictEqual(result[1].id, 'original2', '第2天id应保持不变');
  
  assert.strictEqual(result[2].order, 3, '第3天order应保持不变');
  assert.strictEqual(result[2].name, 'd3', '第3天name应保持不变');
  assert.strictEqual(result[2].id, 'original3', '第3天id应保持不变');
  
  assert.strictEqual(result[3].order, 4, '第4天order应更新');
  assert.strictEqual(result[3].name, 'd4', '第4天name应更新');
  assert.strictEqual(result[3].id, hash('d4'), '第4天id应更新');
  
  console.log('✓ 通过\n');
};

// 测试用例7：验证ID更新逻辑 - 特殊情况
const testCase7 = () => {
  console.log('测试用例7：验证ID更新逻辑 - 特殊情况');
  
  // 准备测试数据 - 没有name字段的情况
  const days = [
    { id: 'original1', order: 1 },  // 没有name字段，ID应保持不变
    { id: 'original2', order: 2 },  // 没有name字段，ID应保持不变
    { id: 'original3', order: 5 },  // order改变，但没有name字段，ID应保持不变
    { id: 'original4', order: 8 }   // order改变，但没有name字段，ID应保持不变
  ];
  
  // 执行函数
  const result = forceOrderDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].order, 1, '第1天order应保持不变');
  assert.strictEqual(result[0].id, 'original1', '第1天id应保持不变');
  
  assert.strictEqual(result[1].order, 2, '第2天order应保持不变');
  assert.strictEqual(result[1].id, 'original2', '第2天id应保持不变');
  
  assert.strictEqual(result[2].order, 3, '第3天order应更新');
  assert.strictEqual(result[2].id, 'original3', '第3天id应保持不变，因为没有name字段');
  
  assert.strictEqual(result[3].order, 4, '第4天order应更新');
  assert.strictEqual(result[3].id, 'original4', '第4天id应保持不变，因为没有name字段');
  
  console.log('✓ 通过\n');
};

// 测试用例8：验证ID更新逻辑 - 带空格的name
const testCase8 = () => {
  console.log('测试用例8：验证ID更新逻辑 - 带空格的name');
  
  // 准备测试数据
  const days = [
    { id: 'original1', name: 'd1 测试', order: 1 },  // order不变，ID应保持不变
    { id: 'original2', name: 'd2 测试', order: 2 },  // order不变，ID应保持不变
    { id: 'original3', name: 'd3 测试', order: 3 },  // order不变，ID应保持不变
    { id: 'original4', name: 'd5 测试', order: 5 }   // order改变且name前缀也改变，ID应更新
  ];
  
  // 执行函数
  const result = forceOrderDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].order, 1, '第1天order应保持不变');
  assert.strictEqual(result[0].name, 'd1 测试', '第1天name应保持不变');
  assert.strictEqual(result[0].id, 'original1', '第1天id应保持不变');
  
  assert.strictEqual(result[1].order, 2, '第2天order应保持不变');
  assert.strictEqual(result[1].name, 'd2 测试', '第2天name应保持不变');
  assert.strictEqual(result[1].id, 'original2', '第2天id应保持不变');
  
  assert.strictEqual(result[2].order, 3, '第3天order应保持不变');
  assert.strictEqual(result[2].name, 'd3 测试', '第3天name应保持不变');
  assert.strictEqual(result[2].id, 'original3', '第3天id应保持不变');
  
  assert.strictEqual(result[3].order, 4, '第4天order应更新');
  assert.strictEqual(result[3].name, 'd4 测试', '第4天name应更新');
  assert.strictEqual(result[3].id, hash('d4'), '第4天id应更新');
  
  console.log('✓ 通过\n');
};

// 运行所有测试用例
try {
  testCase1();
  testCase2();
  testCase3();
  testCase4();
  testCase5();
  testCase6();
  testCase7();
  testCase8();
  
  console.log('所有测试用例通过！');
} catch (error) {
  console.error('测试失败:', error);
}