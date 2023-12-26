const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
    name: { type: String, required: true, unique: true },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    startDate: { type: Date },
    startTime: { type: String },
    endDate: { type: Date },
    endTime: { type: String },
    isActive: { type: Boolean, default: true },
    studentLimit: { type: Number, required: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    published: [{ type: String }],
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

const Batch = mongoose.model("Batch", batchSchema);


module.exports = Batch;