const { connectToDatabase } = require("../utils/db");
const Branch = require('../models/Branch.js');
const Institute = require('../models/Institute.js');
const { createBranch, getSingleBranch, editBranch } = require('../validations/branch.js');
const { getSingleInstitute } = require('../validations/institute.js');
const AWS = require('aws-sdk');

module.exports.createHandler = async (event, context) => {
    const reqBody = JSON.parse(event.body);
    await connectToDatabase();

    const branchSchemaValidation = () => {
        const { error } = createBranch.validate(reqBody);
        console.log("event", reqBody);
        if (error) {
            console.log("valErr", error);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: error.details[0].message }),
            };
        }
        return null;
    };

    const existInstitute = await Institute.findOne({ _id: reqBody.instituteId, deleted: false });

    if (!existInstitute) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Institute not found with this id' }),
        };
    }

    const bufferFromImage = () => {
        if (event.logo) {
            return Buffer.from(
                event.logo.replace(/^data:image\/\w+;base64,/, ""),
                "base64"
            );
        }
        return null;
    };

    const uploadToS3 = async (buf) => {
        if (buf) {
            await uploadObjectToS3Bucket(reqBody, buf);
        }
    };

    const branchDataCreation = async (buf) => {
        const branchData = new Branch({
            instituteId: reqBody.instituteId,
            name: reqBody.name,
            logo: buf ? `allassestsupmyranks/courseimages/${new Date().toISOString()}_${reqBody.name}.png` : '',
            address: reqBody.address,
            area: reqBody.area,
            city: reqBody.city,
            state: reqBody.state,
            pincode: reqBody.pincode,
            contactNo: reqBody.contactNo,
            isActive: reqBody.isActive,
            expiryDate: reqBody.expiryDate,
            batchStudentLimit: reqBody.batchStudentLimit,
            studentLimit: reqBody.studentLimit,
            teacherLimit: reqBody.teacherLimit,
            nonTeacherLimit: reqBody.nonTeacherLimit,
            courseIds: reqBody.courseIds,
        });

        try {
            await branchData.save();
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Branch Added Successfully" }),
            };
        } catch (error) {
            if (error.name === 'MongoError' && error.code === 11000) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Branch name must be unique." }),
                };
            }
            throw error;
        }
    };


    const uploadObjectToS3Bucket = (reqBody, data) => {
        const s3 = new AWS.S3();
        const params = {
            Bucket: "allassestsupmyranks",
            Key: `courseimages/${reqBody.name}.png`,
            Body: data,
        };

        return s3.upload(params).promise();
    };

    try {
        const schemaValidationResult = branchSchemaValidation();
        if (schemaValidationResult) {
            return schemaValidationResult;
        }

        const buf = bufferFromImage();

        await uploadToS3(buf);

        return await branchDataCreation(buf);
    } catch (err) {
        console.log("err", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message }),
        };
    }
};

module.exports.getAllHandler = async (event, context) => {
    try {
        await connectToDatabase();
        console.log("Connected");

        const instituteId = event.pathParameters.id;
        console.log("id", instituteId)

        const { error: idError } = getSingleInstitute.validate({ instituteId });

        if (idError) {
            console.log('err', idError);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            };
        }

        const result = await Institute.findOne({ _id: instituteId, deleted: false });

        if (!result) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Institute not found with this id' }),
            };
        }

        const startPage = 1;
        const minLimit = 10;

        let page = startPage;
        let limit = minLimit;
        console.log("Event:", event);

        if (event.body) {
            const reqBody = JSON.parse(event.body);
            console.log("req", reqBody);

            if (reqBody.page) {
                page = parseInt(reqBody.page, 10);
            }

            if (reqBody.limit) {
                limit = parseInt(reqBody.limit, 10);
            }
        }

        const skip = (page - 1) * limit;

        const branchData = await Branch.find({ instituteId, deleted: false })
            .select('-createdAt -updatedAt -logo -deleted')
            .skip(skip)
            .limit(limit);

        console.log("data", branchData);

        const responseBody = JSON.stringify({
            data: branchData,
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
        const instituteId = event.pathParameters.instituteId;
        const branchId = event.pathParameters.id;


        const { error: idError } = Joi.object({
            instituteId: Joi.objectId().required(),
            branchId: Joi.objectId().required(),
        }).validate({ instituteId, branchId });

        if (idError) {
            console.log('err', idError);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            };
        }

        const instituteExist = await Institute.findOne({ _id: instituteId, deleted: false })

        if (!instituteExist) {
            console.log("bad request-inst")
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Institute not found with this id" })
            }
        }

        const branchdata = await Branch.findOne({ _id: branchId, deleted: false })
        if (!branchdata) {
            console.log("bad request-branch")
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Branch not found with this id" })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ data: branchdata }),
        };
    } catch (error) {
        console.error('Error getting branch:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error getting branch' }),
        };
    }
};

module.exports.editHandler = async (event) => {
    try {

        let instituteId = event.pathParameters.instituteId;
        let branchId = event.pathParameters.id;

        const { error: idError } = getSingleBranch.validate({ instituteId, branchId });

        if (idError) {
            console.log('err', idError);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            };
        }

        const reqBody = JSON.parse(event.body);

        const { error } = editBranch.validate(reqBody);
        if (error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: error.details[0].message }),
            };
        }

        const instituteExist = await Institute.findOne({ _id: instituteId, deleted: false })

        if (!instituteExist) {
            console.log("bad request-inst")
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Institute not found with this id" })
            }
        }

        const updateBranch = await Branch.findByIdAndUpdate({ _id: branchId, deleted: false },
            { $set: { ...reqBody } },
            { new: true }
        )
        if (!updateBranch) {
            console.log("bad request-branch")
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Branch not found with this id" })
            }
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

        let instituteId = event.pathParameters.instituteId;
        let branchId = event.pathParameters.id;

        const { error: idError } = getSingleBranch.validate({ instituteId, branchId });

        if (idError) {
            console.log('err', idError);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            };
        }

        const instituteExist = await Institute.findOne({ _id: instituteId, deleted: false })

        if (!instituteExist) {
            console.log("bad request-inst")
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Institute not found with this id" })
            }
        }

        const deleteBranch = await Branch.findByIdAndUpdate({ _id: branchId, deleted: false },
            { $set: { deleted: true } },
            { new: true }
        )
        if (!deleteBranch) {
            console.log("bad request-branch")
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Branch not found with this id" })
            }
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Branch deleted successfully' }),
        };
    } catch (error) {
        console.error('Error deleteing branch:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleteing branch' }),
        };
    }
};