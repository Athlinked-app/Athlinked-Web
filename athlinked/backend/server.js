const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log(`💡 To kill the process on port ${PORT}, run:`);
    console.log(`   lsof -ti:${PORT} | xargs kill -9`);
    console.log(`   Or on Linux: kill -9 $(lsof -ti:${PORT})`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});
