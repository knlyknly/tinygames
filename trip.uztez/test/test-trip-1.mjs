import { Trip } from '../assets/core/tripez-io.mjs';
import fs from 'fs';
import path from 'path';

// 读取原始文件
const originalText = fs.readFileSync(path.join('assets', 'data-example', 'trip-1.txt'), 'utf-8');

// 解析并生成新文件
const trip = Trip.fromText(originalText);
const generatedText = trip.toText();

// 将生成的文本写入新文件
fs.writeFileSync(path.join('assets', 'data-example', 'trip-1.generated.txt'), generatedText);

console.log('Test completed. Please check trip-1.generated.txt for results.');