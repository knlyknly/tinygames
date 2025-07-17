// 检测环境并使用适当的MD5实现
let cryptoModule;

// 检测是否在Node.js环境
const isNode = typeof process !== 'undefined' && 
               process.versions && 
               process.versions.node;

// 简单的浏览器端MD5实现
function md5Browser(str) {
  // 将字符串转换为字节数组
  function stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode < 128) {
        bytes.push(charCode);
      } else if (charCode < 2048) {
        bytes.push((charCode >> 6) | 192);
        bytes.push((charCode & 63) | 128);
      } else {
        bytes.push((charCode >> 12) | 224);
        bytes.push(((charCode >> 6) & 63) | 128);
        bytes.push((charCode & 63) | 128);
      }
    }
    return bytes;
  }

  // MD5算法常量
  const k = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12,
    5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2,
    0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9
  ];
  
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  
  const t = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  // 辅助函数
  function leftRotate(x, c) {
    return (x << c) | (x >>> (32 - c));
  }

  // 将字节数组转换为32位整数数组
  function bytesToWords(bytes) {
    const words = [];
    let i;
    for (i = 0; i < bytes.length; i++) {
      words[i >> 2] |= bytes[i] << ((i % 4) * 8);
    }
    return words;
  }

  // 将32位整数转换为十六进制字符串
  function wordsToHex(words) {
    let hex = '';
    for (let i = 0; i < words.length * 4; i++) {
      const byte = (words[i >> 2] >> ((i % 4) * 8)) & 0xFF;
      hex += (byte < 16 ? '0' : '') + byte.toString(16);
    }
    return hex;
  }

  // 主MD5算法
  const bytes = stringToBytes(str);
  
  // 添加填充
  bytes.push(0x80);
  const bitLength = str.length * 8;
  while ((bytes.length % 64) !== 56) bytes.push(0);
  
  // 添加长度
  for (let i = 0; i < 8; i++) {
    bytes.push((bitLength >>> (i * 8)) & 0xFF);
  }
  
  // 初始化哈希值
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  
  // 处理每个512位块
  const words = bytesToWords(bytes);
  for (let i = 0; i < words.length; i += 16) {
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    
    for (let j = 0; j < 64; j++) {
      let f, g;
      
      if (j < 16) {
        f = (b & c) | ((~b) & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | ((~d) & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | (~d));
        g = (7 * j) % 16;
      }
      
      const temp = d;
      d = c;
      c = b;
      b = b + leftRotate((a + f + t[j] + words[i + g]), s[j]);
      a = temp;
    }
    
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }
  
  // 将结果转换为十六进制字符串
  return wordsToHex([h0, h1, h2, h3]);
}

// 导出hash函数
export const hash = (str) => {
  if (isNode) {
    // 懒加载Node.js的crypto模块
    if (!cryptoModule) {
      try {
        // 在Node.js环境中动态导入crypto模块
        cryptoModule = require('crypto');
      } catch (e) {
        console.error('Failed to load crypto module:', e);
        // 如果加载失败，回退到浏览器实现
        return md5Browser(str);
      }
    }
    return cryptoModule.createHash('md5').update(str).digest('hex');
  } else {
    // 浏览器环境使用我们的MD5实现
    return md5Browser(str);
  }
};

export default hash;