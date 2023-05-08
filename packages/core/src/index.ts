import path from 'path'
import debug from 'debug'
import { sync } from 'fast-glob'
import { writeFileSync, ensureFileSync, existsSync } from 'fs-extra';
import { OpenAIApi, Configuration, ConfigurationParameters, CreateCompletionRequest } from "openai";
import { AutoTestFuncInfo } from "./types";
import { getPrompt, getWritePathInfo, handleTypescriptAst } from "./utils";

const dbg = debug('openai-autoTest');

interface Options {
    include: string[]
    exclude?: string[]
    testType?: 'jest';
    skipTestComment?: string;
    // concurrency?: number;

    /**
     * 是否覆盖已存在的文件夹
     */
    force?: boolean

    openaiOptions?: {
        config?: ConfigurationParameters
        createCompletionRequest?: CreateCompletionRequest
    }
}

export class OpenaiAutoTest {
    private testType = 'jest'

    private include: string[] = []
    private exclude: string[] = []

    private openai: OpenAIApi | null = null

    // private concurrency: number = 4;

    skipTestComment: string | undefined = undefined

    private force = false

    private needToAutoTestCodes: AutoTestFuncInfo[] = []

    constructor(options: Options) {
        this.include = options.include || []
        this.exclude = options.exclude || []

        this.force = !!options.force

        this.skipTestComment = options.skipTestComment
        // this.concurrency = options.concurrency || 2

        const configuration = new Configuration({
            apiKey: process.env.API_KEY,
            ...options.openaiOptions?.config,
        });

        this.openai = new OpenAIApi(configuration);
    }

    private getAutoTestSourceCode() {
        const { include = [], exclude = [] } = this;
        const defaultExclude = [
            '!**/__test__/**',
            '!**/*.spec.{js,ts,mjs}',
            '!**/*.{css,scss,styl,less,sass,html,jsx,tsx}',
        ]

        const handledExclude = exclude.map(e => `!${e}`);

        const paths = sync([...include, ...defaultExclude, ...handledExclude], {
            ignore: ['**/node_modules/**']
        });

        for (const path of paths) {
            dbg('path', path)

            handleTypescriptAst(path, (info: AutoTestFuncInfo) => {
                this.needToAutoTestCodes.push(info)
            }, this.skipTestComment);
        }
    }

    private analyzeAndGenerateTestsCode = async (func: AutoTestFuncInfo) => {
        const prompt = getPrompt(func.code);
        // dbg('prompt', prompt);

        dbg('handle analyzeAndGenerateTestsCode before', func.name)

        const response = await this.openai!.createCompletion({
            model: "text-davinci-003",
            max_tokens: 999,
            prompt,
        });

        const { relativePathName, absoluteWritePath } = getWritePathInfo(func.absolutePath)

        const importedCode = `import {${func.name}} from '${relativePathName}';`;

        dbg('importedCode', importedCode);

        const wrapperCode = `
${importedCode}
            ${response.data.choices[0].text}
            `

        dbg('handle analyzeAndGenerateTestsCode end', func.name)

        const writeFilePath = path.join(absoluteWritePath, '__test__', `${func.name}.spec.ts`)

        this.writeResultToPath(writeFilePath, wrapperCode)
    }

    private writeResultToPath = (path: string, wrapperCode: string) => {
        dbg('writeFilePath', path, 'force', this.force, !existsSync(path));

        if (this.force || !existsSync(path)) {
            ensureFileSync(path)
    
            writeFileSync(path, wrapperCode)
            console.warn(path, 'file write success!');
        } else {
            console.warn(path, 'file is existing not force to write, please use force to overwrite it or delete it');
            // console.log('result code', wrapperCode)
        }
    }

    run = async () => {
        await this.getAutoTestSourceCode();

        console.log(this.needToAutoTestCodes.map(i => i.name))

        const promises = this.needToAutoTestCodes.map((i) => this.analyzeAndGenerateTestsCode(i));

        // await pAll(promises, { concurrency: this.concurrency })

        await Promise.all(promises);

        this.needToAutoTestCodes.length = 0;
    }

    listModel = async () => {
        const res = await this.openai!.listModels()

        console.log(res.data.data)

        return res.data.data
    }
}