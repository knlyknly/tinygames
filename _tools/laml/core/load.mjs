import { access } from "../index.mjs";
import namespace from "./namespace.mjs";
import { generate } from "../ui/generate.mjs";

export default async (ns) => {
  const def = namespace.resolve(ns);
  return {
    get generate() {
      return (arg) => {

        return generate(access(def, arg))
      };
    }
  }
}