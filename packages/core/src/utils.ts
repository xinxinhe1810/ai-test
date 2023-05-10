/* eslint-disable max-len */
import {readFileSync} from 'fs-extra';
import ts from 'typescript';
import path from 'path';
import {AutoTestFuncInfo} from './types';
import {debug} from 'debug';

export const rootDir = process.cwd();

type NodeStr = string | ts.__String;

const dbg = debug('openai-test');

const getPath = p => (path.isAbsolute(p) ? p : path.join(rootDir, p));

type GetNameDeclaration =
ts.FunctionLikeDeclaration
| ts.VariableLikeDeclaration
| ts.ClassLikeDeclaration
| ts.VariableStatement;

const getName = (node: GetNameDeclaration) => {
    if (ts.isVariableStatement(node)) {
        return getName(node.declarationList.declarations[0]);
    }
    return node.name ? ('escapedText' in node.name ? node.name.escapedText : 'unknown') : 'anonymous';
};

export function handleTypescriptAst(path, cb: (v: AutoTestFuncInfo) => void, skipComment = 'openai-test-skip') {
    const realPath = getPath(path);

    const fileContent = readFileSync(realPath, 'utf-8');

    const sourceFile = ts.createSourceFile(realPath, fileContent, ts.ScriptTarget.ES2020, true);

    const result = new Set<NodeStr>();

    const map = new Map<NodeStr, GetNameDeclaration>();

    function handleCode(code: string, node: GetNameDeclaration, exportType: AutoTestFuncInfo['exportType'] = 'named') {
        const functionName  = getName(node);

        if (!functionName) {
            console.warn(`${node.getText()} is not found`);
            return;
        }


        if (functionName === 'anonymous' || functionName === 'unknown') {
            console.warn(`${node.getText()} functionName is validated`);
            return;
        }

        if (result.has(functionName)) {
            dbg(`${functionName} has be tested`);
            return;
        }

        const leadingComments = ts.getLeadingCommentRanges(code, node.pos);
        const checkNeedSkip = !leadingComments || !leadingComments.some(range => {
            return code.substring(range.pos, range.end).includes(skipComment);
        });

        if (checkNeedSkip) {
            result.add(functionName);
            cb({
                name: functionName,
                code: code.slice(node.pos, node.end),
                path,
                absolutePath: realPath,
                exportType,
            });
        }
        else {
            console.warn('skip function', functionName);
        }
    }

    // 查找所有函数
    function visitedNode(node: ts.Node) {
        // console.log('node', node);

        // export default
        if (ts.isExportAssignment(node)) {
            // 获取导出的默认值
            const exportedValue = node.expression;

            // export default {}
            if (ts.isObjectLiteralExpression(exportedValue)) {
                // 遍历对象字面量的属性
                exportedValue.properties.forEach(prop => {
                    if (ts.isPropertyAssignment(prop)) {
                        if ('escapedText' in prop.initializer) {
                            const functionName = getName(prop);
                            // console.log('isPropertyAssignment', prop.initializer.escapedText);
                            // map[prop.initializer.escapedText] = 1;
                            // console.log('++++', fileContent.substring(prop.getStart(sourceFile), prop.getEnd()));
                            const recordNode = map.get(functionName);
                            if (recordNode) {
                                dbg('[get recordNode] [export default] isPropertyAssignment', functionName);
                                handleCode(fileContent, recordNode, 'default');
                            }
                        }
                        else {
                            console.warn('un handle isPropertyAssignment', prop.getText());
                        }
                    }

                    else if (ts.isShorthandPropertyAssignment(prop)) {
                        const functionName = getName(prop);
                        dbg('isShorthandPropertyAssignment', functionName);
                        const recordNode = map.get(functionName);
                        if (recordNode) {
                            dbg('[get recordNode] [export default] isShorthandPropertyAssignment', functionName);
                            handleCode(fileContent, recordNode, 'default');
                        }
                    }

                    else if (ts.isMethodDeclaration(prop)) {
                        dbg('isMethodDeclaration');
                        handleCode(fileContent, prop, 'default');
                    }
                    else {
                        console.warn('no handle', prop.getText());
                    }
                });
            }
            else {
                // export default test
                if ('escapedText' in node.expression) {
                    const recordNode = map.get(node.expression.escapedText as string);
                    if (recordNode) {
                        dbg('[get recordNode] [export default] text', node.expression.escapedText);

                        handleCode(fileContent, recordNode);
                    }
                }
                else {
                    console.warn('no handle', node.expression.getText());
                }
            }
        }

        // 检查导出的函数声明
        // function a() {}
        // a = () => {}
        // isMethodDeclaration export xxx = {a: function() {}}
        if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) || ts.isClassDeclaration(node)) {
            const functionName = getName(node);

            if (functionName === 'anonymous') {
                return;
            }

            if (functionName === 'unknown') {
                console.warn('unknown name', node.getText());
                return;
            }

            // 对 export 的代码做测试
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                handleCode(fileContent, node, 'named');
            }
            else {
                // eslint-disable-next-line no-console
                map.set(functionName, node);
                dbg('not export func, skip handle', functionName);
            }
        }

        else if (ts.isVariableStatement(node)) {
            let isExported = false;
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                isExported = true;
            }

            let hasMethod = false;

            const functionName: NodeStr = getName(node);

            node.declarationList.declarations.forEach(dec => {
                if (ts.isVariableDeclaration(dec)) {
                    // const a = xxx
                    if (ts.isFunctionLike(dec.initializer)) {
                        const functionName = getName(dec);

                        map.set(functionName, dec);
                        // xxx = {c: () => {}} => c
                        dbg('record declaration [isVariableStatement-isVariableDeclaration]', functionName);
                    }

                    if (dec.initializer && ts.isObjectLiteralExpression(dec.initializer)) {
                        dec.initializer.properties.forEach(prop => {
                            if (ts.isPropertyAssignment(prop)) {
                                if (ts.isFunctionLike(prop.initializer)) {
                                    const functionName = getName(prop);

                                    map.set(functionName, prop);
                                    // xxx = {d(){}} => d => record
                                    dbg('record property [isVariableStatement]', functionName);
                                }

                                if (ts.isClassLike(prop.initializer)) {
                                    const className = getName(prop);

                                    console.log('className', className);

                                    map.set(className, prop);
                                    // xxx = {d(){}} => d => record
                                    dbg('record property [isVariableStatement]', className);
                                }
                            }

                            if (ts.isShorthandPropertyAssignment(prop)) {
                                const recordNode = map.get(prop.name.escapedText as string);
                                if (recordNode) {
                                    // xxx = {e} => e => get code
                                    dbg('[get recordNode] [isVariableStatement]', recordNode.getText());
                                }
                            }

                            if (ts.isMethodDeclaration(prop)) {
                                hasMethod = true;
                                const functionName = getName(prop);
                                // console.log('isMethodDeclaration', functionName, prop.getText());
                                const recordNode = map.get(functionName as string);

                                if (!recordNode) {
                                    map.set(functionName, prop);

                                    dbg('[set recordNode] [isMethodDeclaration]', functionName);
                                    return;
                                }
                            }
                        });
                    }
                }
            });

            if (hasMethod) {
                map.set(functionName, node);
            }

            if (isExported) {
                handleCode(fileContent, node);
            }
        }

        ts.forEachChild(node, visitedNode);
    }

    visitedNode(sourceFile);

    console.log('result', result, map.keys());
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
        fileName: relativePath.at(-1),
    };
}

export const getPrompt = (code: string) => {
    const prompt = `
    Write a Jest unit test code block to thoroughly test the functionality and edge cases of the following TypeScript function. Make sure to cover various inputs and expected outputs, including successful cases, failing cases, and boundary conditions.
Example code to be tested:

${code}

If there are comments, you can refer to the meaning of the function in the comments to identify its purpose for testing. If there is a prompt in the comments, you can refer to the content of the prompt to generate testing rules.
Please note that if the function relies on an external function or variable that is not provided, and it is in the context of the function, it cannot be mocked in Jest. 
The Jest test environment is "jsdom", so mock functions should be used instead of mock DOM functions or properties to redefine DOM properties.
Please ensure that the generated unit tests are based on TypeScript and do not contain any type-related errors.
As a result, there is no need to write import declaration.
For a variable or method within the same class, unit tests are included in one describe block.
    `;

    return prompt;
};