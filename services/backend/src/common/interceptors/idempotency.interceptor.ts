import { IIdempotencyRecord } from '@deliverapp/types';

export class IdempotencyStore {
  private static store = new Map<string, IIdempotencyRecord>();

  static get(key: string): IIdempotencyRecord | undefined {
    return this.store.get(key);
  }

  static set(key: string, record: IIdempotencyRecord): void {
    this.store.set(key, record);
  }

  static has(key: string): boolean {
    return this.store.has(key);
  }
}
