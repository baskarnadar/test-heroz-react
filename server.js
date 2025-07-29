const express = require('express');
const path = require('path');
const app = express();

const PORT = 5000;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));
console.log(path.join(__dirname, 'dist'))
// For SPA fallback: serve index.html on all other routes
app.get('*', (req, res) => {
    console.log(__dirname);
    
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`App running on http://127.0.0.1:${PORT}`);
});
