import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if(!MONGODB_URI){
    throw new Error('Please define MONGODB_URI in your env file')
}

let cached = (global as any).mongoose;

if(!cached)  {
    cached = (global as any).mongoose = {conn: null, promise: null};
}

async function connectDB(){
    if (cached) {
        return cached.conn;
    }
    if(!cached.promise){
        cached.promise = mongoose.connect(MONGODB_URI!);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;