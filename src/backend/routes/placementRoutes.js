const express = require('express');
const router = express.Router();
const {
    createPlacement,
    getPlacements,
    getApplications,
    updateApplicationStatus
} = require('../controllers/placementController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createPlacement);
router.get('/', getPlacements);
router.get('/:placement_id/applications', getApplications);
router.put('/applications/status', updateApplicationStatus);

module.exports = router;