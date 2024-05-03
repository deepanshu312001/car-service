const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json())


const appointmentRouter = require('./routes/route.appointments');


const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});


app.use('/appointments', appointmentRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
