const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const createBranch = Joi.object({
  instituteId: Joi.objectId().required(),
  name: Joi.string().required(),
  logo: Joi.string().allow(''),
  address: Joi.string().allow(''),
  area: Joi.string().allow(''),
  city: Joi.string().allow(''),
  state: Joi.string().allow(''),
  pincode: Joi.number().integer().allow(''),
  contactNo: Joi.number().integer().allow(''),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date().required(),
  batchStudentLimit: Joi.number().integer().required(),
  studentLimit: Joi.number().integer().required(),
  teacherLimit: Joi.number().integer().required(),
  nonTeacherLimit: Joi.number().integer().required(),
  courseIds: Joi.array().items(Joi.objectId()),
});

const getSingleBranch = Joi.object({
  instituteId: Joi.objectId().required(),
  branchId: Joi.objectId().required(),
})

const editBranch = Joi.object({
  name: Joi.string().allow(''),
  logo: Joi.string().allow(''),
  address: Joi.string().allow(''),
  area: Joi.string().allow(''),
  city: Joi.string().allow(''),
  state: Joi.string().allow(''),
  pincode: Joi.number().integer().allow(''),
  contactNo: Joi.number().integer().allow(''),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date().allow(''),
  batchStudentLimit: Joi.number().integer().allow(''),
  studentLimit: Joi.number().integer().allow(''),
  teacherLimit: Joi.number().integer().allow(''),
  nonTeacherLimit: Joi.number().integer().allow(''),
  courseIds: Joi.array().items(Joi.objectId()),
});

module.exports = {createBranch, getSingleBranch, editBranch};