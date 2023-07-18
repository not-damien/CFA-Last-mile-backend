const jwt = require("jsonwebtoken");

const config = process.env;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.dbUserName}:${process.env.dbUserPassword}@${process.env.dbClusterName}.${process.env.dbMongoId}.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.params.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    console.log(decoded)
    let obid = new ObjectId(decoded.user_id)
    req.user = await collection.findOne({"_id":obid});
    console.log(req.user)
  } catch (err) { 
    console.log(err)
    return res.status(401).send(err);
  }finally{
    if (client) {
        await client.close();
      }
  }
  return next();
};

module.exports = verifyToken;