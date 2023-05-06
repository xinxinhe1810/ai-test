import { readFileSync } from "fs-extra";
import ts from "typescript";
import path from 'path';
import { AutoTestFuncInfo } from "./types";

const rootDir = process.cwd()

const getPath = (p) => path.isAbsolute(p) ? p : path.join(rootDir, p);

export function handleTypescriptAst(path, cb: (v: AutoTestFuncInfo) => void) {
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
                return
            }

            // 对 export 的代码做测试
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                const leadingComments = ts.getLeadingCommentRanges(code, node.pos);
                const checkNeedSkip = !leadingComments || !leadingComments.some(range => {
                    return code.substring(range.pos, range.end).includes('skip-test')
                })

                if (checkNeedSkip) {
                    cb({
                        name: functionName,
                        code: code.slice(node.pos, node.end),
                        path,
                        absolutePath: realPath,
                    });
                } else {
                    console.log('skip function')
                }
            } else {
                console.log('not export func', functionName, code.substring(node.pos, node.end))
            }
        } else if (ts.isIdentifier(node)) {
            // 引用关系处理
            // const symbol = typeChecker.getSymbolAtLocation(node);
            // console.log('symbol', symbol)
            // console.log('====isIdentifier', node.getText())
        } else {
            // console.log('===other', node.getText())
        }

        ts.forEachChild(node, visitedNode);
    }

    visitedNode(sourceFile);
}

export function getWritePathInfo (absolutePath) {
    const pathName = absolutePath.replace(/\.(js|ts|mjs)/, '')
    
    const relativePath = pathName.split('/');

    const relativePathName = relativePath.at(-1) === 'index' ? '..' : `../${relativePath}`

    const absoluteWritePath = relativePath.filter(p => p !== relativePath.at(-1)).join('/')

    return {
        relativePathName,
        absoluteWritePath
    }
}

// TODO: 是否测试函数中调用的函数、暂时不支持
export const getPrompt = (code: string, testType = 'jest') => {
    const prompt = `Please generate a ${testType} unit test for the following JavaScript code, ensuring 100% test coverage and including various scenarios such as success and failure. Please note that the provided code is only a partial block of code and any non-existent functions should not be tested. \n\n${code}\n`;
    if (testType === 'jest') {
        return prompt
    }

    return prompt
}