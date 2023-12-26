const { connectToDatabase } = require("../utils/db");
const mongoose = require("mongoose");

module.exports.handler = async (event, context) => {
  try {
    await connectToDatabase();

    // const newItem = new Item(JSON.parse(event.body));
    // await newItem.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item created successfully" }),
    };
  } catch (error) {
    console.error("Error in createItem:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
