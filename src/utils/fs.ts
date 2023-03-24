import * as fs from 'fs';
import { ParsedFileResult } from '../types.js';

export function getFilesInDir(path: string) {
  return fs
    .readdirSync(path, { withFileTypes: true })
    .filter((item) => !item.isDirectory())
    .map((item) => item.name);
}

export function cleanUp(tempDir: string) {
  console.log('Cleaning up', tempDir);
  fs.rmdirSync(tempDir, { recursive: true });
}

export function saveFilesToTemporaryDir(
  files: ParsedFileResult[],
  tempDir: string,
) {
  if (!fs.existsSync(tempDir)) {
    console.log('creating dir temp', tempDir);
    fs.mkdirSync(tempDir);
  }

  files.forEach((file) => {
    fs.writeFileSync(`${tempDir}/${file.fileName}`, file.fileContent);
  });
}

export function getFileContent(path: string) {
  return fs.readFileSync(path, 'utf8');
}

export function getFileMeta(path: string) {
  const extension = path.substring(path.lastIndexOf('.') + 1);
  const fileName = path.substring(0, path.lastIndexOf('.'));
  return {
    fileName,
    extension,
  };
}
