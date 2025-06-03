import { Trip } from './trip-model.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取示例文件
const examplePath = path.join(__dirname, '../data-example/trip-1.txt');
const exampleText = fs.readFileSync(examplePath, 'utf-8');

// 测试 fromText 方法
console.log('测试 fromText 方法...');
const trip = Trip.fromText(exampleText);
console.log('解析成功！');
console.log(`解析到 ${trip.model.scheduleDays.length} 天行程`);
console.log(`解析到 ${trip.model.locations.length} 个地点`);
console.log(`解析到 ${trip.model.routes.length} 条路线`);
console.log(`解析到 ${trip.model.destinations.length} 个目的地`);
console.log(`解析到 ${trip.model.scheduleItems.length} 个行程项`);

// 测试 toText 方法
console.log('\n测试 toText 方法...');
const regeneratedText = trip.toText();
console.log('生成成功！');
console.log('生成的文本前100个字符:');
console.log(regeneratedText.substring(0, 100) + '...');

// 测试 toYaml 方法
console.log('\n测试 toYaml 方法...');
const yamlText = trip.toYaml();
console.log('生成成功！');
console.log('生成的YAML前100个字符:');
console.log(yamlText.substring(0, 100) + '...');

// 测试 fromYaml 方法
console.log('\n测试 fromYaml 方法...');
const tripFromYaml = Trip.fromYaml(yamlText);
console.log('解析成功！');
console.log(`解析到 ${tripFromYaml.model.scheduleDays.length} 天行程`);

// 测试完整循环
console.log('\n测试完整循环 (text -> yaml -> text)...');
const finalText = tripFromYaml.toText();
console.log('生成成功！');
console.log('最终文本与原始文本是否相似:');
console.log(finalText.substring(0, 100) === exampleText.substring(0, 100) ? '是' : '否');