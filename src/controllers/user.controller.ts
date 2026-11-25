import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { CreateUserInput, GetUsersQueryInput } from '../schemas/user.schema.js';

export const registerUserController = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

type ValidatedGetUsersRequest = Request<{}, {}, {}, Record<string, unknown>> & {
  validated?: {
    query?: GetUsersQueryInput;
  };
};

export const getUsersController = async (
  req: ValidatedGetUsersRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // const query = req.query as GetUsersQueryInput;
    const query = req.validated?.query ?? { page: 1, limit: 10 };
    const result = await userService.getUsers(query);
    res.status(200).json({
      status: 'success',
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};