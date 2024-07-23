import { createWriteStream, existsSync, mkdirSync, rmSync } from 'fs';
import { Readable } from 'stream';

export const logFolder = '../../tmp/logs';

/**
 * Writes the logs to a file
 * @param fileName
 * @param stream
 */
export function saveLogs(fileName: string, stream: Readable) {
  if (!existsSync(logFolder)) {
    mkdirSync(logFolder, { recursive: true });
  }
  const filePath = `${logFolder}/${fileName}.log`;
  if (existsSync(fileName)) {
    rmSync(fileName);
  }
  const writeStream = createWriteStream(filePath, {
    flags: 'a',
  });
  stream.pipe(writeStream);
}
