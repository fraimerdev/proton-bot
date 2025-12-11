import DataStore from "./dataStore";

const MAX_TAGS = 100;
const rangeRegex = /^\d+-\d+$/;

type TagFunction = (data: string, store: DataStore) => string;

const DefaultTags: Record<string, TagFunction> = {
  round: (str) => {
    const num = Number(str);
    if (isNaN(num)) {
      return "";
    }
    return Math.round(num).toString();
  },
  floor: (str) => {
    const num = Number(str);
    if (isNaN(num)) {
      return "";
    }
    return Math.floor(num).toString();
  },
  ceil: (str) => {
    const num = Number(str);
    if (isNaN(num)) {
      return "";
    }
    return Math.ceil(num).toString();
  },
  abs: (str) => {
    const num = Number(str);
    if (isNaN(num)) {
      return "";
    }
    return Math.abs(num).toString();
  },
  random: (str) => {
    const split = str.indexOf(",");
    if (split < 0) {
      return "";
    }
    const min = Number(str.slice(0, split));
    const max = Number(str.slice(split + 1));
    if (isNaN(min) || isNaN(max)) {
      return "";
    }
    const result = Math.floor(Math.random() * (max - min + 1) + min);
    return result.toString();
  },
  object: (content, store) => {
    store.set(content, {});
    return "";
  },
  in: (content, store) => {
    const commaIdx = content.indexOf(",");
    if (commaIdx < 0) {
      return "false";
    }
    const left = content.slice(0, commaIdx).trim();
    let right = content.slice(commaIdx + 1).trim();
    const rightData = store.get(right);
    if (rightData && Array.isArray(rightData)) {
      right = rightData.join(",");
    } else if (typeof rightData === "string") {
      right = rightData;
    }
    return String(right.includes(left));
  },
  vector: (content, store) => {
    let nameIdx = content.indexOf("=");
    if (nameIdx === -1) {
      nameIdx = content.length;
    }
    const name = content.slice(0, nameIdx).trim();
    const values: string[] = [];
    if (nameIdx < content.length) {
      const split = content.slice(nameIdx + 1).split(",");
      if (split && split.length) {
        values.push(...split.map((v) => v.trim()));
      }
    }
    store.set(name, values);
    return "";
  },
  if: (content) => {
    const condOpen = content.indexOf("(");
    const condClose = content.indexOf(")");
    if (condOpen === -1 || condClose === -1) {
      return "";
    }
    const condStatement = content.slice(condOpen + 1, condClose).replace(/[\s]/g, "");
    let operator = "";
    function findOperator(char: string): number {
      const idx = condStatement.indexOf(char);
      if (idx === -1) {
        return -1;
      }
      operator = char;
      return idx;
    }
    const operatorIdx =
      findOperator("==") ||
      findOperator("!=") ||
      findOperator("<=") ||
      findOperator(">=") ||
      findOperator("<") ||
      findOperator(">");

    if (operatorIdx === -1) {
      return "";
    }

    const left = condStatement.slice(0, operatorIdx) || "null";
    const right = condStatement.slice(operatorIdx + operator.length) || "null";
    let cond = false;

    switch (operator) {
      case "==": {
        cond = left === right;
        break;
      }
      case "!=": {
        cond = left !== right;
        break;
      }
      case ">": {
        cond = parseFloat(left) > parseFloat(right);
        break;
      }
      case "<": {
        cond = parseFloat(left) < parseFloat(right);
        break;
      }
      case "<=": {
        cond = parseFloat(left) <= parseFloat(right);
        break;
      }
      case ">=": {
        cond = parseFloat(left) >= parseFloat(right);
        break;
      }
    }

    let elseIdx = content.indexOf("(else)");
    const arrowIdx = content.indexOf("=>");
    if (arrowIdx === -1) {
      return "";
    }

    if (elseIdx < 0) {
      elseIdx = content.length;
    }

    if (cond) {
      const truthyBlock = content.slice(arrowIdx + 2, elseIdx).replace("(else)", "");
      return truthyBlock.trim();
    } else {
      if (elseIdx < content.length) {
        const falsyBlock = content.slice(elseIdx + 6);
        return falsyBlock.trim();
      }
    }
    return "";
  },
  isNaN: (content) => {
    return String(isNaN(parseInt(content)));
  },
  push: (content, store) => {
    const arrowIdx = content.indexOf("->");
    if (arrowIdx < 0) {
      return "";
    }
    const name = content.slice(0, arrowIdx).trim();
    if (!name || !store.has(name)) {
      return "";
    }
    const value = content.slice(arrowIdx + 2).trim();
    if (!value) {
      return "";
    }
    const tag = store.get(name);
    if (!Array.isArray(tag)) {
      return "";
    }
    tag.push(store.has(value) ? store.get(value) : value);
    return "";
  },
  length: (content, store) => {
    const data = store.get(content);
    if (Array.isArray(data)) {
      return data.length.toString();
    }
    if (typeof data === "string") {
      return data.length.toString();
    }
    return "0";
  },
  upper: (str) => {
    return str.toUpperCase();
  },
  lower: (str) => {
    return str.toLowerCase();
  },
  trim: (str) => {
    return str.trim();
  },
  join: (content, store) => {
    const commaIdx = content.indexOf(",");
    if (commaIdx < 0) {
      return "";
    }
    const arrayName = content.slice(0, commaIdx).trim();
    const separator = content.slice(commaIdx + 1).trim();
    const data = store.get(arrayName);
    if (!Array.isArray(data)) {
      return "";
    }
    return data.join(separator);
  },
};

export class Parser {
  private readonly maxTags: number;

  constructor(maxTags: number = MAX_TAGS) {
    this.maxTags = maxTags;
  }

  parse(string: string, tags: Record<string, unknown> | unknown[] = {}): string {
    let usedTags = 0;
    let lastOutput = "";
    let lastString = "";

    const store = new DataStore(Array.isArray(tags) ? tags : []);

    // If tags is an object, add all properties to store
    if (!Array.isArray(tags) && typeof tags === "object") {
      for (const [key, value] of Object.entries(tags)) {
        store.set(key, value);
      }
    }

    while (this.maxTags > usedTags && lastOutput !== string) {
      lastOutput = string;
      const closeIdx = string.indexOf("}");
      const openIdx = string.slice(0, closeIdx).lastIndexOf("{");

      if (closeIdx === -1 || openIdx === -1) {
        lastString = string;
        break;
      }

      const content = string.slice(openIdx + 1, closeIdx);
      let out = this.analyzeContent(content, store);

      if (typeof out === "undefined" || out === null) {
        out = "";
      }

      string = string.replace(`{${content}}`, String(out));
      lastString = String(out);
      usedTags++;
    }

    return string;
  }

  private analyzeContent(content: string, store: DataStore): string {
    content = content.trim();
    const colonIndex = content.indexOf(":");
    const name = content.slice(0, colonIndex > -1 ? colonIndex : content.length);
    const tagData = store.get(name) ?? DefaultTags[name];
    const data = colonIndex > -1 ? content.slice(colonIndex + 1) : "";

    // Check if it's accessing an object property
    if (
      tagData !== null &&
      typeof tagData === "object" &&
      !Array.isArray(tagData) &&
      data in (tagData as Record<string, unknown>)
    ) {
      return String((tagData as Record<string, unknown>)[data]) ?? "null";
    }

    // If it's a function tag, execute it
    if (typeof tagData === "function") {
      return tagData(data, store) ?? "";
    }

    // If no colon, just return the tag value
    if (colonIndex < 0) {
      return String(tagData ?? "");
    }

    // Handle assignment
    const assignIdx = data.indexOf("=");
    if (assignIdx > -1) {
      const assignKey = data.slice(0, assignIdx).trim();
      const assignValue = data.slice(assignIdx + 1).trim();

      if (Array.isArray(tagData)) {
        const index = Number(assignKey);
        if (!isNaN(index) && index >= 0 && index < tagData.length) {
          tagData[index] = assignValue;
        }
        return "";
      } else if (tagData !== null && typeof tagData === "object") {
        (tagData as Record<string, unknown>)[assignKey] = assignValue;
        return "";
      }
    }

    // Handle array access
    if (Array.isArray(tagData)) {
      const newContent = data;

      // Range access: {array:0-5}
      if (rangeRegex.test(newContent)) {
        const split = newContent.split("-");
        const indexA = Number(split[0]);
        const indexB = Number(split[1]);
        if (isNaN(indexA) || isNaN(indexB) || indexA > indexB) {
          return "";
        }
        return tagData.slice(indexA, indexB + 1).join(" ");
      }

      // Slice from index: {array:2+}
      const sliceNext = newContent.endsWith("+");
      const indexStr = sliceNext ? newContent.slice(0, -1) : newContent;
      const index = Number(indexStr);

      if (isNaN(index) || index < 0) {
        return "";
      }

      if (sliceNext) {
        return tagData.slice(index).join(" ");
      } else {
        return String(tagData[index] ?? "");
      }
    }

    // Handle nested object access
    if (tagData !== null && typeof tagData === "object" && !Array.isArray(tagData)) {
      const sliceFirstColon = data;
      const nextColon = sliceFirstColon.indexOf(":");
      const key = sliceFirstColon.slice(0, nextColon > -1 ? nextColon : sliceFirstColon.length);
      const objectData = (tagData as Record<string, unknown>)[key];

      if (typeof objectData === "function") {
        const remainingData = nextColon > -1 ? sliceFirstColon.slice(nextColon + 1) : "";
        return objectData(remainingData, store) ?? "";
      }

      return String(objectData ?? "null");
    }

    // Set new tag value
    store.set(name, data.trim());
    return "";
  }

  /**
   * Add a custom tag function
   */
  static addTag(name: string, fn: TagFunction): void {
    DefaultTags[name] = fn;
  }

  /**
   * Remove a custom tag function
   */
  static removeTag(name: string): boolean {
    if (name in DefaultTags) {
      delete DefaultTags[name];
      return true;
    }
    return false;
  }

  /**
   * Get all available tag names
   */
  static getAvailableTags(): string[] {
    return Object.keys(DefaultTags);
  }
}

// Export a default instance
export default new Parser();
