import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../auth';

jest.mock('jsonwebtoken');

describe('Auth Utils', () => {
  const mockUser = { userId: 'user-123', email: 'test@test.com', role: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a token with correct payload', () => {
      (jwt.sign as jest.Mock).mockReturnValue('mock-access-token');
      const token = generateAccessToken(mockUser);
      expect(token).toBe('mock-access-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.userId, email: mockUser.email, role: mockUser.role },
        expect.any(String),
        { expiresIn: 900 },
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      (jwt.sign as jest.Mock).mockReturnValue('mock-refresh-token');
      const token = generateRefreshToken({ userId: mockUser.userId });
      expect(token).toBe('mock-refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.userId },
        expect.any(String),
        { expiresIn: 604800 },
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should return decoded payload for valid token', () => {
      const decoded = { userId: 'user-123', email: 'test@test.com', role: 'admin', iat: 1, exp: 9999999999 };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      const result = verifyAccessToken('valid-token');
      expect(result).toEqual(decoded);
    });

    it('should throw for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('jwt malformed'); });
      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
    });
  });
});
