const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Candidate = require('../models/candidate');

// route to Candidates
router.get('/home',  verifyToken , async (req, res) => {
    try {
        const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        res.render('loggedhome', { user });
      } catch (err) {
        console.error(err);
        res.redirect('/user/login');
      }
  });

const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        if (user && user.role === 'admin') {
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error in checkAdminRole:', err);
        return false;
    }
};

// POST route to add a candidate

router.get('/registration', verifyToken, async (req, res) => {
    try {
        const isAdmin = await checkAdminRole(req.user.userId); // Use `req.user.userId` from the middleware
        if (!isAdmin) {
            return res.status(403).json({ message: 'user does not have admin role' });
        }
        res.render('candidater_registration', { user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/registration', verifyToken, async (req, res) =>{
    try{
        
            const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
            const userId = '6633c5d85d4be76438e5a91c';
            
        if(!(await checkAdminRole(userId)))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body // Assuming the request body contains the candidate data

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.render('candidate_reg_done', { response });
        // res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateID', verifyToken, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', verifyToken, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// let's  vote
router.get('/vote/candidates/Success',  (req, res) => {
    res.render('Vote_success');
  }); 
router.get('/vote/candidates', verifyToken, async (req, res) => {
    res.render('cand_vote', { candidates }); // Voting page
});   

router.post('/vote/candidates', verifyToken, async (req, res)=>{
    // no admin can vote
    // user can only vote once

    const {name} = req.body;
    const {aadharCardNumber} = req.body;
    try{
        // Find the Candidate document with the specified candidateID
        const candidate = await Candidate.findOne({name});
        console.log("Candidate id ", candidate);
        if(!candidate){
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.find({aadharCardNumber: aadharCardNumber});
        console.log(user);
        if(!user){
            res.send("User not found!   Please Register to vote || कृपया वोट करने के लिए पंजीकरण करें ! ")
            // return res.status(404).json({ message: 'user not found' });
        }
        if(user.role == 'admin'){
            res.send("Admin is not allowed !! || व्यवस्थापक को अनुमति नहीं है !!")
            // return res.status(403).json({ message: 'admin is not allowed'});    
        }
        if(user.isVoted){
            res.send("You have already voted || आप पहले ही वोट कर चुके हैं")
            // return res.status(400).json({ message: 'You have already voted' });
        }

        // Update the Candidate document to record the vote
        // candidate.votes.push({user: userId})
        candidate.voteCount++;  
        await candidate.save(); 

        // update the user document
        user.isVoted = true;
        await user.save();
        // return res.status(200).json({ message: 'Vote recorded successfully' });
    }catch(err){
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});


// vote count 
router.get('/vote/count', async (req, res) => {
    try{
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount   
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// Get List of all candidates with only name and party fields
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const candidates = await Candidate.find({}, { name: 1, party: 1, age: 1, voteCount: 1 }); // Fetch candidates with specific fields
        res.render('candidates', { candidates, user: req.user }); // Pass candidates and user to the view
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Voter dashboard
router.get('/bharatvoter', verifyToken, async (req, res) => {
    res.render('logouthome'); // Render voter dashboard
});

router.post('/vote/candidates', verifyToken, async (req, res) => {
    const { name, aadharCardNumber } = req.body;

    try {
        // 1. Find the candidate by name
        const candidate = await Candidate.findOne({ name });
        if (!candidate) {
            return res.status(404).send("Candidate not found");
        }

        // 2. Find the user by Aadhar card number
        const user = await User.findOne({ aadharCardNumber });
        if (!user) {
            return res.send("User not found! Please Register to vote || कृपया वोट करने के लिए पंजीकरण करें !");
        }

        // 3. Prevent admin from voting
        if (user.role === 'admin') {
            return res.send("Admin is not allowed !! || व्यवस्थापक को अनुमति नहीं है !!");
        }

        // 4. Prevent duplicate votes
        if (user.isVoted) {
            return res.send("You have already voted || आप पहले ही वोट कर चुके हैं");
        }

        // 5. Record the vote
        candidate.voteCount++;
        candidate.votes.push({ user: user._id }); // optional: record who voted
        await candidate.save();

        // 6. Mark user as voted
        user.isVoted = true;
        await user.save();

        // 7. Redirect to success page
        res.redirect('/vote/candidates/Success');
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

function verifyToken(req, res, next) {
    const token = req.session.token;
    if (!token) return res.redirect('/user/login'); // Redirect if no token is found

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded user information to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('Token verification failed:', err);
        res.redirect('/user/login'); // Redirect if token verification fails
    }
}

module.exports = router;