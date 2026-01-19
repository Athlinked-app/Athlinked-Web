const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const resourcesController = require('./resources.controller');
const { upload, uploadToS3Middleware } = require('../utils/upload-resources');

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Create a new resource
 *     description: Upload and create a new resource (article, video, or template)
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - resource_type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Resource Title"
 *               description:
 *                 type: string
 *                 example: "Resource description"
 *               resource_type:
 *                 type: string
 *                 enum: [article, video, template]
 *                 example: "article"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Resource file
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 resource:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.',
      });
    }
    if (err.message) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.toString(),
    });
  }
  next();
};

router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  handleMulterError,
  uploadToS3Middleware,
  resourcesController.createResource
);

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all active resources
 *     description: Retrieve all active resources, optionally filtered by type
 *     tags: [Resources]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [article, video, template]
 *         description: Filter by resource type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of resources per page
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 resources:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', resourcesController.getAllResources);

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     description: Soft delete a resource (set is_active = false)
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, resourcesController.deleteResource);

module.exports = router;
