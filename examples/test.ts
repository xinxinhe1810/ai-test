// import {OpenaiAutoTest} from '../packages/core'

// const Auto = new OpenaiAutoTest({
//     include: ['examples/code/*.ts'],
//     // force: true
// })

// Auto.run()

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const {OpenaiAutoTest} = require('../packages/core');

const Auto = new OpenaiAutoTest({
    include: ['examples/code/*.ts'],
    writeFileType: 'file',
    openaiOptions: {
        config: {
            apiKey: process.env.API_KEY,
        },
    },
});

Auto.run();
