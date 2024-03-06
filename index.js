const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const volumePath = '/kita';

const passwordsFilePath = path.join(__dirname, 'passwords.json');

// Load passwords from the JSON file on server start
let passwords = loadPasswords();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.set('view engine', 'ejs'); // Set EJS as the view engine


const lettersFilePath = path.join(volumePath, 'letters.json');

// Load letters from the JSON file on server start
let letters = loadLetters();

function loadLetters() {
    try {
        const data = fs.readFileSync(lettersFilePath, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, create an empty file
            fs.writeFileSync(lettersFilePath, '{}', 'utf8');
            console.log('Letters file created successfully.');
            return {};
        } else {
            console.error('Error loading letters:', error.message);
            return {};
        }
    }
}


function saveLetters() {
    try {
        const data = JSON.stringify(letters, null, 2);
        fs.writeFileSync(lettersFilePath, data, 'utf8');
    }
    catch (error) {
        console.error('Error saving letters:', error.message);
    }
}

function loadPasswords() {
    try {
        const data = fs.readFileSync(passwordsFilePath, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading passwords:', error.message);
        return {};
    }
}

//Load letters based on recipient name
function loadLettersByRecipient(recipientName) {
    try {
        const data = fs.readFileSync(lettersFilePath, 'utf8');
        const lettersData = JSON.parse(data) || {};

        return lettersData[recipientName] || [];
    } catch (error) {
        console.error('Error loading letters:', error.message);
        return [];
    }
}

// Add a function to authenticate users based on passwords.json
function authenticateUser(username, password) {
    try {
        const data = fs.readFileSync(passwordsFilePath, 'utf8');
        const passwordsData = JSON.parse(data) || {};

        return passwordsData[username] === password;
    } catch (error) {
        console.error('Error authenticating user:', error.message);
        return false;
    }
}

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    // Perform your authentication check here
    // For example, you can check if the user is logged in based on a session or token
    // If authenticated, call next(), otherwise redirect to the login page
    // Example: Check if the user is authenticated based on a session variable
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    // Not authenticated, redirect to the login page
    res.redirect('/login');
}

app.get('/letters/:recipientName', isAuthenticated, (req, res) => {
    const recipientName = req.params.recipientName;
    const recipientLetters = loadLettersByRecipient(recipientName);

    // Check if recipientName exists in passwords.json
    if (passwords[recipientName]) {
        // User is authenticated, render the letters
        res.render('letters', { recipientName, letters: recipientLetters });
    } else {
        // No password protection for this recipient, render the letters
        res.render('letters', { recipientName, letters: recipientLetters });
    }
});

app.get('/login', (req, res) => {
    // Get the list of usernames from passwords.json
    const usernameList = Object.keys(passwords);

    // Render the login page with the list of usernames
    res.render('login', { usernameList, error: '' });
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const usernameList = Object.keys(passwords);


    // Authenticate the user
    if (authenticateUser(username, password)) {
        // Get recipientName associated with the username from passwords.json

        // Set a session variable to indicate authentication and store recipientName
        req.session.isAuthenticated = true;
        req.session.recipientName = username;

        // Redirect to the letters route for the authenticated user
        return res.redirect(`/letters/${username}`);
    } else {
        // Authentication failed, render the login page with an error message
        res.render('login', { usernameList, error: 'Password salah, gunakan nomor HP saat mendaftar rekoleksi!' });

    }
});


app.get('/', (req, res) => {
    const dynamicRecipientName = '';
    const isEditable = true;

    // Pass the password list to the template
    res.render('index', { submissionConfirmed: false, dynamicRecipientName, isEditable, passwordList: Object.keys(passwords) });
});

app.post('/submit-letter', (req, res) => {
    const senderName = req.body.senderName;
    const recipientName = req.body.recipientName;
    const letter = req.body.letter;

    if (!letters[recipientName]) {
        letters[recipientName] = [];
    }

    letters[recipientName].push({ senderName, letter });
    saveLetters();

    // Pass the password list to the template
    res.render('index', { submissionConfirmed: true, passwordList: Object.keys(passwords) });
});

// app.get('/:recipientName?', (req, res) => {
//     const recipientName = req.params.recipientName || '';
//     const dynamicRecipientName = recipientName;
//     const isEditable = req.path === '/' || !recipientName;

//     // Pass the password list to the template
//     res.render('index', { submissionConfirmed: false, dynamicRecipientName, isEditable, passwordList: Object.keys(passwords) });
// });

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
