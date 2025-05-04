const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Middleware to verify admin role
function verifyAdmin(req, res, next) {
    const token = req.session.token;
    if (!token) return res.redirect('/user/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).send('Access denied. Admins only.');
        }
        req.user = decoded;
        next();
    } catch (err) {
        console.error(err);
        res.redirect('/user/login');
    }
}

// Admin dashboard
router.get('/dashboard', verifyAdmin, async (req, res) => {
    try {
        const candidates = await Candidate.find(); // Fetch all candidates
        res.render('admin_dashboard', { candidates }); // Render admin dashboard
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Add candidate
router.post('/add-candidate', verifyAdmin, async (req, res) => {
    try {
        const { name, party, age } = req.body;
        const newCandidate = new Candidate({ name, party, age });
        await newCandidate.save();
        console.log('Candidate added successfully');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;