import { parse, stringify } from './parser-ast.mjs';
import yaml from 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.mjs';

const text = ` (;GM[
  1
]FF[
  4
]SZ[
  19
]GN[珍珑1
]DT[
  2025-03-18
]PB[黑方
]PW[白方
]BR[九段
]WR[九段
]KM[
  7.5
]RU[Chinese
]AP[KaTrain: 1.15.0
]TM[
  3600
]TC[
  3
]TT[
  60
]RL[
  0
]AB[aa
][ab
][ac
][ba
][bb
]AW[ad
]PL[W
]CA[UTF-8
]KTV[
  1.0
]C[SGF generated by KaTrain 1.15.0ㅤ​
](;W[ae
]C[手数 1: W A15
分数: B+1.0
胜率: B 55.4%
目数损失: 7.8
推荐最佳选点 D4 (W+7.0).
PV: WD4 B16 R16 Q4 P16 C3
直觉选点下该手棋是 #290 (0.00%).
最佳直觉选点是 B16 (58.0%).
ㅤ​
])(;W[en
]C[手数 1: W E6
分数: W+4.9
胜率: W 87.5%
目数损失: 1.9
推荐最佳选点 D4 (W+7.0).
PV: WD4 B16 R16 Q4 P16 C3
直觉选点下该手棋是 #119 (0.04%).
最佳直觉选点是 B16 (58.0%).
ㅤ​
];B[]C[手数 2: B pass
分数: W+19.0
胜率: W 99.6%
目数损失: 14.1
推荐最佳选点 D3 (W+4.8).
PV: BD3 Q16 Q4 B16 C17 D15 F17 C4 C3
直觉选点下该手棋是 #355 (0.00%).
最佳直觉选点是 D4 (23.1%).
ㅤ​
]))`;


const ast = parse(text);
console.log(yaml.dump(ast));

const backtext = stringify(ast);
console.log(backtext===text?'match':'mismatch');