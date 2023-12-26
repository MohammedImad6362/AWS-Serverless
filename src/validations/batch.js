const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createBatch = Joi.object({
    branchId: Joi.objectId().required(),
    name: Joi.string().required(),
    courseIds: Joi.array().items(Joi.objectId()),
    startDate: Joi.date().allow(''),
    endDate: Joi.date().allow(''),
    startTime: Joi.string().allow(''),
    endTime: Joi.string().allow(''),
    isActive: Joi.boolean().default(true),
    studentLimit: Joi.number().integer().required(),
    teachers: Joi.array().items(Joi.objectId()),
    published: Joi.array().items(Joi.string()),
});

const getSingleBatch = oi.object({
    branchId: Joi.objectId().required(),
    batchId: Joi.objectId().required()
})

const editBatch = Joi.object({
    name: Joi.string().required(),
    courseIds: Joi.array().items(Joi.objectId()),
    startDate: Joi.date().allow(''),
    endDate: Joi.date().allow(''),
    startTime: Joi.string().allow(''),
    endTime: Joi.string().allow(''),
    isActive: Joi.boolean().default(true),
    studentLimit: Joi.number().integer().required(),
    teachers: Joi.array().items(Joi.objectId()),
    published: Joi.array().items(Joi.string()),
});

module.exports = { createBatch, getSingleBatch, editBatch };