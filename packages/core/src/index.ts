/* eslint-disable max-len */
import path from 'path';
import debug from 'debug';
import {sync} from 'fast-glob';
import {writeFileSync, ensureFileSync, existsSync} from 'fs-extra';
import {OpenAIApi, Configuration, ConfigurationParameters, CreateCompletionRequest} from 'openai';
import {AutoTestFuncInfo} from './types';
import {getPrompt, getWritePathInfo, plimit, rootDir} from './utils';
import pc from 'picocolors';
import ProgressBar from 'progress';
import {handleTypescriptAst} from './ast';

const dbg = debug('openai-test');

interface Options {
    include?: string[];
    exclude?: string[];
    testType?: 'jest';
    skipTestComment?: string;
    concurrency?: number;

    /**
     * 是否覆盖已存在的文件夹
     */
    forceWriteFile?: boolean;

    /**
     * 单元测试写文件的力度
     * 按函数写入单元测试 or 按文件写入单元测试
     * 如：index.ts 中会有多个函数，单元测试是否产出多个文件
     */
    writeFileType?: 'file' | 'function';

    openaiOptions?: {
        config?: ConfigurationParameters;
        createCompletionRequest?: CreateCompletionRequest;
    };
}

export class OpenaiAutoTest {
    options: Options = {
        include: ['**/utils/**.{js,ts}'],
        exclude: [],
        testType: 'jest',
        skipTestComment: 'openai-test-skip',
        writeFileType: 'function',
        forceWriteFile: false,
        openaiOptions: {
            'createCompletionRequest': undefined,
            config: undefined,
        },
    };

    fileMap: Map<string, AutoTestFuncInfo[]> = new Map();

    private readonly openai: OpenAIApi | null = null;

    private readonly concurrency: number = 4;

    private readonly needToAutoTestCodes: AutoTestFuncInfo[] = [];

    constructor(options: Options) {
        this.options = options;

        this.concurrency = options.concurrency || 4;

        const configuration = new Configuration({
            apiKey: process.env.API_KEY,
            ...options.openaiOptions?.config,
        });

        if (!configuration.apiKey) {
            throw new Error('openai API_KEY is requried');
        }

        this.openai = new OpenAIApi(configuration);
    }

    run = async () => {
        this.getAutoTestSourceCode();

        const bar = new ProgressBar('fetching :bar :current\/:total :percent :name', {
            width: 20,
            total: this.needToAutoTestCodes.length,
        });

        const handleFuncs = Array.from(this.needToAutoTestCodes.map(i => i.name));

        // eslint-disable-next-line no-console
        console.log(pc.gray('openai test should be handle func list'), handleFuncs);

        const promises = this.needToAutoTestCodes.map(i => () => this.analyzeAndGenerateTestsCode(i));

        bar.tick({
            name: `${handleFuncs[0]} start`,
        });

        await plimit(promises, this.concurrency, res => {
            bar.tick({
                name: `${handleFuncs[res.length]} done`,
            });
        });

        if (!bar.complete) {
            bar.tick(handleFuncs.length - bar.curr, {
                name: 'all done',
            });
        }

        this.needToAutoTestCodes.length = 0;
        this.writeCodeWithFile();
    };

    listModel = async () => {
        const res = await this.openai!.listModels();

        return res.data.data;
    };

    private getAutoTestSourceCode() {
        const {include = [], exclude = []} = this.options;
        const defaultExclude = [
            '!**/__test__/**',
            '!**/*.spec.{js,ts,mjs}',
            '!**/*.{css,scss,styl,less,sass,html,jsx,tsx}',
        ];

        const handledExclude = exclude.map(e => `!${e}`);

        const paths = sync([...include, ...defaultExclude, ...handledExclude], {
            ignore: ['**/node_modules/**'],
        });

        for (const path of paths) {
            dbg('path', path);

            handleTypescriptAst(path, (info: AutoTestFuncInfo) => {
                this.needToAutoTestCodes.push(info);
            }, this.options.skipTestComment);
        }
    }

    private readonly analyzeAndGenerateTestsCode = async (func: AutoTestFuncInfo) => {
        const prompt = getPrompt(func.code);

        dbg('handle analyzeAndGenerateTestsCode before', func.name);

        try {
            const response = await this.openai!.createCompletion({
                model: 'text-davinci-003',
                max_tokens: 999,
                prompt,
            });

            const {relativePathName} = getWritePathInfo(func.absolutePath);

            dbg('handle analyzeAndGenerateTestsCode end', func.name);

            const singleFunctionImportedCode = `import {${func.name}} from '${relativePathName}';`;

            dbg('importedCode', singleFunctionImportedCode);

            const singleFunctionCode = `
    ${singleFunctionImportedCode}\n${response.data.choices[0].text}
        `;

            const wrapperCode = this.options.writeFileType === 'file' ? `${response.data.choices[0].text}` : singleFunctionCode;

            const mapItem = this.fileMap.get(func.path);
            if (mapItem) {
                mapItem.push({
                    ...func,
                    code: wrapperCode,
                });
            }
            else {
                this.fileMap.set(func.path, [
                    {
                        ...func,
                        code: wrapperCode,
                    },
                ]);
            }
        }
        catch (error) {
            console.error('error', (error as Error).message, (error as any).response.statusText);

            throw new Error('call openai error' + (error as Error).message);
        }
    };

    private readonly writeCodeWithFile = () => {
        // eslint-disable-next-line no-console
        console.log();
        // eslint-disable-next-line no-console
        console.log(pc.gray('start to write code with file'));
        Array.from(this.fileMap.keys()).forEach(key => {
            const item = this.fileMap.get(key);

            const {relativePathName, absoluteWritePath, relativePath, fileName} = getWritePathInfo(key);

            if (this.options.writeFileType === 'file') {
                const writeFilePath
                        = path.join(rootDir, absoluteWritePath, '__test__', `${relativePath.at(-1)}.spec.ts`);

                const defaultImport = item?.filter(i => i.exportType === 'default') || [];

                const namedImport = item
                    ?.filter(i => i.exportType !== 'default')
                    ?.map(i => i.name) || [];

                const hasDefaultImport = defaultImport?.length > 0;

                const defaultImportCode = `${hasDefaultImport
                    ? `${fileName}${namedImport.length ? ', ' : ''}`
                    : ''}`;
                const namedImportCode = `${namedImport.length ? `{${namedImport.join(', ')}}` : ''}`;

                const importedCode = `import ${defaultImportCode}${namedImportCode} from '${relativePathName}';`;

                const restDefaultCode = `const {${defaultImport.map(i => i.name).join(', ')}} = ${fileName}`;

                const allCode = `
    ${importedCode}
    
    ${restDefaultCode}
    ${item?.map(i => i.code).join('\n')}`;

                this.writeResultToPath(writeFilePath, allCode);
            }
            else {
                item?.forEach(file => {
                    const writeFilePath = path.join(absoluteWritePath, '__test__', `${file.name}.spec.ts`);
                    this.writeResultToPath(writeFilePath, file.code);
                });
            }
        });
    };

    private readonly writeResultToPath = (path: string, wrapperCode: string) => {
        dbg('writeFilePath', path, 'force', this.options.forceWriteFile, !existsSync(path));

        if (this.options.forceWriteFile || !existsSync(path)) {
            ensureFileSync(path);

            writeFileSync(path, wrapperCode);

            // eslint-disable-next-line no-console
            console.log(pc.gray(`File was written to ${pc.green(path)}`));
        }
        else {
            console.warn(pc.red(`\nWrite File Failed! File is existing, path: ${path}`), pc.gray('please use options forceWriteFile to overwrite it or delete file'));
        }
    };
}