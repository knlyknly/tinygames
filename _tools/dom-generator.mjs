
const fetchHtml = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const text = await response.text();
}

const parser = new DOMParser();

export default class DomGenerator {
  static defineFactoryBy = async (url) => {
    const html = await fetchHtml(url);
    let dom = null;
    return () => parser.parseFromString(html, "text/html");
  }
}