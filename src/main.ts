import { postprocess } from './postprocess.js';
import { cleanUp, saveFilesToTemporaryDir } from './utils/fs.js';
import { runCmd } from './utils/cmd.js';
import { RunProps } from './types.js';
import { runPropsSchema } from './validation.js';
import { preprocessReactFiles } from './preprocess.js';

export const run = ({ reactFilesPath, cwd, outputPath }: RunProps) => {
  runPropsSchema.parse({ reactFilesPath, cwd, outputPath });
  const { allParsedAsts, operations } = preprocessReactFiles({
    reactFilesPath,
  });
  const temporaryDir = `${cwd}/tmp`;
  saveFilesToTemporaryDir(allParsedAsts, temporaryDir);

  // run the `react-email` in the temporary directory
  runCmd({
    cmd: `npx email export --dir ${temporaryDir} --outDir ${outputPath} --pretty`,
    cwd,
  });

  cleanUp(temporaryDir);
  // postprocess the output
  postprocess({ dir: outputPath, operations });
};
