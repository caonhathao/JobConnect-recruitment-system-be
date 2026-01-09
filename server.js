require ('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// import thư viện
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


// Cấu hình Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());


// CRUD-methods , create-post, read-get, update-put, delete-delete
// route mặc đinh
app.get('/', (req, res) => {

    res.status(200).json({
        status: 'Ok',
        message: 'Server is running',
        timestampe: new Date().toISOString(),
    });
});



app.listen(PORT, () => {
    console.log(`✅ Server is running on port: http://localhost:${PORT}`);
    
}); 
