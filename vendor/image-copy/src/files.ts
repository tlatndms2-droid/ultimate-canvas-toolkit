import { constants } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

export const isImage = (name: string): boolean => /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(name);
export function uniqueImages(names: string[]): string[] {
  return [...new Set(names.filter(isImage))];
}
export async function copyWithoutOverwrite(source: string, folder: string): Promise<string> {
  const {name, ext} = path.parse(source);
  for(let n=0; n<100000; n++) {
    const target=path.join(folder, `${name}${n ? ` (${n})` : ''}${ext}`);
    try { await copyFile(source,target,constants.COPYFILE_EXCL); return target; }
    catch(error) { if((error as NodeJS.ErrnoException).code==='EEXIST') continue; throw error; }
  }
  throw new Error('사용 가능한 파일 이름을 찾지 못했습니다.');
}
