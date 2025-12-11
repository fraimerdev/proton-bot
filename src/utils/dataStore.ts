export default class DataStore {
  public tags: Map<string, unknown>;

  constructor(values: unknown[] = []) {
    this.tags = new Map<string, unknown>();

    // Initialize with provided values as numbered tags
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        this.tags.set(index.toString(), value);
      });
    }
  }

  get(key: string): unknown {
    return this.tags.get(key);
  }

  set(key: string, value: unknown): void {
    this.tags.set(key, value);
  }

  has(key: string): boolean {
    return this.tags.has(key);
  }

  delete(key: string): boolean {
    return this.tags.delete(key);
  }

  clear(): void {
    this.tags.clear();
  }

  keys(): IterableIterator<string> {
    return this.tags.keys();
  }

  values(): IterableIterator<unknown> {
    return this.tags.values();
  }

  entries(): IterableIterator<[string, unknown]> {
    return this.tags.entries();
  }
}
