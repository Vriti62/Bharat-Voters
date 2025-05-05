const express = require('express');
const app = express();
const session = require('express-session');
const db = require('./db');
require('dotenv').config();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.set('view engine', 'ejs');
const bodyParser = require('body-parser'); 
app.use(bodyParser.json()); // req.body
const PORT = process.env.PORT || 3000;  // Changed from 3000 to 7000
const router = express.Router();
const User = require('./models/user'); // Import the User model

// Import the verifyToken middleware
const { verifyToken } = require('./routes/userRoutes'); // Import from userRoutes.js

// Add this route at the top of your routes
app.get('/', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId); // Fetch user details
        if (!user) {
            return res.redirect('/user/login'); // Redirect to login if user not found
        }
        res.render('loggedhome', { user }); // Render the homepage
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Import the router files
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use the routers
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);
app.use('/candidate', candidateRoutes);
app.use('/admin', adminRoutes);

app.get('/bharatvoter', async (req, res) => {
    res.render('logouthome'); // Serves the homepage
});

app.get('/process??', async (req, res) => {
    res.render('logout_process'); // Serves the process page
});

app.get('/about??', async (req, res) => {
    res.render('logout_aboutpage'); // Serves the about page
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);  // Use template literal to show actual port
});