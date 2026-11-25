import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { CreateUserInput, GetUsersQueryInput } from '../schemas/user.schema.js';
import { AppError } from '../core/errors/app-errors.js';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';

export class UserService {
  constructor(private userRepo: UserRepository = userRepository) {}

  async registerUser(input: CreateUserInput): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.userRepo.create({
      ...input,
      password: hashedPassword,
    });

    const { password: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async getUsers(query: GetUsersQueryInput) {
    const { users, total } = await this.userRepo.findMany(query);

    return {
      items: users,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}

export const userService = new UserService();