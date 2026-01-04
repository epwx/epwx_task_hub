import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
const router = express.Router();

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(path.resolve(), 'swagger.json'), 'utf8'));

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
