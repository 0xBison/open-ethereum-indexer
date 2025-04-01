import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            sync: true,
            colorize: true,
            levelFirst: true,
          },
        },
        level: process.env.LOG_LEVEL || 'info',
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
        redact: ['req.headers.authorization'],
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
