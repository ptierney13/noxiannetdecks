export interface HostedObjectStore {
  putText(key: string, value: string): Promise<void>;
  getText(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export async function putJson(store: HostedObjectStore, key: string, value: unknown): Promise<void> {
  await store.putText(key, JSON.stringify(value, null, 2));
}

export async function getJson<T>(store: HostedObjectStore, key: string): Promise<T | undefined> {
  const text = await store.getText(key);
  if (text === undefined) {
    return undefined;
  }

  return JSON.parse(text) as T;
}
