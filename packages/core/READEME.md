# openai-test 自动生成 Jest 单元测试

这个项目可以帮助你使用 OpenAI 自动生成 Jest 单元测试。通过配置文件和简单的代码，你可以轻松生成测试文件，从而提高你的开发效率。

## 安装

首先，通过 npm 安装 `openai-test` 包：

```bash
npm install openai-test
```

# 配置
执行初始化(可选)
```shell
npx openai-test init
```
或者手动在项目根目录下创建一个名为 openaitest.config.js 的配置文件，并添加如下内容：(可选)

```javascript
module.exports = {
    include: ['**/utils/*.{js,ts}'], // 默认为 include: ["**/utils/*.{js,ts}"]
};
```

上述配置文件将指定要为哪些文件生成单元测试。在这个例子中，我们将为 utils 目录下的所有 .js 文件生成测试。
# 生成测试
在项目根目录下运行 openai-test 命令：
```bash
openai-test
```
将自动生成 Jest 单元测试文件。

# 使用 core 包
你还可以通过另一种方式来实现自动生成单元测试，那就是使用 openai-test/core 包。首先，下载 openai-test/core：

```bash
npm install openai-test/core
```

然后，在你的项目中，创建一个新的 JavaScript 或 TypeScript 文件，例如 autotest.js。在这个文件中，引入 OpenaiAutoTest 类并实例化它，然后调用 run 方法：

```javascript
import { OpenaiAutoTest } from 'openai-test/core';

const Autotest = new OpenaiAutoTest({
    include: ['examples/code/index.ts'],
    // force: true
});

Autotest.run();

```
上述代码将为 examples/code/index.ts 文件生成 Jest 单元测试。如果你想强制覆盖已存在的测试文件，可以将 force 选项设置为 true。

运行 autotest.js 文件：
```bash

node autotest.js

```
这将同样自动生成 Jest 单元测试文件。

现在，你可以轻松地使用 OpenAI 自动生成 Jest 单元测试来提高你的开发效率。祝你编码愉快！