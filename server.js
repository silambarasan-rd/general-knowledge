const express = require('express');

const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use("/public", express.static('public'))

// Home page (Front page)
app.get('/', (req, res) => {
  res.sendFile(__dirname +'/public/views/index.html')
});

// Add/Create a new GK row
app.post('/api/addGeneralKnowledge', (req, res) => {  
  res.json({ data: req.body })
})

// Server instance
const server = app.listen(3000, () => {
  console.log('Your application is running on ' + server.port);
});