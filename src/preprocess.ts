import { parse, ParseResult } from '@babel/parser';
import traverseBabel from '@babel/traverse';
import generatorBabel from '@babel/generator';
import t from '@babel/types';
import { getFileContent, getFilesInDir } from './utils/fs.js';
import {
  ConditionalExpressionAction,
  ParsedFileResult,
  RunProps,
} from './types.js';
import { uuid } from './utils/uuid.js';

const traverse = traverseBabel.default;
const generator = generatorBabel.default;

export const preprocessReactFiles = ({ reactFilesPath }: RunProps) => {
  const files = getFilesInDir(reactFilesPath);
  const allParsedAsts: ParsedFileResult[] = [];
  const operations: ConditionalExpressionAction[] = [];

  files.forEach((fileName) => {
    const fullPath = `${reactFilesPath}/${fileName}`;
    console.log('processing file => ', fullPath);

    const file = getFileContent(fullPath);
    const ast = parse(file, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const result = addAttributesToConditions(ast, operations, fileName);

    allParsedAsts.push({
      filePath: fullPath,
      fileName: fileName,
      fileContent: result,
    });
  });

  return { allParsedAsts, operations };
};

const getAttributeUuid = (uuid: string) => {
  return t.jsxAttribute(
    t.jsxIdentifier('data-condition-uuid'),
    t.stringLiteral(uuid),
  );
};

const getAttributeExpressionPart = (nodeType: 'consequent' | 'alternate') => {
  return t.jsxAttribute(
    t.jsxIdentifier('data-condition-part'),
    t.stringLiteral(nodeType),
  );
};

function addAttributesToConditions(
  ast: ParseResult<t.File>,
  operations: ConditionalExpressionAction[],
  fileName: string,
) {
  traverse(ast, {
    ConditionalExpression(path) {
      const conditionId = uuid();
      const { consequent, alternate, test } = path.node;

      // only deal with JSX elements, no fancy stuff for now
      // take the parts of conditional expression and wrap them in Fragment <> </> to preserve the structure
      if (t.isJSXElement(consequent) && t.isJSXElement(alternate)) {
        consequent.openingElement.attributes.push(
          getAttributeUuid(conditionId),
          getAttributeExpressionPart('consequent'),
        );
        alternate.openingElement.attributes.push(
          getAttributeUuid(conditionId),
          getAttributeExpressionPart('alternate'),
        );

        path.replaceWith(
          t.jSXFragment(t.jSXOpeningFragment(), t.jSXClosingFragment(), [
            consequent,
            alternate,
          ]),
        );
      }

      let conditionIdentifierLiteralValue: string | undefined;

      if (test?.type === 'Identifier') {
        const binding = path.scope.getBinding(test.name);
        if (binding?.path.node.type === 'VariableDeclarator') {
          const variable = binding.path.node.init;
          if (t.isStringLiteral(variable)) {
            conditionIdentifierLiteralValue = variable.value;
          }
        }
      }

      if (!conditionIdentifierLiteralValue) {
        throw new Error('condition identifier literal value was not detected');
      }

      operations.push({
        fileName,
        type: 'conditionalExpression',
        id: conditionId,
        literal: conditionIdentifierLiteralValue,
      });
    },
  });

  return generator(ast).code;
}
