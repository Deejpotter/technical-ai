// Import necessary modules
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Read allowed origins from environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

// Enable CORS
app.use(cors({
  origin: allowedOrigins
}));

// Initialize rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Configure logging to log into app.log file with debug level
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CNC Technical Support Chatbot API',
      version: '1.0.0',
      description: 'API for CNC Technical Support Chatbot'
    }
  },
  apis: ['./routes.js'] // files containing annotations for the OpenAPI Specification
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger UI at /swagger endpoint
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Import routes
const routes = require('../cnc-tools/backend/routes');
app.use('/', routes);

// Redirect root to Swagger UI
app.get('/', (req, res) => {
  res.redirect('/swagger');
});

// Route to serve Swagger specification
app.get('/spec', (req, res) => {
  res.json(swaggerDocs);
});

// Define port
const PORT = process.env.PORT || 3000;

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server is running in ${app.get('env')} mode on port ${PORT}`);
  });
}

module.exports = app;
