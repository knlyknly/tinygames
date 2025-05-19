import load from '../../_tools/laml/core/load.mjs';
import defView from '../../_tools/laml/core/def-view.mjs';
import yaml from 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.mjs';

export default async () => {
  const yamlText = await load(import.meta.resolve('./view-replay.yaml'));
  const def = yaml.parse(yamlText);
  return defView(def);
}