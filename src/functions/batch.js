const { connectToDatabase } = require("../utils/db.js");
const Batch = require('../models/Batch.js');
const Branch = require('../models/Branch.js');
const { createBatch, getSingleBatch, editBatch } = require('../validations/branch.js');

module.exports.createHandler = async (event, context) => {
    const reqBody = JSON.parse(event.body);

    const batchSchemaValidation = () => {
        const { error } = createBatch.validate(reqBody);
        console.log("reqBody", reqBody);
        if (error) {
            console.log("valErr", error);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: error.details[0].message }),
            };
        }
        return null;
    };

    try {
        await connectToDatabase();

        const schemaValidationResult = batchSchemaValidation();
        if (schemaValidationResult) {
            return schemaValidationResult;
        }

        const existBranch = await Branch.findOne({ _id: reqBody.branchId, deleted: false });

        if (!existBranch) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Branch not found with this id' }),
            };
        }

        const batchData = new Batch({
            branchId: reqBody.branchId,
            name: reqBody.name,
            courseIds: reqBody.courseIds,
            startDate: reqBody.startDate,
            endDate: reqBody.endDate,
            startTime: reqBody.startTime,
            endTime: reqBody.endTime,
            isActive: reqBody.isActive,
            studentLimit: reqBody.studentLimit,
        });

        await batchData.save();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Batch Added Successfully" }),
        };
    } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Batch name must be unique." }),
            };
        }
        console.log("err", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};

module.exports.getAllHandler = async (event, context) => {
    try {
        await connectToDatabase();
        console.log("Connected");

        const branchId = event.pathParameters.branchId;
        const { error: idError } = getSingleBatch.validate({ branchId })

        if (idError) {
            console.log('ValErr', idError);
            return {
                statusCode: 400,
                message: idError.details[0].message,
            };
        }

        const existBranch = await Branch.findOne({ _id: branchId, deleted: false })
        if (!existBranch) {
            console.log("bad request-branch")
            return {
                statusCode: 404,
                message: 'Branch not found with this id'
            }
        }

        const startPage = 1;
        const minLimit = 10;

        const reqBody = JSON.parse(event.body)

        const page = reqBody.page || startPage;
        const limit = reqBody.limit || minLimit;

        const skip = (page - 1) * limit;

        const batchData = await Batch.find({ deleted: false }).select('-createdAt -updatedAt -deleted').skip(skip).limit(limit);

        console.log("data", batchData);

        const responseBody = JSON.stringify({
            data: batchData,
            page: page,
            limit: limit
        });

        return {
            statusCode: 200,
            body: responseBody,
            headers: {
                'Content-Type': 'application/json',
            },
        };
    } catch (err) {
        console.error("Error in getAllHandler:", err);
        const errorBody = JSON.stringify({
            message: "Internal Server Error"
        });

        return {
            statusCode: 500,
            body: errorBody,
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }
};

module.exports.getSingleHandler = async (event) => {
    try {

        await connectToDatabase();
        const branchId = event.pathParameters.branchId;
        const batchId = event.pathParameters.id;


        const { error: idError } = getSingleBatch.validate({ branchId, batchId })

        if (idError) {
            console.log('ValErr', idError);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            };
        }
        const existBranch = await Branch.findOne({ _id: branchId, deleted: false })
        if (!existBranch) {
            console.log("bad request-branch")
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Branch not found with this id' })
            }
        }

        const batchData = await Batch.findOne({ _id: batchId, deleted: false }).select('-createdAt -updatedAt -deleted');
        if (!batchData) {
            console.log("bad request-branch")
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Batch not found with this id' })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ data: batchData }),
        };
    } catch (error) {
        console.error('Error getting batch:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error getting batch' }),
        };
    }
};

module.exports.editHandler = async (event) => {
    try {

        let branchId = event.pathParameters.branchId;
        let batchId = event.pathParameters.id;

        const { error: idError } = getSingleBatch.validate({ branchId, batchId })

        if (idError) {
            console.log("valErr", idError);
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message })
            })
        }

        const reqBody = JSON.parse(event.body);

        const { error } = editBatch.validate(reqBody);
        if (error) {
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: error.details[0].message }),
            });
        }

        const existBranch = await Branch.findOne({ _id: branchId, deleted: false })
        if (!existBranch) {
            console.log("bad request-branch");
            return response({
                statusCode: 404,
                body: JSON.stringify({ message: 'Branch not found with this id' })
            })
        }


        const updateBatch = await Batch.findByIdAndUpdate({ _id: batchId, deleted: false },
            { $set: { ...reqBody } },
            { new: true }
        )

        if (!updateBatch) {
            console.log("bad request-batch")
            return response({
                statusCode: 404,
                body: JSON.stringify({ message: "Batch not found with this id" })
            })
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Branch updated successfully' }),
        };
    } catch (error) {
        console.error('Error updating branch:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating branch' }),
        };
    }
};

module.exports.deleteHandler = async (event) => {
    try {

        let branchId = event.pathParameters.branchId;
        let batchId = event.pathParameters.id;

        const { error: idError } = getSingleBatch.validate({ branchId, batchId });

        if (idError) {
            console.log('err', idError);
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            })
        }

        const branchExist = await Branch.findOne({ _id: branchId, deleted: false })

        if (!branchExist) {
            console.log("bad request-branch")
            return response({
                statusCode: 404,
                body: JSON.stringify({ message: "Branch not found with this id" })
            })
        }

        const deleteBatch = await Batch.findByIdAndUpdate({ _id: batchId, deleted: false }, { $set: { deleted: true } }, { new: true })
        if (!deleteBatch) {
            console.log("bad request-batch")
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: "Batch not found with this id" })
            })
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Batch deleted successfully' }),
        };
    } catch (error) {
        console.error('Error deleteing batch:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleteing batch' }),
        };
    }
};