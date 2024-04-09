export const createMockStorage = () => {
  let storage: { [key: string]: string } = {};

  return {
    set: jest.fn((items, callback = () => {}) => {
      return new Promise<void>((resolve) => {
        Object.keys(items).forEach((key) => {
          storage[key] = items[key];
        });
        console.debug("set items", items);
        callback();
        resolve();
      });
    }),
    get: jest.fn(async (keys, callback = () => {}) => {
      return new Promise<{ [key: string]: string }>((resolve) => {
        const items: { [key: string]: string } = {};
        if (typeof keys === "string") {
          items[keys] = storage[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach((key) => {
            items[key] = storage[key];
          });
        } else if (keys === null) {
          Object.assign(items, storage);
        } else {
          Object.keys(keys).forEach((key) => {
            items[key] = storage[key];
          });
        }
        console.debug("get keys", keys, items);
        callback(items);
        resolve(items);
      });
    }),
    clear: jest.fn(() => {
      storage = {};
    }),
  };
};
