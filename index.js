const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const passwordsFilePath = path.join(__dirname, 'passwords.json');

// Load passwords from the JSON file on server start
let passwords = loadPasswords();

app.use(express.static('public'));

function loadPasswords() {
    try {
        const data = fs.readFileSync(passwordsFilePath, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading passwords:', error.message);
        return {};
    }
}

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const lettersFilePath = path.join(__dirname, 'letters.json');

// Load letters from the JSON file on server start
let letters = loadLetters();

function loadLetters() {
    try {
        const data = fs.readFileSync(lettersFilePath, 'utf8');

        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading letters:', error.message);

        //if no such file exists, create file
        fs.writeFileSync(lettersFilePath, '{}', 'utf8');

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

function saveLetters() {
    try {
        const data = JSON.stringify(letters, null, 2);
        fs.writeFileSync(lettersFilePath, data, 'utf8');
    } catch (error) {
        console.error('Error saving letters:', error.message);
    }
}

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

app.get('/letters/:recipientName', (req, res) => {
    const recipientName = req.params.recipientName;
    const recipientLetters = loadLettersByRecipient(recipientName);

    // Check if recipientName exists in passwords.json
    if (passwords[recipientName]) {
        // Password protection logic
        const enteredPassword = req.query.password; // Assuming the password is sent as a query parameter

        if (enteredPassword === passwords[recipientName]) {
            // Password is correct, render the letters
            res.render('letters', { recipientName, letters: recipientLetters });
        } else {
            // Password is incorrect, render the password error page
            res.render('password-error');
        }
    } else {
        // No password protection for this recipient, render the letters
        res.render('letters', { recipientName, letters: recipientLetters });
    }
});

app.get('/:recipientName?', (req, res) => {
    const recipientName = req.params.recipientName || '';
    const dynamicRecipientName = recipientName;
    const isEditable = req.path === '/' || !recipientName;

    // Pass the password list to the template
    res.render('index', { submissionConfirmed: false, dynamicRecipientName, isEditable, passwordList: Object.keys(passwords) });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
