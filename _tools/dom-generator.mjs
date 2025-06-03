import dispatcherize from './laml/tool/dispatcherize.mjs';
import resourcize from './laml/tool/resourcize.mjs';

const _hash = new Date().getTime().toString(16);
const parser = new DOMParser();

const toHashedUrl = (url) => {
  // create URL object
  const urlObj = new URL(url);
  // check if url has params
  const params = urlObj.searchParams;
  if (!params.has('_dom_generator_hash')) {
    params.append('_dom_generator_hash', _hash);
  }
  return urlObj.toString();
};

// This function fetches the HTML content from the given URL and returns it as a string.
const fetchHtml = async (url) => {
  const response = await fetch(toHashedUrl(url));
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const text = await response.text();
  return text;
};

// This regexp tests string in the format of 'slot:key'.
const slotRegExp = /^slot:([\w-_]+)$/;

// insert child element after specified node
const insertAfter = (parent, node, child) => {
  const next = node.nextSibling;
  if (next) {
    parent.insertBefore(child, next);
  } else {
    parent.appendChild(child);
  }
};

// This function finds all comment nodes in the given node and returns them as an array.
const findComments = (node) => {
  const comments = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT, null, false);
  let comment;
  while ((comment = walker.nextNode())) {
    comments.push(comment);
  }
  return comments;
};

export default class DomGenerator {
  static define = (html, meta) => {
    return new DomGenerator(html, meta);
  };

  static defineBy = async (url, meta) => {
    const html = await fetchHtml(url);
    return DomGenerator.define(html, meta);
  };

  static init = (dom, meta) => {
    if (dom.__μετα__) {
      return;
    }
    // initialize the dom meta
    dom.__μετα__ = {
      slots: {},
    };
    // initialize the slots and bindings
    DomGenerator.initSlots(dom, meta.slots);
    DomGenerator.initBindings(dom, meta.bindings);
    return;
  };

  static initSlots = (dom, slots) => {
    // find slots all over the DOM element
    const comments = findComments(dom);
    let slotOrder = 0;
    // iterate comments
    comments.forEach((comment) => {
      const text = comment.textContent.trim();
      // check if text matches the slot regexp
      if (!slotRegExp.test(text)) {
        return;
      }
      // increase slot order
      slotOrder++;
      // get slot type and key from the text
      const [_, key] = text.split(':');
      const slotDef = slots[key];
      // check if slot is defined
      if (!slotDef) {
        return;
      }
      // create dom from registry
      const generator = slotDef.generator;
      // check if generator is defined
      if (!generator) {
        return;
      }
      // create a slot element
      const slotElement = generator.generate();
      // set the slot id, order and key
      slotElement.setAttribute('slot-key', key);
      slotElement.setAttribute('slot-order', slotOrder);
      insertAfter(comment.parentElement, comment, slotElement);
      // store to meta
      const slotMeta = (dom.__μετα__.slots[key] = {
        key,
        generator,
        order: slotOrder,
        element: slotElement,
      });
      // call the handler
      const resource = slotDef.init({ self: dom, ...slotMeta });
      // reserve resource in dom
      dom.reserve(`slot:${key}`, resource);
    });
  };

  static initBindings = (dom, bindings) => {
    Object.entries(bindings || {}).forEach(([key, handler]) => {
      const resource = dom.addListener(key, (...args) => handler(dom, ...args));
      dom.reserve(`binding:${key}`, resource);
    });
  };

  html;
  meta;

  constructor(html, meta) {
    this.html = html;
    this.meta = meta;
  }

  generate = () => {
    const { html, meta } = this;
    // create a new DOM element from the HTML string
    const dom = parser.parseFromString(html, 'text/html').body.firstChild;
    // dispatcherize it
    dispatcherize(dom);
    // make it a resource
    resourcize(dom);
    // check if meta is defined
    if (meta) {
      DomGenerator.init(dom, meta);
    }
    // initialize the dom element
    return dom;
  };
}
