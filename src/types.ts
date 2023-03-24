import { z } from 'zod';
import { runPropsSchema } from './validation.js';

export type RunProps = z.infer<typeof runPropsSchema>;

export type ConditionalExpressionAction = {
	fileName: string;
  literal: string;
  id: string;
  type: 'conditionalExpression';
};

export type ParsedFileResult = {
  filePath: string;
  fileName: string;
  fileContent: string;
};
