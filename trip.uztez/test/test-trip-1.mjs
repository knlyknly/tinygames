import { Tripez } from '../assets/core/tripez-io.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前模块的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 构建文件路径
const inputPath = path.join(__dirname, '../assets/data-example/trip-1.txt');
const outputTextPath = path.join(__dirname, '../assets/data-example/trip-1.generated.txt');
const outputCompactPath = path.join(__dirname, '../assets/data-example/trip-1.compact.txt');
const outputYamlPath = path.join(__dirname, '../assets/data-example/trip-1.yaml');

// 读取原始文件
const originalText = fs.readFileSync(inputPath, 'utf-8');

// 解析并生成新文件
const model = Tripez.fromText(originalText);

// 输出中间YAML结果
fs.writeFileSync(outputYamlPath, Tripez.toYaml(model));

// 将生成的文本写入新文件
fs.writeFileSync(outputTextPath, Tripez.toText(model));

// 将紧凑模式的文本写入新文件
fs.writeFileSync(outputCompactPath, Tripez.toText(model, { compactMode: true }));

console.log('Test completed. Please check:');
console.log(`- ${outputYamlPath}`);
console.log(`- ${outputTextPath}`);
console.log(`- ${outputCompactPath}`);