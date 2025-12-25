import app from './app.js';
import { env, connectDatabase, disconnectDatabase } from './config/index.js';

// ==================== SERVER STARTUP ====================

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDatabase();

    // Start Express server
    const server = app.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 RedLine CRM Backend Server                          ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(41)}║
║   Port: ${env.PORT.padEnd(49)}║
║   API: http://localhost:${env.PORT}/api                   ║
║   Health: http://localhost:${env.PORT}/api/health                ║
║  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // ==================== GRACEFUL SHUTDOWN ====================

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n📴 ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('🔌 HTTP server closed');
        await disconnectDatabase();
        console.log('✅ Cleanup complete. Goodbye!');
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
