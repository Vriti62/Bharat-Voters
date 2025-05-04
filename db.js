const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();
const Candidate = require('./models/candidate'); // Import the Candidate model
const router = express.Router();
// Define the MongoDB connection URL
const mongoURL = process.env.MONGODB_URL_LOCAL;

// Set up MongoDB connection
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Get the default connection
const db = mongoose.connection;

// Define event listeners for database connection
db.on('connected', () => {
    console.log('Connected to MongoDB server');
});

db.on('error', (err) => {
    
    console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Function to create admin user
const createAdminUser = async () => {
    const User = require('./models/user');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        const admin = new User({
            name: 'Admin',
            age: 30,
            email: 'admin@example.com',
            address: 'Admin Address',
            aadharCardNumber: 123456789012,
            password: 'adminpassword',
            role: 'admin',
        });
        await admin.save();
        console.log('Admin user created');
    }
};

// Function to add hard-coded candidates
const addCandidates = async () => {
    const candidates = [
        { name: 'Narendra Modi', party: 'BJP', age: 71 },
        { name: 'Rahul Gandhi', party: 'INC', age: 51 },
        { name: 'Arvind Kejriwal', party: 'AAP', age: 53 },
        { name: 'Mamata Banerjee', party: 'AITC', age: 67 },
        { name: 'Yogi Adityanath', party: 'BJP', age: 49 }
    ];

    for (const candidate of candidates) {
        const exists = await Candidate.findOne({ name: candidate.name });
        if (!exists) {
            await Candidate.create(candidate);
            console.log(`Candidate ${candidate.name} added to the database`);
        }
    }
};

// Initialize the database with admin and candidates
const initializeDatabase = async () => {
    await createAdminUser();
    await addCandidates();
};

initializeDatabase();

module.exports = db;

// filepath: c:\Users\jaitl\Documents\ONLINE-VOTING-SYSTEM\Bharat-Voters\routes\candidateRoutes.js

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
router.post('/vote/candidates', verifyToken, async (req, res) => {
    const { name, aadharCardNumber } = req.body;

    try {
        const candidate = await Candidate.findOne({ name });
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }

        const user = await User.findOne({ aadharCardNumber });
        if (!user) {
            return res.send("User not found! Please Register to vote || कृपया वोट करने के लिए पंजीकरण करें !");
        }

        if (user.role === 'admin') {
            return res.send("Admin is not allowed !! || व्यवस्थापक को अनुमति नहीं है !!");
        }

        if (user.isVoted) {
            return res.send("You have already voted || आप पहले ही वोट कर चुके हैं");
        }

        candidate.voteCount++;
        await candidate.save();

        user.isVoted = true;
        await user.save();

        res.redirect('/candidate/vote/candidates/Success');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

