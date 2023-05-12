/* eslint-disable max-len */
export const rootDir = process.cwd();

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

export const getPrompt = (code: string, referenceCodes?: string[]) => {

    const contextCode = referenceCodes?.length ? `
    The following is the code partially referenced in the test function. These reference codes, located within the context of the test function, provide guidance for generating unit tests but are not involved in actual unit testing, and do not exist in the context of the unit test code.
    ${referenceCodes.join(',')}`
        : '';
    const prompt = `
Write a Jest unit test code block to thoroughly test the functionality and edge cases of the following TypeScript function. Make sure to cover various inputs and expected outputs, including successful cases, failing cases, and boundary conditions.
Example code to be tested:

/** code to be tested start **/
${code}
/** code to be tested end **/

/** reference codes start **/
${contextCode}
/** reference codes end **/

For a variable or method within the same class, unit tests are included in one describe block.
If there are comments, you can refer to the meaning of the function in the comments to identify its purpose for testing. If there is a prompt in the comments, you can refer to the content of the prompt to generate testing rules.
Please note that if the function relies on an external function or variable that is not provided, and it is in the context of the function, it cannot be mocked in Jest. 
The Jest test environment is "jsdom", so mock functions should be used instead of mock DOM functions or properties to redefine DOM properties.
Please ensure that the generated unit tests are based on TypeScript and do not contain any type-related errors.
As a result, there is no need to write import declaration.
If DOM operations are involved, do not retrieve elements from the DOM because these elements do not exist in jsdom. Before spying on the element, please first check if this element exists, or create this element in the DOM before testing, and then retrieve it.
Please follow the Jest testing standards and JavaScript code standards to generate test code.
Please ensure that the code can run.
    `;

    return prompt;
};

type PromiseFn<T> = () => Promise<T>;

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