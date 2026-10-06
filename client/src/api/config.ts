declare const process: { env?: Record<string, string | undefined> } | undefined;

// export const API_BASE_URL =
//   (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
//     ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
//     : 'https://is207r11-main-project.onrender.com/api');

export const API_BASE_URL =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
        : 'http://127.0.0.1:8000/api');

