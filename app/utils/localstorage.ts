export const storeObject = (obj: {}, key: string) => {
  localStorage.setItem(key, JSON.stringify(obj));
};

export const getObject = <T>(key: string, def: T) => {
  const storedValue = localStorage.getItem(key);

  return storedValue === null ? def : (JSON.parse(storedValue) as T);
};
