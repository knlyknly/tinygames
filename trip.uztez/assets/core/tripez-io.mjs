import { fromText } from './tripez-io-from-text.mjs';
import { toText } from './tripez-io-to-text.mjs';
import { fromYaml } from './tripez-io-from-yaml.mjs';
import { toYaml } from './tripez-io-to-yaml.mjs';

// 行程工具类
export class Tripez {
  static fromText = fromText;
  static toText = toText;
  static fromYaml = fromYaml;
  static toYaml = toYaml;
}