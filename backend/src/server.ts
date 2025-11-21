import * as dotenv from 'dotenv';
import { createApp } from './app';
import { testConnection, closePool } from './config/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 TinyLink server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      
      server.close(async () => {
        console.log('✅ Server closed');
        await closePool();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();