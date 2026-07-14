// Backend/src/__tests__/validation.test.js
const { validateRegistration, validateLogin } = require('../middleware/validation');

describe('Validation Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    test('should pass validation for valid registration data', () => {
        mockReq.body = {
            email: 'test@example.com',
            password: 'password123',
            name: 'John Doe'
        };

        validateRegistration(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should fail validation if email is invalid', () => {
        mockReq.body = {
            email: 'notanemail',
            password: 'password123',
            name: 'John Doe'
        };

        validateRegistration(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Validation failed'
            })
        );
    });

    test('should fail validation if password is too short', () => {
        mockReq.body = {
            email: 'test@example.com',
            password: '123',
            name: 'John Doe'
        };

        validateRegistration(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should pass validation for valid login data', () => {
        mockReq.body = {
            email: 'test@example.com',
            password: 'password123'
        };

        validateLogin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });
});
