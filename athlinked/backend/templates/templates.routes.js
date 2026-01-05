const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const templatesController = require('./templates.controller');
const upload = require('../utils/upload-resources');

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create a new template
 *     description: Upload and create a new template resource
 *     tags: [Templates]
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Template Title"
 *               description:
 *                 type: string
 *                 example: "Template description"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Template file
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 template:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  templatesController.createTemplate
);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all active templates
 *     description: Retrieve all active templates
 *     tags: [Templates]
 *     security: []
 *     parameters:
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
 *         description: Number of templates per page
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', templatesController.getAllTemplates);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     description: Soft delete a template (set is_active = false)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
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
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, templatesController.deleteTemplate);

module.exports = router;
