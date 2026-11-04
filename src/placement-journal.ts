export interface PlacementRecord {
  id: string;
  path: string;
  space: string | null;
  nodeIds: string[];
  itemSnapshots: Record<string, any>;
  copy: boolean;
  metadataWrites?: any[];
}
export interface PlacementJournalData { version: 1; records: PlacementRecord[] }
type PlacementDestination = Pick<PlacementRecord,'path'|'space'|'nodeIds'>;
export interface PlacementJournalIO {
  /** null means the journal does not exist yet. JSON text is also accepted. */
  readJournal(): Promise<unknown>;
  writeJournal(data: PlacementJournalData): Promise<void>;
  readCanvas(path: string): Promise<unknown>;
  saveLibrary(): Promise<void>;
  waitForCanvas?(ms: number): Promise<void>;
  canvasIsSaving?(path: string): boolean;
  /** Destination is already durable; reflect an in-memory move, or its rollback. */
  libraryChanged?(restored: boolean): void;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const object = (value: any): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const parse = (value: unknown): any => typeof value === 'string' ? JSON.parse(value) : value;
// Compare persisted JSON semantics, including snapshots read back after a restart.
function canonical(value: any): string {
  const normalized = clone(value);
  const sort = (v: any): any => Array.isArray(v) ? v.map(sort) : object(v)
    ? Object.fromEntries(Object.keys(v).sort().map(key => [key, sort(v[key])])) : v;
  return JSON.stringify(sort(normalized));
}
function checkedRecord(value: any): PlacementRecord {
  if (!object(value) || !text(value.id) || !text(value.path)
    || !(value.space === null || text(value.space)) || typeof value.copy !== 'boolean'
    || !Array.isArray(value.nodeIds) || !value.nodeIds.length || !value.nodeIds.every(text)
    || new Set(value.nodeIds).size !== value.nodeIds.length
    || !object(value.itemSnapshots) || !Object.keys(value.itemSnapshots).length
    || Object.entries(value.itemSnapshots).some(([id, item]) => !text(id) || !object(item) || item.id !== id)
    || (value.metadataWrites !== undefined && !Array.isArray(value.metadataWrites))) {
    throw Error('배치 복구 기록 형식이 올바르지 않습니다. 기존 자료와 기록을 보존합니다.');
  }
  return clone(value) as PlacementRecord;
}

/** Write-ahead records survive Canvas success followed by Mini save failure. */
export class PlacementJournal {
  private data: PlacementJournalData = {version: 1, records: []};
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();
  private settling = new Map<string, Promise<void>>();
  private io: PlacementJournalIO;
  private library: {items: Record<string, any>};
  constructor(io: PlacementJournalIO, library: {items: Record<string, any>}) { this.io = io; this.library = library; }

  private serial<T>(action: () => Promise<T>): Promise<T> {
    const next = this.queue.catch(() => {}).then(action);
    this.queue = next;
    return next;
  }
  private ready() { if (!this.loaded) throw Error('배치 복구 기록을 먼저 읽어야 합니다.'); }
  private notify(restored: boolean) { try { this.io.libraryChanged?.(restored); } catch (error) { console.error('UCT Mini placement state',error); } }
  private find(id: string) { this.ready(); const record = this.data.records.find(r => r.id === id); if (!record) throw Error('배치 복구 기록을 찾을 수 없습니다.'); return record; }
  listRecords(): PlacementRecord[] { this.ready(); return clone(this.data.records); }
  pendingItemIds(): Set<string> { this.ready(); return new Set(this.data.records.flatMap(r => Object.keys(r.itemSnapshots))); }

  load(): Promise<void> { return this.serial(async () => {
    if(this.settling.size)throw Error('배치 저장 중에는 복구 기록을 다시 읽을 수 없습니다.');
    // A failed reload must not permit new writes over unreadable recovery data.
    this.loaded = false;
    let input: unknown;
    try { input = await this.io.readJournal(); }
    catch (error: any) { if (error.code !== 'ENOENT') throw error; input = null; }
    if (input === null || input === undefined) { this.data = {version: 1, records: []}; this.loaded = true; return; }
    const parsed = parse(input);
    if (!object(parsed) || parsed.version !== 1 || !Array.isArray(parsed.records)) throw Error('지원하지 않거나 손상된 배치 복구 기록입니다.');
    const records = parsed.records.map(checkedRecord);
    if (new Set(records.map(r => r.id)).size !== records.length) throw Error('배치 복구 기록 ID가 중복되었습니다.');
    const itemIds = records.flatMap(r => Object.keys(r.itemSnapshots));
    if (new Set(itemIds).size !== itemIds.length) throw Error('동일 자료의 배치 복구 기록이 중복되었습니다.');
    this.data = {version: 1, records}; this.loaded = true;
  }); }

  prepare(input: PlacementRecord): Promise<void> {
    // Freeze caller-owned snapshots before entering the asynchronous queue.
    const record = checkedRecord(input);
    return this.serial(async () => {
      this.ready();
      if (this.data.records.some(r => r.id === record.id)) throw Error('이미 준비된 배치입니다.');
      const pending = this.pendingItemIds();
      if (Object.keys(record.itemSnapshots).some(id => pending.has(id))) throw Error('이 자료의 이전 배치 저장을 먼저 마쳐야 합니다.');
      for (const [id, snapshot] of Object.entries(record.itemSnapshots)) {
        if (!Object.prototype.hasOwnProperty.call(this.library.items, id) || canonical(this.library.items[id]) !== canonical(snapshot)) throw Error('보관 자료가 변경되었습니다. 다시 배치하세요.');
      }
      const next: PlacementJournalData = {version: 1, records: [...this.data.records, record]};
      await this.io.writeJournal(clone(next)); this.data = next;
    });
  }

  private async remove(id: string): Promise<void> {
    const next: PlacementJournalData = {version: 1, records: this.data.records.filter(r => r.id !== id)};
    await this.io.writeJournal(clone(next)); this.data = next;
  }
  /** Only for a known pre-commit cancellation; never infer this from a runtime save failure. */
  discard(id: string): Promise<void> { return this.serial(async () => { if(this.settling.has(id))throw Error('배치 저장이 진행 중입니다.');this.find(id); await this.remove(id); }); }

  private async present(record: PlacementDestination): Promise<number> {
    // Missing files and malformed JSON deliberately propagate without discarding anything.
    const root = parse(await this.io.readCanvas(record.path));
    if (!object(root) || !Array.isArray(root.nodes)) throw Error('배치 대상 Canvas를 확인할 수 없습니다.');
    let nodes = root.nodes;
    if (record.space !== null) {
      if (root.canvasPortal !== undefined && (!object(root.canvasPortal) || !object(root.canvasPortal.portals))) throw Error('Canvas 포탈 기록이 손상되었습니다.');
      const portal = root.canvasPortal?.portals[record.space];
      if (portal === undefined) nodes = [];
      else {
        if (!object(portal) || !object(portal.graph) || !Array.isArray(portal.graph.nodes)) throw Error('배치 대상 포탈을 확인할 수 없습니다.');
        nodes = portal.graph.nodes;
      }
    }
    if (nodes.some((node: any) => !object(node) || !text(node.id))) throw Error('Canvas 카드 기록이 손상되었습니다.');
    const ids = new Set(nodes.map((node: any) => node.id));
    return record.nodeIds.filter(id => ids.has(id)).length;
  }

  private applySettlement(record: PlacementRecord, count: number, onApplied?:()=>void): Map<string,any> {
    if (count !== record.nodeIds.length) throw Error('배치 결과의 전체 저장을 확인하지 못했습니다. 자료와 복구 기록을 보존합니다.');
    const removed = new Map<string, any>();
    if (!record.copy) {
      // Validate all items before removing any; absence also supports retry after a durable Mini save.
      for (const [id, snapshot] of Object.entries(record.itemSnapshots)) {
        if (!Object.prototype.hasOwnProperty.call(this.library.items, id)) continue;
        if (canonical(this.library.items[id]) !== canonical(snapshot)) throw Error('배치 후 Mini 자료가 수정되어 자동 제거하지 않습니다.');
      }
      for (const id of Object.keys(record.itemSnapshots)) {
        if (Object.prototype.hasOwnProperty.call(this.library.items, id)) {
          removed.set(id, this.library.items[id]); delete this.library.items[id];
        }
      }
      if (removed.size) this.notify(false);
      // The destination is confirmed and the in-memory move is visible.
      // Persistence remains protected by this journal until saveLibrary succeeds.
      try { onApplied?.(); } catch (error) { console.error('UCT placement release',error); }
    }
    return removed;
  }
  private restoreSettlement(removed: Map<string,any>) {
    for (const [id,item] of removed) if (!Object.prototype.hasOwnProperty.call(this.library.items,id)) this.library.items[id]=item;
    if(removed.size)this.notify(true);
  }
  private async settleRecord(record: PlacementRecord, count?: number): Promise<void> {
    const removed=this.applySettlement(record,count??await this.present(record));
    if(!record.copy)try{await this.io.saveLibrary();}catch(error){this.restoreSettlement(removed);throw error;}
    // If journal cleanup fails, retain the record; retry tolerates already-removed items.
    await this.remove(record.id);
  }
  private async waitForPersistedNodes(record: PlacementDestination): Promise<number> {
    let count = await this.present(record);
    for (let attempt = 0; count !== record.nodeIds.length && attempt < 20; attempt++) {
      await (this.io.waitForCanvas?.(100) ?? new Promise<void>(resolve => setTimeout(resolve, 100)));
      count = await this.present(record);
    }
    return count;
  }
  settle(id: string, onApplied?:()=>void): Promise<void> {
    const existing=this.settling.get(id);if(existing)return existing;
    const operation=this.serial(async()=>{
      const record=this.find(id);
      const removed=this.applySettlement(record,await this.waitForPersistedNodes(record),onApplied);
      // Capture/enqueue the library snapshot before permitting another transaction.
      // Return its promise in an object so the journal queue does not await library I/O.
      const saved=record.copy?Promise.resolve():Promise.resolve().then(()=>this.io.saveLibrary());
      void saved.catch(()=>{});
      return {removed,saved};
    }).then(async({removed,saved})=>{
      try{await saved;}catch(error){await this.serial(async()=>this.restoreSettlement(removed));throw error;}
      // Preserve other preparations written while this library save was pending.
      await this.serial(()=>this.remove(id));
    }).finally(()=>this.settling.delete(id));
    this.settling.set(id,operation);return operation;
  }
  verifyCopy(destination: PlacementDestination): Promise<void> { return this.serial(async () => {
    this.ready();
    if (await this.waitForPersistedNodes(destination) !== destination.nodeIds.length) throw Error('복사한 Canvas의 저장을 확인하지 못했습니다.');
  }); }

  /** Use only after startup, when unsaved Canvas runtime state cannot be mistaken for an absent commit. */
  startupRecover(): Promise<void> { return this.serial(async () => {
    if(this.settling.size)throw Error('배치 저장 중에는 시작 복구를 실행할 수 없습니다.');
    this.ready(); const errors: unknown[] = [];
    for (const record of [...this.data.records]) {
      try {
        const count = await this.waitForPersistedNodes(record);
        if (count === 0 && this.io.canvasIsSaving?.(record.path)) throw Error('Canvas 저장이 계속 진행 중이어서 배치 복구 기록을 보존합니다.');
        if (count === 0) await this.remove(record.id);
        else await this.settleRecord(record, count);
      } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new AggregateError(errors, '일부 배치 복구를 완료하지 못했습니다. 해당 자료와 기록은 보존했습니다.');
  }); }
}
