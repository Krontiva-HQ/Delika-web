/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_BASE_URL: string
  readonly API_KEY: string
  readonly ENV: string
  readonly WPP_SERVER_URL: string
  readonly WPP_AUTH_TOKEN: string
  readonly WPP_SECRET_KEY: string
  readonly GEOAPIFY_API_KEY: string
  readonly GEOAPIFY_API_URL: string
  readonly ORDERS_TABLE_ENDPOINT: string
  readonly VERIFY_OTP_ENDPOINT: string
  readonly GOOGLE_MAPS_API_KEY: string
  readonly PROXY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 