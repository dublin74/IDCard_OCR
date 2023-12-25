const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/orcControllers');

router.get('/', ocrController.getAllRecords);
router.post('/', ocrController.createRecord);
router.get('/:id', ocrController.getRecordById);
router.patch('/:id', ocrController.partialUpdateRecord);
router.delete('/:id', ocrController.deleteRecord);

module.exports = router;