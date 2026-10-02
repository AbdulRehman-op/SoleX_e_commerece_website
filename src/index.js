const express = require('express');
const { PORT, JWT_SECRET } = require('./config');
const { createAdminToken, requireAdmin } = require('./lib/auth');
const adminCatalogRoutes = require('./routes/admin/catalog');
const pool = require('./db');

const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'solex-catalog', database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, service: 'solex-catalog', database: 'disconnected' });
  }
});

app.post('/api/v1/admin/login', (req, res) => {
  const email = req.body?.email || '';
  const password = req.body?.password || '';

  if (email !== 'admin@solex.test' || password !== 'admin123') {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }

  const token = createAdminToken({ id: 1, email, role: 'admin' });
  return res.json({
    token,
    user: { id: 1, email, role: 'admin' },
    expiresIn: '8h',
    jwtSecretConfigured: Boolean(JWT_SECRET),
  });
});

app.use('/api/v1/admin', requireAdmin, adminCatalogRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

if (require.main === module) {
  pool.query('SELECT NOW()')
    .then(() => console.log('✅ Database connected'))
    .catch((err) => console.error('❌ Database connection failed:', err.message));

  app.listen(PORT, () => {
    console.log(`🚀 SoleX catalog API listening on port ${PORT}`);
  });
}

module.exports = app;