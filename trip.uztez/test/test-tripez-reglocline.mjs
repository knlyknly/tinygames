import { REG_LOCATION_LINE } from '../assets/core/tripez-format.mjs';
import assert from 'assert';

// 测试用例
const testCases = [
    {
        input: '20:00 理塘&亚丁村↑3000&亚丁景区(35km-1.5h)',
        expected: {
            time: '20:00',
            location: '理塘&亚丁村',
            altitude: '3000',
            rest: '&亚丁景区',
            routeInfo: '35km-1.5h'
        }
    },
    {
        input: '18:00 成都↑512(43km-1h)',
        expected: {
            time: '18:00',
            location: '成都',
            altitude: '512',
            rest: '',
            routeInfo: '43km-1h'
        }
    },
    {
        input: '19:00 崇州&望蜀里&川藏线起点',
        expected: {
            time: '19:00',
            location: '崇州&望蜀里&川藏线起点',
            altitude: undefined,
            rest: '',
            routeInfo: undefined
        }
    },
    {
        input: '23:00 泸定县↑1321&泸定桥',
        expected: {
            time: '23:00',
            location: '泸定县',
            altitude: '1321',
            rest: '&泸定桥',
            routeInfo: undefined
        }
    },
    {
        input: '18:00 高尔寺山↑4412(57km-2h)',
        expected: {
            time: '18:00',
            location: '高尔寺山',
            altitude: '4412',
            rest: '',
            routeInfo: '57km-2h'
        }
    },
    {
        input: '19:00 巴塘县 ↑2580',  // 注意这里地点名称后有空格
        expected: {
            time: '19:00',
            location: '巴塘县 ',  // 保留原始空格
            altitude: '2580',
            rest: '',
            routeInfo: undefined
        }
    },
    {
        input: '09:00 金沙江大桥&海通沟(59km-1h)',
        expected: {
            time: '09:00',
            location: '金沙江大桥&海通沟',
            altitude: undefined,
            rest: '',
            routeInfo: '59km-1h'
        }
    },
    // 测试新的海拔标记 ⊼
    {
        input: '20:00 理塘⊼3000&亚丁村(35km-1.5h)',
        expected: {
            time: '20:00',
            location: '理塘',
            altitude: '3000',
            rest: '&亚丁村',
            routeInfo: '35km-1.5h'
        }
    },
    {
        input: '18:00 成都⊼512',
        expected: {
            time: '18:00',
            location: '成都',
            altitude: '512',
            rest: '',
            routeInfo: undefined
        }
    },
    {
        input: '23:00 泸定县⊼1321&泸定桥&大渡河',
        expected: {
            time: '23:00',
            location: '泸定县',
            altitude: '1321',
            rest: '&泸定桥&大渡河',
            routeInfo: undefined
        }
    }
];

// 运行测试
console.log('开始测试 REG_LOCATION_LINE 正则表达式...\n');

testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: ${testCase.input}`);
    
    const match = testCase.input.match(REG_LOCATION_LINE);
    assert(match, `匹配失败: ${testCase.input}`);
    
    const [fullMatch, time, location, altitude, rest, routeInfo] = match;
    
    console.log('匹配结果:');
    console.log('- 完整匹配:', fullMatch);
    console.log('- 时间:', time);
    console.log('- 地点:', location);
    console.log('- 海拔:', altitude);
    console.log('- 剩余部分:', rest);
    console.log('- 路线信息:', routeInfo);
    
    // 验证各个部分
    assert.strictEqual(time, testCase.expected.time, '时间不匹配');
    assert.strictEqual(location, testCase.expected.location, '地点不匹配');
    assert.strictEqual(altitude, testCase.expected.altitude, '海拔不匹配');
    // 移除路线信息部分后的剩余部分（处理rest可能为undefined的情况）
    const restWithoutRoute = (rest || '').replace(/\s*\(.*?\)\s*$/, '').trim();
    assert.strictEqual(restWithoutRoute, testCase.expected.rest, '剩余部分不匹配');
    assert.strictEqual(routeInfo, testCase.expected.routeInfo, '路线信息不匹配');
    
    console.log('✓ 通过\n');
});

console.log('所有测试用例通过！');