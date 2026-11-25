import { prisma } from '../config/database.js';
import { GetUsersQueryInput } from '../schemas/user.schema.js';
import { User, Prisma } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  // async create(data: Prisma.UserCreateInput): Promise<User> {
  //   return prisma.user.create({ data });
  // }
  async create(data: Prisma.UserCreateInput): Promise<User> {
    // If 'email' is already taken, Prisma automatically throws PrismaClientKnownRequestError (P2002)
    return prisma.user.create({ data });
  }

  async findMany(query: GetUsersQueryInput): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    const skip = (query.page - 1) * query.limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }
}

export const userRepository = new UserRepository();

/*
// ❌ WITHOUT REPOSITORY (Inside user.service.ts)
export class UserService {
  async registerUser(data: CreateUserInput) {
    // Service is tightly coupled to Prisma's specific API
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError("Email in use");

    return prisma.user.create({ data });
  }
}
*/ 