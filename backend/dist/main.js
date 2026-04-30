"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    process.on('unhandledRejection', (reason) => {
        console.error('UNHANDLED REJECTION:', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION:', err);
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
    console.log(`Application running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
//# sourceMappingURL=main.js.map