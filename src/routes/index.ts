import { Router } from 'express';
import userRoutes from './user.routes.js';
// import authRoutes from './auth.routes';

export const apiRouter = Router();

// Mount feature routers
apiRouter.use('/users', userRoutes);
// apiRouter.use('/auth', authRoutes);

export default apiRouter;