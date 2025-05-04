const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const bcrypt = require('bcrypt');
// const {jwtAuthMiddleware, generateToken} = require('./../jwt');
const jwt = require('jsonwebtoken');

// route to home page
router.get('/home', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId); // Use `req.user.userId` from the middleware
        if (!user) {
            return res.redirect('/user/login');
        }
        res.render('loggedhome', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// POST route to add a person
router.get('/signup', (req, res) => {
    res.render('signup'); // Signup page
});
  
router.post('/signup', async (req, res) => {
    try {
        const data = req.body;

        // Force the role to be 'voter'
        data.role = 'voter';

        // Validate Aadhar Card Number must have exactly 12 digits
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        }

        // Check if a user with the same Aadhar Card Number already exists
        const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
        }

        // Create a new User document using the Mongoose model
        const newUser = new User(data);

        // Save the new user to the database
        const response = await newUser.save();
        console.log('User registered successfully');
        res.send('Account created successfully');
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Login Route
router.get('/login', (req, res) => {
    res.render('login'); // Login page
});
  
router.post('/login', async (req, res) => {
    try {
        const { aadharCardNumber, password } = req.body;

        if (!aadharCardNumber || !password) {
            return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
        }

        const user = await User.findOne({ aadharCardNumber });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            req.session.token = token;

            // Redirect based on role
            if (user.role === 'admin') {
                return res.redirect('/admin/dashboard');
            } else {
                return res.redirect('/bharatvoter');
            }
        } else {
            res.redirect('/user/login');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// about route

router.get('/about' , (req, res) => {
    res.render('aboutpage'); // About page
});

// process route
router.get('/process' , (req, res) => {
    res.render('Process'); // Process page
});
// Profile route

router.get('/profile',verifyToken ,async (req, res) => {
    res.render('profile', { user }); // User profile page
})

router.put('/profile/password', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // Extract the id from the token
        const { currentPassword, newPassword } = req.body; // Extract current and new passwords from request body

        // Check if currentPassword and newPassword are present in the request body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        // Find the user by userID
        const user = await User.findById(userId);

        // If user does not exist or password does not match, return error
        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        // Update the user's password
        user.password = newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/bharatvoter');
  });
  
function verifyToken(req, res, next) {
    const token = req.session.token;
    if (!token) return res.redirect('/user/login'); // Redirect if no token is found

    try {
        // Verify the token and decode it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user information to the request object
        req.user = decoded;

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('Token verification failed:', err);
        res.redirect('/user/login'); // Redirect if token verification fails
    }
}

module.exports = router; // Export only the router by default
module.exports.verifyToken = verifyToken; // Export verifyToken separately

// filepath: c:\Users\jaitl\Documents\ONLINE-VOTING-SYSTEM\Bharat-Voters\server.js

// const userRoutes = require('./routes/userRoutes'); // Import the router
// const { verifyToken } = require('./routes/userRoutes'); // Import verifyToken separately