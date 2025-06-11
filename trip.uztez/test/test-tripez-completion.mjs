import { completeDays } from '../assets/core/tripez-completion.mjs';
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

// 测试用例6：跨年场景 - 从12月31日到1月1日
const testCase6 = () => {
  console.log('测试用例6：跨年场景 - 从12月31日到1月1日');
  
  const days = [
    { id: '1', order: 1, name: 'd1' },
    { id: '2', order: 2, name: 'd2', weekday: 6, date: '1231' }, // 参考天：周六，12月31日
    { id: '3', order: 3, name: 'd3' },
    { id: '4', order: 4, name: 'd4' }
  ];
  
  const result = completeDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].weekday, 5, '第1天星期不正确'); // 周五
  assert.strictEqual(result[0].date, '1230', '第1天日期不正确'); // 12月30日
  
  assert.strictEqual(result[1].weekday, 6, '第2天星期不正确'); // 周六（参考天）
  assert.strictEqual(result[1].date, '1231', '第2天日期不正确'); // 12月31日（参考天）
  
  assert.strictEqual(result[2].weekday, 7, '第3天星期不正确'); // 周日
  assert.strictEqual(result[2].date, '0101', '第3天日期不正确'); // 1月1日
  
  assert.strictEqual(result[3].weekday, 1, '第4天星期不正确'); // 周一
  assert.strictEqual(result[3].date, '0102', '第4天日期不正确'); // 1月2日
  
  console.log('✓ 通过\n');
};

// 测试用例7：向前跨年场景 - 从1月1日向前到12月31日
const testCase7 = () => {
  console.log('测试用例7：向前跨年场景 - 从1月1日向前到12月31日');
  
  const days = [
    { id: '1', order: -2, name: '-2d' },
    { id: '2', order: -1, name: '-1d' },
    { id: '3', order: 1, name: 'd1', weekday: 7, date: '0101' }, // 参考天：周日，1月1日
    { id: '4', order: 2, name: 'd2' }
  ];
  
  const result = completeDays(days);
  
  // 验证结果
  assert.strictEqual(result[0].weekday, 5, '第-2天星期不正确'); // 周五
  assert.strictEqual(result[0].date, '1230', '第-2天日期不正确'); // 12月30日
  
  assert.strictEqual(result[1].weekday, 6, '第-1天星期不正确'); // 周六
  assert.strictEqual(result[1].date, '1231', '第-1天日期不正确'); // 12月31日
  
  assert.strictEqual(result[2].weekday, 7, '第1天星期不正确'); // 周日（参考天）
  assert.strictEqual(result[2].date, '0101', '第1天日期不正确'); // 1月1日（参考天）
  
  assert.strictEqual(result[3].weekday, 1, '第2天星期不正确'); // 周一
  assert.strictEqual(result[3].date, '0102', '第2天日期不正确'); // 1月2日
  
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
  
  console.log('所有测试用例通过！');
} catch (error) {
  console.error('测试失败:', error);
}