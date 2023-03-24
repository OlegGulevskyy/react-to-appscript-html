import { load } from 'cheerio';
import { ConditionalExpressionAction } from './types.js';
import { getFileContent, getFileMeta, getFilesInDir } from './utils/fs.js';
import * as fs from 'fs';

const OPEN_SCRIPLET_PLACEHOLDER = '##?';
const CLOSE_SCRIPLET_PLACEHOLDER = '?##';

const sanitizeContentString = (content: string) => {
  return content
    .replaceAll(OPEN_SCRIPLET_PLACEHOLDER, '<?')
    .replaceAll(CLOSE_SCRIPLET_PLACEHOLDER, '?>');
};

export const postprocess = ({
  dir,
  operations,
}: {
  dir: string;
  operations: ConditionalExpressionAction[];
}) => {
  const files = getFilesInDir(dir);
  console.log('operations to perform => ', operations);
  if (!Boolean(operations.length)) return;

  files.forEach((fullFileName) => {
    const filePath = `${dir}/${fullFileName}`;
    const file = getFileContent(filePath);
    const $ = load(file);

    const { fileName } = getFileMeta(fullFileName);
    const operationsForFile = operations.filter((f) => {
      const { fileName: fName } = getFileMeta(f.fileName);
      return fName === fileName;
    });

    operationsForFile.forEach((operation) => {
      const { id, literal } = operation;
      console.log('performing operation => ', id, literal);

      if (operation.type === 'conditionalExpression') {
        const alternate = `[data-condition-uuid="${id}"][data-condition-part="alternate"]`;
        const alternateHtmlString = $(alternate).toString();
        const consequent = `[data-condition-uuid="${id}"][data-condition-part="consequent"]`;
        const consequentHtmlString = $(consequent).toString();

        const nextConsequentContent =
          `${OPEN_SCRIPLET_PLACEHOLDER} if(${literal}) { ${CLOSE_SCRIPLET_PLACEHOLDER} \n` +
          consequentHtmlString +
          '\n' +
          `${OPEN_SCRIPLET_PLACEHOLDER} } else { ${CLOSE_SCRIPLET_PLACEHOLDER}`;
        const nextAlternateContent =
          alternateHtmlString +
          '\n' +
          `${OPEN_SCRIPLET_PLACEHOLDER} } ${CLOSE_SCRIPLET_PLACEHOLDER}`;

        $(consequent).replaceWith(nextConsequentContent);
        $(alternate).replaceWith(nextAlternateContent);
        $(alternate)
          .removeAttr('data-condition-uuid')
          .removeAttr('data-condition-part');
        $(consequent)
          .removeAttr('data-condition-uuid')
          .removeAttr('data-condition-part');
      }
    });

    // save the updated file content to the file system
    const entireDoc = $.html();
    const sanitizedDoc = sanitizeContentString(entireDoc);

    fs.writeFile(filePath, sanitizedDoc, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  });
};
