const MongoClient = require("mongodb").MongoClient;

let cachedDB = null;

export const connectToDatabase = async () => {
    if(cachedDB){
        console.log("Use existing connection");
        return Promise.resolve(cachedDB);
    }
    else {
        return MongoClient.connect(process.env.MONGODB_URI, {
            native_parser: true,
            useUnifiedTopology: true,
        })
        .then((client) => {
            let db = client.db("statypikapy");
            console.log("New database connection");
            cachedDB = db;
            return cachedDB;
        })
        .catch((error) => {
            console.log("Mongo Connection error");
            console.log(error);
        })
    }
}