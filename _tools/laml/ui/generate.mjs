export const generate = ({ $extend, tagName, attributes: { class: cssClass, style: cssStyle, ...attributes }, children }) => {
  if ($extend) {
    
  } else {
    const element = document.createElement(tagName || 'div');
  }
  element.cssClass = cssClass;
  Object.entries(cssStyle).forEach(([name, value]) => element.style.setProperty(name, value));
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  children.forEach(child => element.appendChild(generate(child)));
  return element;
};