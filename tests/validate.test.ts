import { describe, expect, it, vi } from 'vitest';
import { validate } from '../src/middlewares/validate.js';
import {
  createUserSchema,
  getUsersQuerySchema,
} from '../src/schemas/user.schema.js';

describe('validate middleware', () => {
  it('accepts the Express request shape for the create-user schema', () => {
    const req = {
      body: {
        email: 'ada@example.com',
        password: 'supersecret',
        name: 'Ada Lovelace',
      },
      params: {},
      query: {},
    } as any;
    const res = {} as any;
    const next = vi.fn();

    validate(createUserSchema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({
      email: 'ada@example.com',
      password: 'supersecret',
      name: 'Ada Lovelace',
    });
  });

  it('accepts query params for the get-users route schema without throwing on getter-only query', () => {
    const req = {} as any;
    Object.defineProperty(req, 'query', {
      get: () => ({ page: '2', limit: '25' }),
      configurable: true,
    });
    Object.defineProperty(req, 'params', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(req, 'body', {
      value: {},
      writable: true,
      configurable: true,
    });

    const res = {} as any;
    const next = vi.fn();

    expect(() => validate(getUsersQuerySchema)(req, res, next)).not.toThrow();
    expect(req.query).toEqual({
      page: 2,
      limit: 25,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
