import {OpenaiAutoTest} from '../packages/core/index'

const Auto = new OpenaiAutoTest({
    include: ['examples/code/index.ts'],
    // force: true
})

Auto.run()