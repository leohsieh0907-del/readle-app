/**
 * LocalStorage 通用 Repository
 * 所有 readle.* key 寫入皆透過此抽象，方便將來換成 Prisma / API。
 */

const isBrowser = typeof window !== 'undefined';

export class Repo<T extends { _version: number }> {
  constructor(
    private key: string,
    private defaultValue: T,
  ) {}

  get(): T {
    if (!isBrowser) return this.defaultValue;
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return this.defaultValue;
    try {
      const parsed = JSON.parse(raw) as T;
      return this.migrate(parsed);
    } catch {
      return this.defaultValue;
    }
  }

  set(value: T): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(value));
    } catch (err) {
      // 配額爆掉時靜默失敗（之後可改成 Toast）
      console.warn('[Repo] write failed:', this.key, err);
    }
  }

  update(patcher: (current: T) => T): T {
    const next = patcher(this.get());
    this.set(next);
    return next;
  }

  clear(): void {
    if (!isBrowser) return;
    window.localStorage.removeItem(this.key);
  }

  /** 將來 schema 升版時在這裡實作 */
  private migrate(data: T): T {
    return data;
  }
}

/** 從所有 readle.* key 匯出 JSON */
export function exportAll(): string {
  if (!isBrowser) return '{}';
  const data: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k?.startsWith('readle.')) {
      try {
        data[k] = JSON.parse(window.localStorage.getItem(k) ?? 'null');
      } catch {
        /* skip */
      }
    }
  }
  return JSON.stringify(
    {
      readleExport: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );
}

/** 清空所有 readle.* key */
export function clearAll(): void {
  if (!isBrowser) return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k?.startsWith('readle.')) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
}
