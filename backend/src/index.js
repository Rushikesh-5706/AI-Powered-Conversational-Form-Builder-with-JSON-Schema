const express = require('express');
const cors = require('cors');
const config = require('./config');
const healthRouter = require('./routes/health');
const formRouter = require('./routes/form');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', healthRouter);
app.use('/api/form', formRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected internal error occurred.' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Backend service running on port ${config.port}`);
  });
}

module.exports = app;
