import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Melayani file statis dari folder 'dist' hasil build Vite
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: Pastikan semua route yang tidak ditemukan file statisnya diarahkan ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sovereign Engine active on port ${PORT}`);
});