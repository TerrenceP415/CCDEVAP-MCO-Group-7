const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
// Set public and views directories as static folders 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));


app.get('/', (req, res) => {
  //sends index.html from project/views folder via path.join
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/search', (req, res) => {
  //sends search.html from project/views folder via path.join
  res.sendFile(path.join(__dirname, 'views', 'search.html'));
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
