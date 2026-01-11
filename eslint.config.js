import js from '@eslint/js'
import globals from 'globals'

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                chrome: 'readonly'
            },
            // 启用 TypeScript 类型检查
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            }
        },
        rules: {
            // 允许使用console，因为Chrome插件开发中常用console调试
            'no-console': 'off',
            // 警告未使用的变量
            'no-unused-vars': 'warn',
            // 允许在Promise构造函数中使用async函数
            'no-async-promise-executor': 'off'
        }
    }
]