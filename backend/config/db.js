const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("URI:", process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("FULL ERROR:");
        console.dir(error, { depth: null });
        process.exit(1);
    }
};

module.exports = connectDB;