import { parse, stringify, TYPES } from "./parser-ast.mjs";

const identity = v => v;

const pathy = (target, path, value) => {
  const keys = path.split('.');
  while (keys.length > 1) {
    const key = keys.shift();
    if (!target[key]) {
      target[key] = typeof key === 'number' ? [] : {};
    }
    target = target[key];
  }
  if (arguments.length === 2) {
    return target[keys[0]];
  }
  target[keys[0]] = value;
  return value;
};

const pointsFromSgf = (() => {
  const isPoint = /^[a-zA-Z]{2}$/;
  const isArea = /^[a-zA-Z]{2}:[a-zA-Z]{2}$/;
  const idx = c => c < 'a' ?
    27 + c.charCodeAt(0) - 'A'.charCodeAt(0) :
    1 + c.charCodeAt(0) - 'a'.charCodeAt(0);
  return (v) => {
    if (isPoint.test(v)) {
      return v.split('').map(idx);
    }
    if (isArea.test(v)) {
      const [x1, y1, _, x2, y2] = v.split('').map(idx);
      const points = [];
      for (let i = x1; i <= x2; i++) {
        for (let j = y1; j <= y2; j++) {
          points.push([i, j]);
        }
      }
      return points;
    }
  };
})();

const pointsToSgf = (() => {
  const tochar = idx => {
    if (idx > 52) {
      // TODO invalid
      throw new SyntaxError(`Board size over 52 not supported`);
    }
    let c1 = 'a';
    if (idx > 26) {
      idx -= 26;
      c1 = 'A';
    }
    return String.fromCharCode(c1.charCodeAt(0) + idx - 1);
  }
  return points => {
    if (points.length > 1) {
      // FIXME detect if it's a rectangle, else it would separate moves
      return points.map(point => point.map(tochar).join('')).join('][');
    }
    if (points.length === 1) {
      return points[0].map(tochar).join('');
    }
    return '';
  }
})();

const COMMENTSEP = '\n=====\n';

export const GoMeta = {
  GM: {
    path: 'additionalInfo.gameMode',
    comment: 'game mode, 1 means WeiQi',
    value: 1, // GO
    parse: (v) => {
      if (v.trim() === '1') {
        return 'weiqi';
      }
      throw new SyntaxError();
    },
    stringify: (v) => {
      if (v === 'weiqi') {
        return '1';
      }
      return '1';
    },
  },
  CA: {
    path: 'additionalInfo.charset',
    comment: 'the CharSet of this game file',
    parse: identity,
    stringify: identity,
  },
  FF: {
    path: 'additionalInfo.fileFormat',
    comment: 'the file format version, with is 4',
    value: 4,
    parse: identity,
    stringify: identity,
  },
  AP: {
    path: 'additionalInfo.application',
    comment: 'the application which generated this game file',
    defaultValue: 'uztez/sgf4',
    parse: identity,
    stringify: identity,
  },
  SZ: {
    path: 'size',
    comment: 'the size of the game board',
    defaultValue: '19',
    parse: identity,
    stringify: identity,
  },
  PB: {
    path: 'matchInfo.blackPlayer.name',
    comment: 'name of black player',
    defaultValue: 'B',
    parse: identity,
    stringify: identity,
  },
  PW: {
    path: 'matchInfo.whitePlayer.name',
    comment: 'name of white player',
    defaultValue: 'W',
    parse: identity,
    stringify: identity,
  },
  BR: {
    path: 'matchInfo.blackPlayer.rank',
    comment: 'rank of black player',
    defaultValue: '',
    parse: identity,
    stringify: identity,
  },
  WR: {
    path: 'matchInfo.whitePlayer.rank',
    comment: 'rank of white player',
    defaultValue: '',
    parse: identity,
    stringify: identity,
  },
  // 贴目
  KM: {
    path: 'rule.komidash',
    comment: `Komidash of the game, e.g. Chinese rule it's 7.5`,
    parse: identity,
    stringify: identity,
  },
  // 让子
  HA: {
    path: 'rule.handicap',
    comment: `Handicap of the game, e.g. 2 black stones placed before the game start`,
    parse: identity,
    stringify: identity,
  },
  // 日期
  DT: {
    path: 'matchInfo.date',
    comment: 'The date of the game',
    parse: identity,
    stringify: identity,
  },
  // 时间
  TM: {
    path: 'rule.timeLimit',
    comment: 'The time limit of the game',
    parse: identity,
    stringify: identity,
  },
  // 结局
  RE: {
    path: 'matchInfo.result',
    comment: 'The result of the game',
    parse: identity,
    stringify: identity,
  },
  // 活动名称
  EV: {
    path: 'matchInfo.eventName',
    comment: 'The event name',
    parse: identity,
    stringify: identity,
  },
  // 轮数
  RO: {
    path: 'matchInfo.round',
    comment: 'which round is this game',
    parse: identity,
    stringify: identity,
  },
  // 地点 
  PC: {
    path: 'matchInfo.place',
    comment: 'the place (server if online) of the game',
    parse: identity,
    stringify: identity,
  },
  // 规则名称: Chinese/Japanese/Korean等
  RU: {
    path: 'rule.name',
    comment: 'The rule name, Chinese/中国/Korean/韩国/Japanese/日本/etc.',
    parse: identity,
    stringify: identity,
  },
  // 比赛名
  GN: {
    path: 'matchInfo.name',
    comment: 'Name of this game',
    parse: identity,
    stringify: identity,
  },
  // 开场描述
  ON: {
    path: 'match.opening',
    comment: 'Part of overall comment, describing the way of opening, e.g. 星小目布局',
    parse: identity,
    stringify: identity,
  },
  // 来源
  SO: {
    path: 'additionalInfo.source',
    comment: 'Where this game file comes from',
    parse: identity,
    stringify: identity,
  },
  // 记录人
  US: {
    path: 'additionalInfo.recorder',
    comment: 'The name of the recorder',
    parse: identity,
    stringify: identity,
  },
  // 注释人
  AN: {
    path: 'additionalInfo.annotator',
    comment: 'The name of who annotate this game',
    parse: identity,
    stringify: identity,
  },
  // 版权信息
  CP: {
    path: 'additionalInfo.copyRight',
    comment: 'The copy right info of this game',
    parse: identity,
    stringify: identity,
  },
  // 备注信息
  GC: {
    path: 'additionalInfo.remark',
    comment: 'Additional remark of this game',
    parse: identity,
    stringify: identity,
  },
}

export class GameInfo {
  size = [19, 19];
  rule = {
    name: 'Chinese',
    komidash: 0,
    handicap: 0,
    timeLimit: null,
  };
  matchInfo = {
    date: null,
    blackPlayer: {
      name: '黑方玩家',
      rank: '1级'
    },
    whitePlayer: {
      name: '白方玩家',
      rank: '1级'
    },
    result: '0',
    name: '',
  };
  additionalInfo = {
    gameMode: 1, // 1: GO
  };
}

export class GameModel {
  gameInfo;
  gamePreset;
  gameBranches;
}

export class SgfStep {
  position = [-1, -1];
  comment;
  branches;
}

export class SgfModel {

  replays;

  constructor(text) {
    const ast = parse(text);
    this.games = ast.map(this._loadGameAst);
  }

  toString = () => {
    const ast = this.replays.map(replay => {
      let segment = { type: TYPES.segment, children: [] };
      const group = { type: TYPES.group, children: [segment], };
      Object.entries(([token, { path, stringify }]) => {
        const pathed = pathy(replay[0]);
        const value = stringify ? stringify(pathed) : pathed;

      });
    });
    return stringify(ast);
  }

  _flattenAst = ast => {
    if (!ast.children) {
      return [];
    }
    return ast.children.reduce((items, item) => [...items, item.type === TYPES.property || item.type === TYPES.group ? item : this._flattenProperties(item)], [])
  };

  _buildReplay = (ast, isRoot = true) => {
    return this._flattenAst(ast).reduce((replay, entry) => {
      const previousStep = replay[replay.length - 1];
      if (entry.type === TYPES.group) {
        if (!previousStep.branches) {
          previousStep.branches = [];
        }
        previousStep.branches.push(this._buildReplay(entry, false));
      } else {
        let token, values = [];
        entry.children.forEach(subentry => {
          switch (subentry.type) {
            case TYPES.token:
              token = subentry.value;
            case TYPES.value:
              values.push(subentry.value);
            default:
            // ignore
          }
        });
        this._applyProperty(replay, { isRoot, token, values });
      }
      return replay;
    }, [{ index: 0, }]);
  };

  _applyProperty = (replay, { isRoot, token, values }) => {
    const previousStep = replay[replay.length - 1];
    switch (token) {
      case 'AB':
      case 'AW':
        if (previousStep !== replay[0]) {
          throw new SyntaxError(`Property '${token}' should placed before all W/B`);
        }
        values.forEach(value => {
          pointsFromSgf(value).forEach(point => {
            if (!previousStep.initialState) {
              previousStep.initialState = [];
            }
            previousStep.initialState.push({
              player: token === 'AB' ? 'B' : 'W',
              point,
            });
          })
        });
        break;
      case 'B':
      case 'W':
        const step = { index: replay.length, };
        values.forEach(value => {
          pointsFromSgf(value).forEach(point => {
            if (!step.state) {
              step.state = [];
            }
            step.state.push({
              player: token,
              point,
            });
          });
        });
        break;
      case 'C':
        values.forEach(value => {
          previousStep.comment = (previousStep.comment ? previousStep.comment + COMMENTSEP : '') + value.trim();
        });
        break;
      default:
        // other properties
        if (!isRoot) {
          throw new SyntaxError(`Property '${token}' shouldn't placed on branch`);
        }
        if (previousStep !== replay[0] || previousStep.initialState) {
          throw new SyntaxError(`Property '${token}' should placed before all AW/AB/W/B`);
        }
        const meta = GoMeta[token];
        if (!meta) {
          // unknown meta
          meta = {
            path: `unknown.${token}`,
            parse: identity,
            stringify: identity,
          };
        }
        // update step 0
        pathy(previousStep, meta.path, meta.parse(values[0]));
    }
  }

}