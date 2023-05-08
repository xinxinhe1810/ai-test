import {OpenaiAutoTest} from '../packages/core'

const Auto = new OpenaiAutoTest({
    include: ['examples/code/index.ts'],
    // force: true
})

Auto.run()