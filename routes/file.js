const multer  = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const GridFSBucket = require("mongodb").GridFSBucket;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.dbUserName}:${process.env.dbUserPassword}@${process.env.dbClusterName}.${process.env.dbMongoId}.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const storage = new GridFsStorage({url:uri,
    file: (req, file) => {
      //If it is a pdf, save to resume bucket
      if (file.mimetype === "application/pdf") {
        return {
          bucketName: "resumes",
          filename: `${Date.now()}_${file.originalname}`,
        }
      } else {
        //Otherwise save to default bucket
        return `${Date.now()}_${file.originalname}`
      }
    }})
  
  const upload = multer({ storage });
  
  

  
  module.exports = function (app){
  
    app.post("/upload/resume", upload.single("avatar"), (req, res) => {
      const file = req.file
      // Respond with the file details
      res.send({
        message: "Uploaded",
        id: file.id,
        name: file.filename,
        contentType: file.contentType,
      })
    })
  
    app.get("/resume/:filename", async (req, res) => {
      try {
        await client.connect()
    
        const database = client.db("test")
    
        const resumeBucket = new GridFSBucket(database, {
          bucketName: "resumes",
        })
    
        let downloadStream = resumeBucket.openDownloadStreamByName(
          req.params.filename
        )
    
        downloadStream.on("data", function (data) {
          return res.status(200).write(data)
        })
    
        downloadStream.on("error", function (data) {
          return res.status(404).send({ error: "resume not found" })
        })
    
        downloadStream.on("end", () => {
          return res.end()
        })
      } catch (error) {
        console.log(error)
        res.status(500).send({
          message: "Error Something went wrong",
          error,
        })
      }
    }) 
}  