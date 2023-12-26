const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createInstitute = Joi.object({
  name: Joi.string().required(),
  logo: Joi.string().allow(''),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date().required(),
  courseIds: Joi.array().items(Joi.objectId()),
  branchStudentLimit: Joi.number().integer().required(),
  branchTeacherLimit: Joi.number().integer().required(),
  branchNonTeacherLimit: Joi.number().integer().required(),
  studentLimit: Joi.number().integer().required(),
  teacherLimit: Joi.number().integer().required(),
  nonTeacherLimit: Joi.number().integer().required(),
});

const getSingleInstitute = Joi.object({
  instituteId: Joi.objectId().required(),
})

const editInstitute = Joi.object({
  name: Joi.string().allow(''),
  logo: Joi.string().allow(''),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date().allow(''),
  courseIds: Joi.array().items(Joi.objectId()),
  branchStudentLimit: Joi.number().integer().allow(''),
  branchTeacherLimit: Joi.number().integer().allow(''),
  branchNonTeacherLimit: Joi.number().integer().allow(''),
  studentLimit: Joi.number().integer().allow(''),
  teacherLimit: Joi.number().integer().allow(''),
  nonTeacherLimit: Joi.number().integer().allow(''),
});

module.exports = {createInstitute, getSingleInstitute, editInstitute};