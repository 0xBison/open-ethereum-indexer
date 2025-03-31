import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Open Ethereum Indexer API')
    .setDescription('Open Ethereum Indexer API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // from: https://github.com/swagger-api/swagger-ui/issues/5969#issuecomment-2051591208
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      plugins: [
        // This is the "hacky" part that the GitHub user mentioned
        (...args: any[]) => (window as any).HierarchicalTagsPlugin(...args),
        // Include the default download plugin
        (...args: any[]) =>
          (window as any).SwaggerUIBundle.plugins.DownloadUrl(...args),
      ],
      // Must be a string, not RegExp as mentioned in the comment
      hierarchicalTagSeparator: '|',
    },
    customJs: ['https://unpkg.com/swagger-ui-plugin-hierarchical-tags'],
  });
}
