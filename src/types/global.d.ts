/// <reference types="chrome-types"/>

// 扩展全局 Window 接口以包含 chrome API
declare global {
    const chrome: typeof chrome;
}

export { };