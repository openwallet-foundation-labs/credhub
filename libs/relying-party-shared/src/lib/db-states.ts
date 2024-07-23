import {
  IStateManager,
  STATE_MISSING_ERROR,
  StateType,
} from '@sphereon/oid4vci-common';
import { LessThan, Repository } from 'typeorm';

class BaseRepo implements StateType {
  id?: string;
  createdAt!: number;
}

export class DBStates<T extends StateType> implements IStateManager<T> {
  private readonly expiresInMS: number;
  private cleanupIntervalId?: number | NodeJS.Timeout;

  constructor(
    private repository: Repository<BaseRepo>,
    opts?: { expiresInSec?: number }
  ) {
    this.expiresInMS =
      opts?.expiresInSec !== undefined ? opts?.expiresInSec * 1000 : 180000;
  }
  async clearAll(): Promise<void> {
    await this.repository.delete({});
  }

  async all(): Promise<T[]> {
    return this.repository.find({ order: { createdAt: -1 } }) as unknown as T[];
  }

  async clearExpired(timestamp?: number): Promise<void> {
    const ts = timestamp ?? +new Date();
    await this.repository.delete({ createdAt: LessThan(ts) });
  }

  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw Error('No id supplied');
    }
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }

  async getAsserted(id: string): Promise<T> {
    if (!id) {
      throw Error('No id supplied');
    }
    let result: T | undefined;
    if (await this.has(id)) {
      result = (await this.get(id)) as T;
    }
    if (!result) {
      throw new Error(STATE_MISSING_ERROR + ` (${id})`);
    }
    return result;
  }

  async get(id: string): Promise<T | undefined> {
    if (!id) {
      throw Error('No id supplied');
    }
    const result = await this.repository.findOne({ where: { id } });
    if (result) {
      delete result.id;
    }
    return result as unknown as T;
  }

  async has(id: string): Promise<boolean> {
    if (!id) {
      throw Error('No id supplied');
    }
    return (await this.repository.count({ where: { id } })) > 0;
  }

  async set(id: string, stateValue: T): Promise<void> {
    if (!id) {
      throw Error('No id supplied');
    }
    await this.repository.save(this.repository.create({ ...stateValue, id }));
  }

  async startCleanupRoutine(timeout?: number): Promise<void> {
    if (!this.cleanupIntervalId) {
      this.cleanupIntervalId = setInterval(
        () => this.clearExpired(),
        timeout ?? 30000
      );
    }
  }

  async stopCleanupRoutine(): Promise<void> {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }
}
