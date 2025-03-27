export const TYPES = 'root,segment,group,property,token,value,whitechar'.split(',').reduce((m, v) => ({ ...m, [v]: v }), {});
export const parse = (text) => {
  const stack = [{ type: TYPES.root, children: [] }];
  const categorize = (c) => {
    const isWhiteChar = (() => {
      const WHITESPACE = /\s/m;
      return c => WHITESPACE.test(c);
    })();
    const type = stack[stack.length - 1].type;
    switch (type) {
      case 'root':
      case 'segment':
        if (isWhiteChar(c)) {
          return ['whitechar.insert'];
        }
        switch (c) {
          case ';':
            if (type === 'root') {
              throw new SyntaxError();
            }
            return ['segment.end', 'segment.start'];
          case '(':
            return ['group.start'];
          case ')':
            if (type === 'root')
              throw new SyntaxError();
            return ['segment.end', 'group.end'];
          case '[':
            throw new SyntaxError();
          case ']':
            throw new SyntaxError();
          default:
            if (type === 'root')
              throw new SyntaxError();
            return ['property.start', 'token.start'];
        }
      case 'group':
        if (isWhiteChar(c)) {
          return ['whitechar.insert'];
        }
        switch (c) {
          case ';':
            return ['segment.start'];
          case '(':
            throw new SyntaxError();
          case ')':
            return ['group.end'];
          case '[':
            throw new SyntaxError();
          case ']':
            throw new SyntaxError();
          default:
            return ['segment.default', 'property.start', 'token.start'];
        }
      case 'property':
        if (isWhiteChar(c)) {
          return ['whitechar.insert'];
        }
        switch (c) {
          case ';':
            return ['property.end', 'segment.end', 'segment.start'];
          case '(':
            return ['property.end', 'group.start'];
          case ')':
            return ['property.end', 'segment.end', 'group.end'];
          case '[':
            return ['value.start'];
          case ']':
            return ['value.end'];
          default:
            // token start always after property start immediately
            return ['property.end', 'property.start', 'token.start'];
        }
      case 'token':
        if (isWhiteChar(c)) {
          return ['token.end', 'whitechar.insert'];
        }
        switch (c) {
          case '(':
            return ['token.end', 'property.end', 'group.start'];
          case ')':
            return ['token.end', 'property.end', 'segment.end', 'group.end'];
          case '[':
            return ['token.end', 'value.start'];
          case ']':
            throw new SyntaxError();
          default:
            return ['token.append'];
        }
      case 'value':
        switch (c) {
          case ']':
            return ['value.end'];
          default:
            return ['value.append'];
        }
    }
  }
  const handlers = {
    SHARED: {
      push: (type, value = undefined) => {
        const parent = stack[stack.length - 1];
        const item = { type, [value === undefined ? 'children' : 'value']: value === undefined ? [] : value };
        parent.children.push(item);
        stack.push(item);
        return item;
      },
      pop: () => stack.pop(),
      append: (v) => stack[stack.length - 1].value += v,
    },
    group: {
      start: () => handlers.SHARED.push(TYPES.group),
      end: () => handlers.SHARED.pop(),
    },
    segment: {
      start: () => handlers.SHARED.push(TYPES.segment),
      default: () => {
        const segment = handlers.SHARED.push(TYPES.segment);
        segment.isDefault = true;
        return segment;
      },
      end: () => handlers.SHARED.pop(),
    },
    property: {
      start: () => handlers.SHARED.push(TYPES.property),
      end: () => handlers.SHARED.pop(),
    },
    token: {
      start: (c) => {
        // TODO verify if the property has no child yet
        handlers.SHARED.push(TYPES.token, c);
      },
      end: () => handlers.SHARED.pop(),
      append: (c) => {
        // TODO verify it is a token
        handlers.SHARED.append(c);
      },
    },
    value: {
      start: () => {
        // TODO verify if the property has token already
        handlers.SHARED.push(TYPES.value, '');
      },
      end: () => handlers.SHARED.pop(),
      append: (c) => {
        // TODO verify it is a value
        handlers.SHARED.append(c);
      },
    },
    whitechar: {
      insert: (c) => {
        const parent = stack[stack.length - 1];
        const item = { type: TYPES.whitechar, value: c };
        parent.children.push(item);
        return item;
      },
    }
  };
  const handleActions = (char, actions) => {
    actions.forEach(action => {
      const handler = action.split('.').reduce((v, key) => (v ? v[key] : v), handlers);
      handler(char);
    });
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const actions = categorize(char);
    handleActions(char, actions);
  }
  return stack[0].children;
}

export const stringify = (ast) => {
  // if the input is a forest instead of tree
  if (Array.isArray(ast)) {
    return stringify({ type: TYPES.root, children: ast });
  }
  // verify the type
  switch (ast.type) {
    case 'root':
    case 'segment':
      return [(ast.type === TYPES.root || ast.isDefault) ? '' : ';', ...ast.children.map(stringify)].join('');
    case 'group':
      return ['(', ...ast.children.map(stringify), ')'].join('');
    case 'property':
      return ast.children.map(stringify).join('');
    case 'value':
      return `[${ast.value}]`;
    case 'token':
    case 'whitechar':
      return ast.value;
  }
}


export default { parse, stringify };





