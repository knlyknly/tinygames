import { fromScheduleDayText } from '../assets/core/tripez-format.mjs';
import assert from 'assert';

// 测试用例
const testCases = [
    {
        input: 'd1',
        expected: {
            order: 1,
            name: 'd1'
        }
    },
    {
        input: 'd2 w1-0101',
        expected: {
            order: 2,
            weekday: 1,
            date: '0101',
            name: 'd2 w1-0101'
        }
    },
    {
        input: 'd3 10km',
        expected: {
            order: 3,
            distance: 10,
            name: 'd3'
        }
    },
    {
        input: 'd4 w2-0102 20km',
        expected: {
            order: 4,
            weekday: 2,
            date: '0102',
            distance: 20,
            name: 'd4 w2-0102'
        }
    },
    {
        input: '-1d',
        expected: {
            order: -1,
            name: '-1d'
        }
    },
    {
        input: '-2d w7-1231',
        expected: {
            order: -2,
            weekday: 7,
            date: '1231',
            name: '-2d w7-1231'
        }
    },
    {
        input: 'd5 w3-0103 15km',
        expected: {
            order: 5,
            weekday: 3,
            date: '0103',
            distance: 15,
            name: 'd5 w3-0103'
        }
    }
];

// 错误测试用例
const errorTestCases = [
    {
        input: '',
        errorMessage: 'Invalid input: text must be a non-empty string'
    },
    {
        input: null,
        errorMessage: 'Invalid input: text must be a non-empty string'
    },
    {
        input: 'not a day',
        errorMessage: 'Invalid day number format'
    },
    {
        input: 'd',
        errorMessage: 'Invalid day number format'
    }
];

// 运行测试
console.log('开始测试 fromScheduleDayText 函数...\n');

// 测试正常用例
testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: ${testCase.input}`);
    
    const result = fromScheduleDayText(testCase.input);
    console.log('解析结果:', result);
    
    // 验证必需字段
    assert(result.id, '缺少id字段');
    assert.strictEqual(result.order, testCase.expected.order, 'order不匹配');
    assert.strictEqual(result.name, testCase.expected.name, 'name不匹配');
    
    // 验证可选字段
    if (testCase.expected.weekday !== undefined) {
        assert.strictEqual(result.weekday, testCase.expected.weekday, 'weekday不匹配');
    }
    if (testCase.expected.date !== undefined) {
        assert.strictEqual(result.date, testCase.expected.date, 'date不匹配');
    }
    if (testCase.expected.distance !== undefined) {
        assert.strictEqual(result.distance, testCase.expected.distance, 'distance不匹配');
    }
    
    console.log('✓ 通过\n');
});

// 测试错误用例
errorTestCases.forEach((testCase, index) => {
    console.log(`错误测试用例 ${index + 1}: ${testCase.input}`);
    
    try {
        fromScheduleDayText(testCase.input);
        assert.fail('应该抛出错误');
    } catch (error) {
        assert.strictEqual(error.message, testCase.errorMessage, '错误消息不匹配');
        console.log('✓ 通过（正确捕获错误）\n');
    }
});

console.log('所有测试用例通过！');