require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { aiRouter } = require('./ai');

const app = express();
app.use(cors({ origin: process.env.ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/ai', aiRouter);

const port = process.env.PORT || 8787;
app.listen(port, () => console.log('Server listening on', port));
