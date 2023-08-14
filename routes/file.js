const multer  = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const GridFSBucket = require("mongodb").GridFSBucket;
const auth = require("../middleware/auth");

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
  
    app.post("/upload/resume", upload.single("resume"), (req, res) => {
      const file = req.file
      // Respond with the file details
      res.send({
        message: "Uploaded",
        id: file.id,
        name: file.filename,
        contentType: file.contentType,
      })
    })

      //deletes the current user's resume file
    app.delete("/resume/del", auth, async(req,res)=>{
      USER = req.body.user
      ret = {
        success: false,
        message:""
      }

      //connect to db
      //delete the current users resume file
      //update user account
      //maybe point their resume file field to null
      //send back infos

      try{
        await client.connect()
    
        const database = client.db("test")
    
        const resumeBucket = new GridFSBucket(database, {
          bucketName: "resumes",
        })
        if(USER.resume){
          resumeBucket.delete(new ObjectId(USER.resume))
          await client.db("upcycling").collection(process.env.dbCollectionName).findOneAndUpdate(USER,{$set:{resume: null}});;
          ret.success = true
          ret.message = "file deleted"
        }else{
          console.log("user has no resumes")
          ret.message = "user has no resumes"
        }

      }catch(err){
        console.log(err)
        ret.message = err.message
      }finally{ 
        client.close()
        if(ret.success){
          res.status(200).send(ret)
        }else{
          res.status(500).send(ret)
        }

      }
    })
    //deletes any image
    app.delete("/resume/del", async(req,res)=>{
      ret = {
        success: false,
        message:""
      }
      try{
        await client.connect()
    
        const database = client.db("test")
    
        const resumeBucket = new GridFSBucket(database, {
          bucketName: "resumes",
        })
        
        await resumeBucket.delete(new ObjectId(req.body.id))
        ret.success = true
        ret.message = "file deleted successfully"
      }catch(err){
        //console.log(err)
        ret.message = err.message
      }finally{
        if(client){
          client.close()
        }
        if(ret.success){
          res.status(200).send(ret)
        }else{
          res.status(500).send(ret)
        }
      }
    })
    
    app.get("/resume/:id", async (req, res) => {
      console.log(req.params.id)
      try {
        await client.connect()
    
        const database = client.db("test")
    
        const resumeBucket = new GridFSBucket(database, {
          bucketName: "resumes",
        })
    
        let downloadStream = resumeBucket.openDownloadStream(
          new ObjectId(req.params.id)
        )
    
        downloadStream.on("data", function (data) {
          return res.status(200).write(data)
        })
    
        downloadStream.on("error", function (data) {
          console.log(data)
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