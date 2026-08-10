import { registerAs } from "@nestjs/config";

// TEST


export default registerAs( 'database', () => ({
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'sakura.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT || '13002', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'ZLGVCQNTuERYHSGuqmfLeuLkUFmnRhwj',
    database: process.env.DB_DATABASE || 'railway',
   
}))