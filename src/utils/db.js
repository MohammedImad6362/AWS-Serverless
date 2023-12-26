const mongoose = require("mongoose");

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Reusing existing database connection");
    return;
  }
  const isOffline = process.env.IS_OFFLINE === "true";
  const uri = isOffline
    ? "mongodb://localhost:27017/lms"
    : "mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false";
  const params = isOffline
    ? {}
    : {
        tls: true,
        tlsCAFile: "./rds-combined-ca-bundle.pem",
      };

  await mongoose.connect(uri, params);

  isConnected = true;
  console.log("Connected to the database");
};

module.exports = { connectToDatabase };
