/* eslint-disable max-len */
import {readFileSync} from 'fs-extra';
import ts from 'typescript';
import path from 'path';
import {AutoTestFuncInfo} from './types';

export const rootDir = process.cwd();

const getPath = p => (path.isAbsolute(p) ? p : path.join(rootDir, p));

export function handleTypescriptAst(path, cb: (v: AutoTestFuncInfo) => void, skipComment = 'openai-test-skip') {
    const realPath = getPath(path);

    const fileContent = readFileSync(realPath, 'utf-8');

    const code = fileContent;

    // const program = ts.createProgram([file], {});
    // console.log('handleTypescriptAst', realPath);
    const sourceFile = ts.createSourceFile(realPath, code, ts.ScriptTarget.ES2020, true);
    // const typeChecker = program.getTypeChecker();

    // 查找所有函数
    function visitedNode(node: ts.Node) {
        // 检查导出的函数声明
        if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node))) {
            const functionName = node.name ? node.name.escapedText : 'anonymous';
            // console.log('is Function or isArrowFunction', functionName)

            if (functionName === 'anonymous') {
                // console.log('node.name.escapedText')
                return;
            }

            // 对 export 的代码做测试
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                const leadingComments = ts.getLeadingCommentRanges(code, node.pos);
                const checkNeedSkip = !leadingComments || !leadingComments.some(range => {
                    return code.substring(range.pos, range.end).includes(skipComment);
                });

                if (checkNeedSkip) {
                    cb({
                        name: functionName,
                        code: code.slice(node.pos, node.end),
                        path,
                        absolutePath: realPath,
                    });
                }
                else {
                    console.warn('skip function');
                }
            }
            else {
                // eslint-disable-next-line no-console
                console.log('not export func, skip handle', functionName);
            }
        }
        else if (ts.isIdentifier(node)) {
            // 引用关系处理
            // const symbol = typeChecker.getSymbolAtLocation(node);
            // console.log('symbol', symbol)
            // console.log('====isIdentifier', node.getText())
        }
        else {
            // console.log('===other', node.getText())
        }

        ts.forEachChild(node, visitedNode);
    }

    visitedNode(sourceFile);
}

export function getWritePathInfo(absolutePath: string) {
    const pathName = absolutePath.replace(/\.(js|ts|mjs)/, '');

    const relativePath = pathName.split('/');

    // dbg('pathName', pathName, relativePath)

    const relativePathName = relativePath.at(-1) === 'index' ? '..' : `../${relativePath.at(-1)}`;

    const absoluteWritePath = relativePath.filter(p => p !== relativePath.at(-1)).join('/');

    return {
        relativePathName,
        absoluteWritePath,
        relativePath,
    };
}

export const getPrompt = (code: string) => {
    // const prompt = `Please generate a ${testType} unit test for the following JavaScript code, ensuring 100% test coverage and including various scenarios such as success and failure. Please note that the provided code is only a partial block of code and any non-existent functions should not be tested. \n\n${code}\n`;
    const prompt = `
    Write a Jest unit test code block to thoroughly test the functionality and edge cases of the following TypeScript function. Make sure to cover various inputs and expected outputs, including successful cases, failing cases, and boundary conditions.

Example code to be tested:

${code}

Please note that the function relies on an external function, which is not provided. Focus on testing the parts of the function that can be thoroughly tested without the need to unit test or mock the external function. The Jest test environment is \" jsdom \", mock dom function or attrs don\'t redefine dom property, please use jest mock functions instead."
Ensure that the generated unit tests are based on TypeScript and do not contain any type-related errors.
    `;

    return prompt;
};