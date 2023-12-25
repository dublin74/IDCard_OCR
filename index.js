const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const ocrRoutes = require('./routes/ocrRoutes.js'); // routing
const OCRRecord = require('./models/OCRRecord.js'); // model
const ocrController = require('./controllers/orcControllers.js'); // controller

const vision = require('@google-cloud/vision');
// const client = new vision.ImageAnnotatorClient();

let base64String = process.env.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY;
let decodedString = Buffer.from(base64String, 'base64').toString('utf8');
const config = {
    credentials: {
        private_key: decodedString.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_APPLICATION_CREDENTIALS_CLIENT_ID
    },
}

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/users', ocrRoutes);

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        cb(null, true); // Allow all files to pass the filter
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // Set the file size limit to 2MB
    }
});


app.get('/', (req, res) => {
    res.render('home', { alert: null });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.post('/upload', upload.single('filename'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(req.file);

        const ext = req.file.originalname.split('.').pop();
        if (!['png', 'jpg', 'jpeg'].includes(ext.toLowerCase())) {
            return res.render('home', { alert: 'Invalid file type. Only .png, .jpg, and .jpeg are allowed' });
        }

        if (req.file.size > 2 * 1024 * 1024) {
            return res.render('home', { alert: 'File size limit exceeded' });
        }

        const client = new vision.ImageAnnotatorClient(
            config
        );

        const request = {
            image: { content: req.file.buffer.toString('base64') },
            imageContext: {
                languageHints: ["en"], // ENGLISH OCR IS ONLY NEEDED
            },
        };

        const [result] = await client.documentTextDetection(request);

        const detections = result.fullTextAnnotation.text;

        const data = parseOCRResult(detections);

        // Save OCR data to the database
        // const ocrRecord = new OCRRecord(data);
        // await ocrRecord.save();
        if (data.status === 'not_id_card') {
            res.render('home', { alert: data.errorMessage[0] });
        }
        else{
            if (data.status === 'success' || data.status === 'error') {
                try {
                    await axios.post('https://thaiidcardocr.onrender.com/users', data); // routing
                    res.render('response', { ocrResult: data });
                } catch (error) {
                    console.error(error);
                    res.render('home', { alert: error.response.data.message });
                }
            }
            
    
            // await axios.post('http://localhost:3000/users', data); // routing
    
            res.render('response', { ocrResult: data });
        }
        
    } catch (error) {
        console.error(error);
        res.render('home', { alert: error.response.data.message });
        // res.redirect('/'); // Redirect to the home page
    }
},(error, req, res, next) => {
    // This function will be called if an error occurred during the file upload process
    if (error instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if (error.code === 'LIMIT_FILE_SIZE') {
            res.render('home', { alert: 'File size limit exceeded' });
        } else {
            res.render('home', { alert: 'An error occurred while uploading the file' });
        }
    } else if (error.message === 'Invalid file type') {
        // The fileFilter function returned an error
        res.render('home', { alert: 'Invalid file type. Only .png, .jpg, and .jpeg are allowed' });
    } else {
        // An unknown error occurred when uploading.    
        res.render('home', { alert: 'An unknown error occurred' });
    }
});

const parseOCRResult = (rawText) => {
    console.log('Text:');
    console.log(rawText);
    
    if (!rawText.includes('Thai National ID Card')) {
        return {
            status: 'not_id_card',
            errorMessage: ['The image is not a Thai National ID Card.']
        };
    }

    let data = {
        identification_number: '',
        name: '',
        last_name: '',
        date_of_birth: '',
        date_of_issue: '',
        date_of_expiry: '',
        errorMessage: [],
        status: 'success'
    };

    const idNumberRegex = /(\d \d{4} \d{5} \d{2} \d)/;
    const idNumberMatch = rawText.match(idNumberRegex);

    if (idNumberMatch) {
        data.identification_number = idNumberMatch[0];
    } else {
        console.log('Identification number not found');
        data.errorMessage.push('Identification number not found');
        data.status = 'error';
    }

    const lines = rawText.split('\n');
    let potentialDate = '';

    for (const line of lines) {
        if (line.startsWith('Name')) {
            data.name = line.split(' ').slice(1).join(' ');
        } 
        else if (line.startsWith('Last name') || line.startsWith('Last Name')) {
            data.last_name = line.split(' ').slice(2).join(' ');
        }
        else if (line.startsWith('Date of Birth')) {
            const dob = line.split(' ').slice(3).join(' ');
            const dobWithoutPeriod = dob.replace('.', '');
            const date = new Date(dobWithoutPeriod);
            data.date_of_birth = date.toLocaleDateString('en-GB');
        }
        else if (line === 'Date of Issue') {
            const doiWithoutPeriod = potentialDate.replace('.', '');
            const date = new Date(doiWithoutPeriod);
            data.date_of_issue = date.toLocaleDateString('en-GB');
        } 
        else if (line === 'Date of Expiry') {
            const doeWithoutPeriod = potentialDate.replace('.', '');
            const date = new Date(doeWithoutPeriod);
            data.date_of_expiry = date.toLocaleDateString('en-GB');
        }

        potentialDate = line.trim();
    }

    if (!data.name) {
        console.log('Name not found');
        data.errorMessage.push('Name not found. Please upload a clearer image.');
        data.status = 'error';
    }

    if (!data.last_name) {
        console.log('Last name not found');
        data.errorMessage.push('Last name not found. Please upload a clearer image.');
        data.status = 'error';
    }

    if (!data.date_of_birth) {
        console.log('Date of birth not found');
        data.errorMessage.push('Date of birth not found. Please upload a clearer image.');
        data.status = 'error';
    }

    if (!data.date_of_issue) {
        console.log('Date of issue not found');
        data.errorMessage.push('Date of issue not found. Please upload a clearer image.');
        data.status = 'error';
    }

    if (!data.date_of_expiry) {
        console.log('Date of expiry not found');
        data.errorMessage.push('Date of expiry not found. Please upload a clearer image.');
        data.status = 'error';
    }

    if (data.status === 'error' && data.errorMessage.length === 6 && data.errorMessage[0] === 'Identification number not found') {
        console.log('No fields detected');
        data = {
            errorMessage: ['No fields detected. Please upload a clearer image.']
        };
        data.status = 'failure';
    }

    console.log('Data:');
    console.log(data);
    return data;
};


app.get('/view', async (req, res) => {
    try {
        // Fetch all OCR records
        const ocrRecords = await OCRRecord.find();
        res.render('view', { ocrRecords: ocrRecords });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
