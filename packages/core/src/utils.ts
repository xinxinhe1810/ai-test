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
    // 如果是变量、则返回第一个 如： const a = {}; return a
    if (ts.isVariableStatement(node)) {
        return getName(node.declarationList.declarations[0]);
    }
    return node.name ? ('escapedText' in node.name ? node.name.escapedText : 'unknown') : 'anonymous';
};

// function getImportName(node: ts.ImportDeclaration | ts.ImportSpecifier) {
//     if ('importClause' in node) {
//         if (node.importClause?.name) {
//             return {
//                 propertyName: '',
//                 name: node.importClause.name,
//             };
//         }

//         // if (node.importClause?.namedBindings) {
//         //     if ('elements' in node.importClause.namedBindings) {
//         //         return {
//         //             propertyName: '',
//         //             name: node.importClause.namedBindings.elements.map(i => getImportName(i)),
//         //         };
//         //     }
//         // }
//     }
//     else if ('name' in node) {
//         return {
//             propertyName: node.propertyName?.escapedText,
//             name: node.name.escapedText,
//         };
//     }
//     else {
//         console.warn('unhandled import', node.getText());
//         return {
//             propertyName: '',
//             name: '',
//         };
//     }
// }

export function handleTypescriptAst(path, cb: (v: AutoTestFuncInfo) => void, skipComment = 'openai-test-skip') {
    const realPath = getPath(path);

    const fileContent = readFileSync(realPath, 'utf-8');

    const sourceFile = ts.createSourceFile(realPath, fileContent, ts.ScriptTarget.ES2020, true);

    const result = new Set<NodeStr>();

    const funcOrClassMap = new Map<NodeStr, GetNameDeclaration>();

    const importMap = new Map<NodeStr, string>();

    const varCodes = new Map<NodeStr, string>();

    function handleCodeCallback(code: string, node: GetNameDeclaration, exportType: AutoTestFuncInfo['exportType'] = 'named', referenceCodes?: string[]) {
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
                referenceCodes,
            });
        }
        else {
            console.warn('skip function', functionName);
        }
    }

    function getFunctionCodeReferenceAnotherInGlobal(funcNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.ClassDeclaration) {
        const functionName = funcNode.name?.getText();
        const referenceCodes = new Set<string>();

        function visitedNode(node: ts.Node) {
            const localVariables = new Map();

            // If we encounter a variable declaration, add the variable to the local scope
            if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
                localVariables.set(node.name.text, node.getText());
            }

            if (ts.isFunctionExpression(node) || ts.isFunctionLike(node)) {
                if (node.name && functionName !== node.name.getText()) {
                    localVariables.set(node.name.getText(), node.getText());
                }
            }

            // If we encounter a reference to a variable, check if it's a global variable
            if (node.kind === ts.SyntaxKind.Identifier) {
                const variableName = node.getText();
                const hasVar = varCodes.get(variableName);
                const hasFunc  = funcOrClassMap.get(variableName);
                const localNot = !localVariables.get((node as ts.Identifier).text);

                if (localNot && (hasVar || hasFunc)) {
                    // console.log(`Found a reference to ${variableName} at line`);
                    // referenceCodes.push(node.getText());
                    referenceCodes.add(node.getText());
                }
            }
            ts.forEachChild(node, visitedNode);
        }

        visitedNode(funcNode);

        // console.log('referenceCodes', Array.from(referenceCodes.keys()));
        return Array.from(referenceCodes.keys());
    }

    // 查找所有函数
    function visitedNode(node: ts.Node) {

        // console.log(node.kind)
        // if (node.kind === ts.SyntaxKind.Identifier) {
        //     console.log('Identifier', node.getText(), node.parent.getText());
        // }

        if (ts.isImportDeclaration(node)) {
            if (!node.importClause?.isTypeOnly) {
                if ('text' in node.moduleSpecifier) {
                    // const name = getImportName(node);
                    const moduleName = node.moduleSpecifier.text as string;
                    // 引用的外部函数
                    if (!(/^./.exec(moduleName))) {
                        importMap.set(moduleName, node.getText());
                    }
                    else {
                        console.warn('import other file code, skip handle');
                        // 内部函数、不做处理
                    }
                }
                else {
                    console.warn('unknown moduleSpecifier', node.getText());
                }
            }
        }

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
                            const recordNode = funcOrClassMap.get(functionName);
                            if (recordNode) {
                                dbg('[get recordNode] [export default] isPropertyAssignment', functionName);
                                handleCodeCallback(fileContent, recordNode, 'default');
                            }
                        }
                        else {
                            console.warn('un handle isPropertyAssignment', prop.getText());
                        }
                    }

                    else if (ts.isShorthandPropertyAssignment(prop)) {
                        const functionName = getName(prop);
                        dbg('isShorthandPropertyAssignment', functionName);
                        const recordNode = funcOrClassMap.get(functionName);
                        if (recordNode) {
                            dbg('[get recordNode] [export default] isShorthandPropertyAssignment', functionName);
                            handleCodeCallback(fileContent, recordNode, 'default');
                        }
                    }

                    else if (ts.isMethodDeclaration(prop)) {
                        dbg('isMethodDeclaration');
                        handleCodeCallback(fileContent, prop, 'default');
                    }
                    else {
                        console.warn('no handle', prop.getText());
                    }
                });
            }
            else {
                // export default test
                if ('escapedText' in node.expression) {
                    const recordNode = funcOrClassMap.get(node.expression.escapedText as string);
                    if (recordNode) {
                        dbg('[get recordNode] [export default] text', node.expression.escapedText);

                        handleCodeCallback(fileContent, recordNode);
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
                const referenceCodes = getFunctionCodeReferenceAnotherInGlobal(node);
                handleCodeCallback(fileContent, node, 'named', referenceCodes);
            }
            else {
                // eslint-disable-next-line no-console
                funcOrClassMap.set(functionName, node);
                dbg('not export func, skip handle', functionName);
            }
        }

        // 处理到处的变量声明
        else if (ts.isVariableStatement(node)) {
            let isExported = false;
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                isExported = true;
            }

            let hasMethod = false;

            const functionName: NodeStr = getName(node);

            node.declarationList.declarations.forEach(dec => {
                if (ts.isVariableDeclaration(dec)) {
                    varCodes.set(functionName, dec.getText());

                    // const a = xxx
                    // const a = function(){}
                    if (dec.initializer
                        && (ts.isFunctionLike(dec.initializer) || ts.isFunctionExpression(dec.initializer))) {
                        const functionName = getName(dec);

                        funcOrClassMap.set(functionName, dec);
                        // xxx = {c: () => {}} => c
                        dbg('record declaration [isVariableStatement-isVariableDeclaration]', functionName);
                    }

                    if (dec.initializer && ts.isObjectLiteralExpression(dec.initializer)) {
                        dec.initializer.properties.forEach(prop => {
                            if (ts.isPropertyAssignment(prop)) {
                                if (ts.isFunctionLike(prop.initializer)) {
                                    const functionName = getName(prop);

                                    funcOrClassMap.set(functionName, prop);
                                    // xxx = {d(){}} => d => record
                                    dbg('record property [isVariableStatement]', functionName);
                                }

                                if (ts.isClassLike(prop.initializer)) {
                                    const className = getName(prop);

                                    // console.log('className', className);

                                    funcOrClassMap.set(className, prop);
                                    // xxx = {d(){}} => d => record
                                    dbg('record property [isVariableStatement]', className);
                                }
                            }

                            if (ts.isShorthandPropertyAssignment(prop)) {
                                const recordNode = funcOrClassMap.get(prop.name.escapedText as string);
                                if (recordNode) {
                                    // xxx = {e} => e => get code
                                    dbg('[get recordNode] [isVariableStatement]', recordNode.getText());
                                }
                            }

                            if (ts.isMethodDeclaration(prop)) {
                                hasMethod = true;
                                const functionName = getName(prop);
                                // console.log('isMethodDeclaration', functionName, prop.getText());
                                const recordNode = funcOrClassMap.get(functionName as string);

                                if (!recordNode) {
                                    funcOrClassMap.set(functionName, prop);

                                    dbg('[set recordNode] [isMethodDeclaration]', functionName);
                                    return;
                                }
                            }
                        });
                    }
                }
            });

            // 含有变量的方法，保存起来
            if (hasMethod) {
                funcOrClassMap.set(functionName, node);
            }

            // 变量中含有方法，且被导出
            if (isExported && hasMethod) {
                handleCodeCallback(fileContent, node);
            }
        }

        ts.forEachChild(node, visitedNode);
    }

    visitedNode(sourceFile);

    // console.log('result', result, funcOrClassMap.keys(), varCodes);
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

export type PromiseFn<T> = () => Promise<T>;

export function plimit<T>(promiseArr: Array<PromiseFn<T>>, limit: number, cb?: (result: T[]) => void): Promise<T[]> {
    const resultArr: T[] = []; // 存储所有 Promise 的结果
    const runningPromises: Array<Promise<void | T>> = []; // 存储正在运行的 Promise

    function runPromise() {
        if (promiseArr.length === 0 && runningPromises.length === 0) {
            return Promise.resolve();
        }

        if (runningPromises.length >= limit || promiseArr.length === 0) {
            return Promise.race(runningPromises).then(() => runPromise());
        }

        const currentPromise = promiseArr.shift();

        if (!currentPromise) {
            return Promise.resolve();
        }

        const runningPromise = currentPromise()
            .then(result => {
                resultArr.push(result);
                cb && (result);
            })
            .finally(() => {
                runningPromises.splice(runningPromises.indexOf(runningPromise), 1);
            });

        runningPromises.push(runningPromise);
        return runPromise();
    }

    return runPromise().then(() => resultArr);
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}