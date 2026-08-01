const Joi = require('joi');

// In development mode, accept both UUIDs and simple numeric IDs
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const idPattern = isDev ? Joi.string().required() : Joi.string().uuid().required();

const optionalIdPattern = isDev ? Joi.string().optional() : Joi.string().uuid().optional();

const schemas = {
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        name: Joi.string().min(2).max(100).required()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    createBoard: Joi.object({
        name: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(500),
        background_color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/)
    }),
    createList: Joi.object({
        board_id: idPattern,
        title: Joi.string().min(1).max(255).required(),
        position: Joi.number().integer().min(0)
    }),
    createCard: Joi.object({
        list_id: idPattern,
        title: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(1000),
        position: Joi.number().integer().min(0),
        due_date: Joi.date().iso(),
        assigned_to: optionalIdPattern
    })
};

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schemas[schema].validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        next();
    };
};

module.exports = {
    validateRegistration: validate('register'),
    validateLogin: validate('login'),
    validateCreateBoard: validate('createBoard'),
    validateCreateList: validate('createList'),
    validateCreateCard: validate('createCard')
};