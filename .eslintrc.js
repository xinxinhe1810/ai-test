module.exports = {
    root: true,
    // 参考：https://www.npmjs.com/package/@ecomfe/eslint-config
    extends: [
        '@ecomfe/eslint-config',
        // npm i -D eslint-plugin-import
        // '@ecomfe/eslint-config/import',
        // npm i -D eslint-plugin-react eslint-plugin-react-hooks
        // '@ecomfe/eslint-config/react',
        // npm i -D eslint-plugin-vue
        // '@ecomfe/eslint-config/vue',
        // npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
        '@ecomfe/eslint-config/typescript',
    ],
    rules: {
        '@typescript-eslint/no-unused-vars': ['warn'],
    },
    overrides: [
        {
            files: ['**/tests/unit/**/*.spec.{j,t}s?(x)', '**/__test__/**'],
            env: {
                jest: true,
            },
            rules: {
                'max-len': 'off',
                '@typescript-eslint/no-empty-function': 'off',
            },
        },
    ],
};
