/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TWILIO_ACCOUNT_SID: string;
    readonly VITE_TWILIO_AUTH_TOKEN: string;
    readonly VITE_ELEVENLABS_API_KEY: string;
    readonly VITE_APP_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
