import { completeDays, forceOrderDays } from '../assets/core/tripez-completion.mjs';
import hash from '../assets/tools/hash.mjs';
import assert from 'assert';

// 测试completeDays函数
console.log('开始测试 completeDays 函数...\n');

// 测试用例1：基本场景 - 补全连续天数的星期和日期
const testCase1 = () => {
  console.log('测试用例1：基本场景 - 补全连续天数的星期和日期');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2', weekday: 3, date: '0510' }, // 参考天：周三，5月10日
    { id: '3', order: 3, name: 'd3' },
    { id: '4', order: 4, name: 'd4' }
  ];
  
  const result = completeDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].weekday, 2, '第1天星期不正确'); // 周二
  assert.strictEqual(result[0].date, '0509', '第1天日期不正确'); // 5月9日
  
  assert.strictEqual(result[1].weekday, 3, '第2天星期不正确'); // 周三（参考天）
  assert.strictEqual(result[1].date, '0510', '第2天日期不正确'); // 5月10日（参考天）
  
  assert.strictEqual(result[2].weekday, 4, '第3天星期不正确'); // 周四
  assert.strictEqual(result[2].date, '0511', '第3天日期不正确'); // 5月11日
  
  assert.strictEqual(result[3].weekday, 5, '第4天星期不正确'); // 周五
  assert.strictEqual(result[3].date, '0512', '第4天日期不正确'); // 5月12日
  
  console.log('✓ 通过\n');
};

// 测试用例2：跨月份的日期
const testCase2 = () => {
  console.log('测试用例2：跨月份的日期');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2', weekday: 6, date: '0430' }, // 参考天：周六，4月30日
    { id: '3', order: 3, name: 'd3' },
    { id: '4', order: 4, name: 'd4' }
  ];
  
  const result = completeDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].weekday, 5, '第1天星期不正确'); // 周五
  assert.strictEqual(result[0].date, '0429', '第1天日期不正确'); // 4月29日
  
  assert.strictEqual(result[1].weekday, 6, '第2天星期不正确'); // 周六（参考天）
  assert.strictEqual(result[1].date, '0430', '第2天日期不正确'); // 4月30日（参考天）
  
  assert.strictEqual(result[2].weekday, 7, '第3天星期不正确'); // 周日
  assert.strictEqual(result[2].date, '0501', '第3天日期不正确'); // 5月1日
  
  assert.strictEqual(result[3].weekday, 1, '第4天星期不正确'); // 周一
  assert.strictEqual(result[3].date, '0502', '第4天日期不正确'); // 5月2日
  
  console.log('✓ 通过\n');
};

// 测试用例3：负数天数
const testCase3 = () => {
  console.log('测试用例3：负数天数');
  
  const days = [
    { id: '1', order: -2, name: '-2d' },
    { id: '2', order: -1, name: '-1d' },
    { id: '3', order: 1, name: 'd1', weekday: 3, date: '0601' }, // 参考天：周三，6月1日
    { id: '4', order: 2, name: 'd2' }
  ];
  
  const result = completeDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].weekday, 1, '第-2天星期不正确'); // 周一
  assert.strictEqual(result[0].date, '0530', '第-2天日期不正确'); // 5月30日
  
  assert.strictEqual(result[1].weekday, 2, '第-1天星期不正确'); // 周二
  assert.strictEqual(result[1].date, '0531', '第-1天日期不正确'); // 5月31日
  
  assert.strictEqual(result[2].weekday, 3, '第1天星期不正确'); // 周三（参考天）
  assert.strictEqual(result[2].date, '0601', '第1天日期不正确'); // 6月1日（参考天）
  
  assert.strictEqual(result[3].weekday, 4, '第2天星期不正确'); // 周四
  assert.strictEqual(result[3].date, '0602', '第2天日期不正确'); // 6月2日
  
  console.log('✓ 通过\n');
};

// 测试用例4：错误处理 - 空数组
const testCase4 = () => {
  console.log('测试用例4：错误处理 - 空数组');
  
  const days = [];
  const result = completeDays(days);
  
  assert.deepStrictEqual(result, [], '应该返回空数组');
  
  console.log('✓ 通过\n');
};

// 测试用例5：错误处理 - 无参考数据
const testCase5 = () => {
  console.log('测试用例5：错误处理 - 无参考数据');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2' },
    { id: '3', order: 3, name: 'd3' }
  ];
  
  const result = completeDays(days);
  
  // 验证结果 - 应该原样返回
  assert.deepStrictEqual(result, days, '应该原样返回');
  
  console.log('✓ 通过\n');
};

// 测试forceOrderDays函数
console.log('开始测试 forceOrderDays 函数...\n');

// 测试用例6：基本场景 - 从头开始调整order
const testCase6 = () => {
  console.log('测试用例6：基本场景 - 从头开始调整order');
  
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

// 测试用例7：指定since参数 - 从中间开始调整
const testCase7 = () => {
  console.log('测试用例7：指定since参数 - 从中间开始调整');
  
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

// 测试用例8：处理-1d到1d的特殊情况
const testCase8 = () => {
  console.log('测试用例8：处理-1d到1d的特殊情况');
  
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

// 测试用例9：错误处理 - 空数组
const testCase9 = () => {
  console.log('测试用例9：错误处理 - 空数组');
  
  const days = [];
  const result = forceOrderDays(days);
  
  assert.deepStrictEqual(result, [], '应该返回空数组');
  
  console.log('✓ 通过\n');
};

// 测试用例10：错误处理 - 无效的since参数
const testCase10 = () => {
  console.log('测试用例10：错误处理 - 无效的since参数');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2' }
  ];
  
  const result = forceOrderDays(days, 999); // 不存在的order
  
  // 验证结果 - 应该原样返回
  assert.deepStrictEqual(result, days, '应该原样返回');
  
  console.log('✓ 通过\n');
};

// 测试用例11：验证ID更新逻辑 - 基本场景
const testCase11 = () => {
  console.log('测试用例11：验证ID更新逻辑 - 基本场景');
  
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

// 测试用例12：验证ID更新逻辑 - 特殊情况
const testCase12 = () => {
  console.log('测试用例12：验证ID更新逻辑 - 特殊情况');
  
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

// 测试用例13：验证ID更新逻辑 - 带空格的name
const testCase13 = () => {
  console.log('测试用例13：验证ID更新逻辑 - 带空格的name');
  
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
  testCase9();
  testCase10();
  testCase11();
  testCase12();
  testCase13();
  
  console.log('所有测试用例通过！');
} catch (error) {
  console.error('测试失败:', error);
}