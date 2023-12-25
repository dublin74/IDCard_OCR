const mongoose = require('mongoose');
const OCRRecord = require('../models/OCRRecord');

const ocrController = {
  getAllRecords: async (req, res) => {
    try {
      const ocrRecords = await OCRRecord.find();
      return res.status(200).json({
        data: ocrRecords,
        success: true,
        message: 'Successfully retrieved OCR records',
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        data: null,
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  },

  createRecord: async (req, res) => {
    try {
      const ocrData = req.body;
      const identificationNumber = ocrData.identification_number;

      // Check if a record with the same identification number already exists
      const existingRecord = await OCRRecord.findOne({ identification_number: identificationNumber });

      if (existingRecord) {
        return res.status(409).json({
          data: existingRecord,
          success: false,
          message: 'Record with the same identification number already exists',
          error: null,
        });
      }

      // If no existing record, create and save the new OCR record
      const newOCRRecord = new OCRRecord(ocrData);
      const savedOCRRecord = await newOCRRecord.save();

      return res.status(201).json({
        data: savedOCRRecord,
        success: true,
        message: 'Successfully processed and added a record',
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        data: null,
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  },

  getRecordById: async (req, res) => {
    try {
      const { id } = req.params;
    let ocrRecord;
        if (mongoose.Types.ObjectId.isValid(id)) {
            ocrRecord = await OCRRecord.findById(id);
        } else {
            ocrRecord = await OCRRecord.find({
                $or: [
                    { 'identification_number': { $regex: id, $options: 'i' } },
                    { 'name': { $regex: id, $options: 'i' } },
                    { 'last_name': { $regex: id, $options: 'i' } }
                ]
            });
        }
      if (!ocrRecord || ocrRecord.length === 0) {
        return res.status(404).json({
          data: null,
          success: false,
          message: 'OCR record not found',
          error: null,
        });
      }
      return res.status(200).json({
        data: ocrRecord,
        success: true,
        message: 'Successfully retrieved OCR record by ID',
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        data: null,
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  },
    partialUpdateRecord: async (req, res) => {
        try {
            const { id } = req.params;
            const { date_of_birth, date_of_issue, date_of_expiry, ...otherFields } = req.body;

            const formatDate = (dateString) => {
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
                const year = date.getFullYear();

                return `${day}/${month}/${year}`;
            };

            const updatedData = {
                ...otherFields,
                date_of_birth: date_of_birth ? formatDate(date_of_birth) : undefined,
                date_of_issue: date_of_issue ? formatDate(date_of_issue) : undefined,
                date_of_expiry: date_of_expiry ? formatDate(date_of_expiry) : undefined
            };

            const updatedOCRRecord = await OCRRecord.findByIdAndUpdate(
                id,
                { $set: updatedData },
                { new: true }
            );

            if (!updatedOCRRecord) {
                return res.status(404).json({
                    data: null,
                    success: false,
                    message: 'OCR record not found for partial update',
                    error: null,
                });
            }

            return res.status(200).json({
                data: updatedOCRRecord,
                success: true,
                message: 'Successfully partially updated OCR record',
                error: null,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                data: null,
                success: false,
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    },

  deleteRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedOCRRecord = await OCRRecord.findByIdAndUpdate(
        id,
        { $set: { deleted: true } },
        { new: true }
      );
      if (!deletedOCRRecord) {
        return res.status(404).json({
          data: null,
          success: false,
          message: 'OCR record not found for deletion',
          error: null,
        });
      }
      return res.status(200).json({
        data: deletedOCRRecord,
        success: true,
        message: 'Successfully deleted OCR record',
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        data: null,
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  },
};

module.exports = ocrController;


