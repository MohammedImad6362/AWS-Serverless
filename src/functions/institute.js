const { connectToDatabase } = require("../utils/db");
const Institute = require('../models/Institute.js');
const { createInstitute, getSingleInstitute, editInstitute } = require('../validations/institute.js');
const AWS = require('aws-sdk');

module.exports.createHandler = async (event, context) => {
  const reqBody = JSON.parse(event.body);
  await connectToDatabase();

  const instituteSchemaValidation = () => {
    const { error } = createInstitute.validate(reqBody);
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

  const instituteDataCreation = async (buf) => {
    const instituteData = new Institute({
      name: reqBody.name,
      logo: buf ? `allassestsupmyranks/courseimages/${new Date().toISOString()}_${reqBody.name}.png` : '',
      isActive: reqBody.isActive,
      courseIds: reqBody.courseIds,
      expiryDate: reqBody.expiryDate,
      branchStudentLimit: reqBody.branchStudentLimit,
      branchTeacherLimit: reqBody.branchTeacherLimit,
      branchNonTeacherLimit: reqBody.branchNonTeacherLimit,
      studentLimit: reqBody.studentLimit,
      teacherLimit: reqBody.teacherLimit,
      nonTeacherLimit: reqBody.nonTeacherLimit,
    });

    try {
      await instituteData.save();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Institute Added Successfully" }),
      };
    } catch (error) {
      if (error.name === 'MongoError' && error.code === 11000) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Institute name must be unique." }),
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
    const schemaValidationResult = instituteSchemaValidation();
    if (schemaValidationResult) {
      return schemaValidationResult;
    }

    const buf = bufferFromImage();

    await uploadToS3(buf);

    return await instituteDataCreation(buf);
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

    const institutes = await Institute.find({ deleted: false })
      .select('-createdAt -updatedAt -logo -deleted')
      .skip(skip)
      .limit(limit);

    console.log("data", institutes);

    const responseBody = JSON.stringify({
      data: institutes,
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

    const result = await Institute.findOne({ _id: instituteId, deleted: false }).select('-createdAt -updatedAt -deleted');
    console.log("res", result)

    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Institute not found with this _id' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data: result }),
    };
  } catch (error) {
    console.error('Error getting institute:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error getting institute' }),
    };
  }
};

module.exports.editHandler = async (event) => {
  try {

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

    const reqBody = JSON.parse(event.body);
    console.log("even", reqBody)

    const { error } = editInstitute.validate(reqBody);
    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message }),
      };
    }

    const updatedinstitute = await Institute.findByIdAndUpdate(
      instituteId,
      { $set: { ...reqBody } },
      { new: true }
    );

    console.log("data", updatedinstitute);

    if (!updatedinstitute) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Institute not found' }),
      };
    }

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: 'Institute updated successfully' }),
    });
  } catch (error) {
    console.error('Error updating institute:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating institute' }),
    };
  }
};

module.exports.deleteHandler = async (event) => {
  try {

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

    const deleteInstitute = await Institute.findByIdAndUpdate(
      instituteId,
      { $set: { deleted: true } },
      { new: true }
    );

    console.log("data", deleteInstitute);

    if (!deleteInstitute) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Institute not found' }),
      };
    }

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: 'Institute deleted successfully' }),
    });
  } catch (error) {
    console.error('Error deleting institute:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting institute' }),
    };
  }
};