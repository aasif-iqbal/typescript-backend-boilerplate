import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, getUsersQuerySchema } from '../schemas/user.schema.js';
import { registerUserController, getUsersController } from '../controllers/user.controller.js';

const router = Router();

router.post('/', validate(createUserSchema), registerUserController);
router.get('/', validate(getUsersQuerySchema), getUsersController);

export default router;