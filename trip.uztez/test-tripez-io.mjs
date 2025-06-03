import { parse, generate } from './assets/core/tripez-io.mjs';
import fs from 'fs/promises';
import yaml from 'js-yaml';

async function testParseAndGenerate() {
  try {
    // 读取trip-1.txt文件
    console.log('读取trip-1.txt文件...');
    const tripText = await fs.readFile('./assets/data-example/trip-1.txt', 'utf-8');
    
    // 解析文本
    console.log('解析文本...');
    const parsedData = parse(tripText);
    
    // 输出解析结果
    console.log('解析结果:');
    console.log(`- 地点数量: ${parsedData.locations.length}`);
    console.log(`- 路线数量: ${parsedData.routes.length}`);
    
    // 将解析结果转换为YAML格式
    const yamlData = yaml.dump(parsedData);
    
    // 保存解析结果为YAML文件
    console.log('保存解析结果为parsed-trip.yaml...');
    await fs.writeFile('./parsed-trip.yaml', yamlData);
    
    // 读取trip-2.yaml文件进行比较
    console.log('读取trip-2.yaml文件进行比较...');
    const originalYaml = await fs.readFile('./assets/data-example/trip-2.yaml', 'utf-8');
    const originalData = yaml.load(originalYaml);
    
    // 简单比较两个数据结构
    console.log('比较解析结果与原始YAML:');
    console.log(`- 原始地点数量: ${originalData.locations.length}, 解析地点数量: ${parsedData.locations.length}`);
    console.log(`- 原始路线数量: ${originalData.routes.length}, 解析路线数量: ${parsedData.routes.length}`);
    
    // 使用generate函数将解析结果转换回文本格式
    console.log('生成行程表文本...');
    const generatedText = generate(parsedData);
    
    // 保存生成的文本
    console.log('保存生成的文本为generated-trip.txt...');
    await fs.writeFile('./generated-trip.txt', generatedText);
    
    console.log('测试完成!');
    console.log('可以比较以下文件:');
    console.log('- 原始行程表: ./assets/data-example/trip-1.txt');
    console.log('- 生成的行程表: ./generated-trip.txt');
    console.log('- 原始YAML: ./assets/data-example/trip-2.yaml');
    console.log('- 解析生成的YAML: ./parsed-trip.yaml');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

testParseAndGenerate();