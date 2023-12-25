const mongoose = require('mongoose');

const ocrRecordSchema = new mongoose.Schema({
    identification_number: String,
    name: String,
    last_name: String,
    date_of_birth: String,
    date_of_issue: String,
    date_of_expiry: String,
    timestamp: { type: Date, default: Date.now },
    status: String,
    deleted: { type: Boolean, default: false },
    errorMessage: [String],
});

const OCRRecord = mongoose.model('OCRRecord', ocrRecordSchema);

module.exports = OCRRecord;
