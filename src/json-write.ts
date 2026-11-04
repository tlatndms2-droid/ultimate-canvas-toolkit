import {promises as fs} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

/** Compare after earlier writes finish; never trust a cached copy over disk. */
export function queueJsonWrite(
  queues: Map<string, Promise<void>>, key: string, target: string, raw: string,
  skipIdentical = false, io: Pick<typeof fs, 'readFile'|'writeFile'|'mkdir'|'rename'|'rm'> = fs,
): Promise<void> {
  const previous = queues.get(key) ?? Promise.resolve();
  const write = previous.catch(() => {}).then(async () => {
    if (skipIdentical) {
      try { if (await io.readFile(target, 'utf8') === raw) return; }
      catch (error: any) { if (error.code !== 'ENOENT') throw error; }
    }
    const temp = target + '.' + randomUUID() + '.tmp';
    let committed = false;
    try {
      // Normal saves already have a parent directory. Avoid another mounted
      // filesystem round trip; create/recreate it only if the write needs it.
      try { await io.writeFile(temp, raw, 'utf8'); }
      catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
        await io.mkdir(dirname(target), {recursive: true});
        await io.writeFile(temp, raw, 'utf8');
      }
      if (await io.readFile(temp, 'utf8') !== raw) throw Error('저장 검증 실패');
      await io.rename(temp, target);
      committed = true;
    } finally {
      // Successful rename consumes the temporary path. Only failures need cleanup.
      if (!committed) await io.rm(temp, {force: true}).catch(() => {});
    }
  });
  queues.set(key, write);
  return write;
}
