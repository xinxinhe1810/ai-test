/* eslint-disable max-len */
import {readFileSync} from 'fs-extra';
import ts, {NodeFlags} from 'typescript';
import path from 'path';
import {AutoTestFuncInfo} from './types';
import {debug} from 'debug';

export const rootDir = process.cwd();

type NodeStr = string | ts.__String;

const dbg = debug('openai-test');

const getPath = p => (path.isAbsolute(p) ? p : path.join(rootDir, p));

const declarationMap = {
    [NodeFlags.Const]: 'const',
    [NodeFlags.None]: 'var',
    [NodeFlags.Let]: 'let',
} as const;

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

    // return node.name ? ('escapedText' in node.name ? node.name.escapedText : 'unknown') : 'anonymous';
    return node.name?.getText() || 'anonymous';
};

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

    function getFunctionReferenceCodesAnotherInGlobal(funcNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.ClassDeclaration) {
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

        const codeNames = Array.from(referenceCodes.keys());

        const codes = codeNames.map(i => {
            if (varCodes.get(i)) {
                return varCodes.get(i) || '';
            }

            if (funcOrClassMap.get(i)) {
                return funcOrClassMap.get(i)?.getText() || '';
            }

            return '';
        });

        // console.log('referenceCodes', Array.from(referenceCodes.keys()), codes);
        return codes;
    }

    // 查找所有函数
    function visitedNode(node: ts.Node) {
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
                        const functionName = getName(prop);
                        dbg('isMethodDeclaration', functionName);
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

                        handleCodeCallback(fileContent, recordNode, 'default');
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
                const referenceCodes = getFunctionReferenceCodesAnotherInGlobal(node);
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

            const declaration = node.declarationList.flags && declarationMap[node.declarationList.flags];

            node.declarationList.declarations.forEach(dec => {
                if (ts.isVariableDeclaration(dec)) {
                    // console.log('dec', dec.getText(), fileContent.substring(dec.getStart(), dec.getEnd()));
                    varCodes.set(functionName, `${declaration} ${dec.getText()}`);

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