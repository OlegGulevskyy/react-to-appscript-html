import { z } from 'zod';

export const runPropsSchema = z.object({
  reactFilesPath: z.string(),
  cwd: z.string(),
  outputPath: z.string(),
});
