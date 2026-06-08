const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { apiKeyRepo, requestLogRepo } = require('../db/repositories');
const { authenticate, generateToken } = require('../middleware/auth');

router.post('/token', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'apiKey is required in request body' });
  }

  const record = apiKeyRepo.findByKey(apiKey);
  if (!record) {
    return res.status(403).json({ error: 'Invalid or inactive API key' });
  }

  const token = generateToken({ owner: record.owner, apiKey: record.key });
  res.json({ token, expiresIn: '24h' });
});

router.post('/keys', authenticate, (req, res) => {
  const { owner } = req.body;
  if (!owner) {
    return res.status(400).json({ error: 'owner is required in request body' });
  }

  const key = uuidv4();
  apiKeyRepo.create(key, owner);
  res.status(201).json({ key, owner });
});

router.get('/keys', authenticate, (req, res) => {
  const keys = apiKeyRepo.listAll();
  res.json({ keys });
});

router.get('/logs', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = requestLogRepo.getRecent(limit);
  res.json({ logs });
});

module.exports = router;
