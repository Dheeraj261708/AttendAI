const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        department: {
            type: String,
            required: true,
            trim: true,
        },

        semester: {
            type: Number,
            required: true,
            min: 1,
        },

        section: {
            type: String,
            required: true,
            trim: true,
        },

        room: {
            type: String,
            default: "",
            trim: true,
        },

        day: {
            type: String,
            required: true,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ],
        },

        startTime: {
            type: String,
            required: true,
            trim: true,
        },

        endTime: {
            type: String,
            required: true,
            trim: true,
        },

        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

/*
 * Prevent two active classes from occupying
 * the exact same department + semester +
 * section + day + time slot.
 */
timetableSchema.index(
    {
        department: 1,
        semester: 1,
        section: 1,
        day: 1,
        startTime: 1,
        endTime: 1,
        active: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            active: true,
        },
    }
);

module.exports = mongoose.model(
    "Timetable",
    timetableSchema
);