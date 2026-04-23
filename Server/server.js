import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import "dotenv/config";

const server = express();

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
})

let port = 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});