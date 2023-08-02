require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const multer  = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const GridFSBucket = require("mongodb").GridFSBucket

const auth = require("../middleware/auth");

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { error } = require('console');
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
    //If it is an image, save to photos bucket
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/webp"|| file.mimetype === "image/png") {
      return {
        bucketName: "photos",
        filename: `${Date.now()}_${file.originalname}`,
      }
    } else {
      //Otherwise save to default bucket
      return `${Date.now()}_${file.originalname}`
    }
  }})

const upload = multer({ storage });













module.exports = function (app){

  app.post("/upload/image", upload.single("avatar"), (req, res) => {
    const file = req.file
    // Respond with the file details
    res.send({
      message: "Uploaded",
      id: file.id,
      name: file.filename,
      contentType: file.contentType,
    })
  })
  
  
  //deletes the current user's pfp
  app.delete("/pfp/del", auth, async(req,res)=>{
    USER = req.body.user
    ret = {
      success: false,
      message:""
    }

    //connect to db
    //delete the current users photo
    //update user account
    //maybe point thier pfp field to a deafault image or set it to null
    //send back infos

    try{
      await client.connect()
  
      const database = client.db("test")
  
      const imageBucket = new GridFSBucket(database, {
        bucketName: "photos",
      })
      if(USER.pfp){
        imageBucket.delete(new ObjectId(USER.pfp))
        await client.db("upcycling").collection(process.env.dbCollectionName).findOneAndUpdate(USER,{$set:{pfp: null}});;
        ret.success = true
        ret.message = "file delted"
      }else{
        console.log("user has no photo")
        ret.message = "user has no photo"
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
  app.delete("/image/del", async(req,res)=>{
    ret = {
      success: false,
      message:""
    }
    try{
      await client.connect()
  
      const database = client.db("test")
  
      const imageBucket = new GridFSBucket(database, {
        bucketName: "photos",
      })
      
      await imageBucket.delete(new ObjectId(req.body.id))
      ret.success = true
      ret.message = "file delted"
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

  app.get("/image/:id", async (req, res) => {
    try {
      await client.connect()
  
      const database = client.db("test")
  
      const imageBucket = new GridFSBucket(database, {
        bucketName: "photos",
      })
  
      let downloadStream = imageBucket.openDownloadStream(
        new ObjectId(req.params.id)
      )
  
      downloadStream.on("data", function (data) {
        return res.status(200).write(data)
      })
  
      downloadStream.on("error", function (data) {
        return res.status(404).send({ error: "Image not found" })
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






    /*   Note: user may be null if login fails 
      request:{
        "email":"Damien@fake.email",
        "password":"test12345"
      }
      response:{
        message: "useful information"
        user: {
           _id: "user-id"
          email: 'Damien@fake.email',
          password: '$HashedAndSaltedPassword',
          fname: 'Damien',
          lname: 'Cruz',
          token: "sample-jwt-token"
}
      }
*/
    app.post('/login',async (req,res)=>{
        console.log(req.body)
          const EMAIL = req.body.email.toLowerCase();    //todo sanitize 
          const PASSWORD = req.body.password
          if( !isStringProvided(EMAIL) || !isStringProvided(PASSWORD)){
            //send error code missing email or password 
            res.status(400).send({
              message: "Missing required information"
          })}else{
            //todo 
            //when matching return 200 with jwt
            try{
              await client.connect();
              const collection = client.db("upcycling").collection(process.env.dbCollectionName);
              //get information about user from database
              let user = await collection.findOne({email:EMAIL});
              console.log(user)
              if(!user){
                res.status(400).send({message: "Email or password does not match"})
              }else if(bcrypt.compareSync(PASSWORD, user.password)){
                //login
                console.log(user.fname + ' Logged in')
                const token = jwt.sign(
                  { user_id: user._id, },
                  process.env.TOKEN_KEY,
                  {
                    expiresIn: "2h",
                  }
                );
                // save user token
               // await collection.findOneAndUpdate(user,{$set:{"token": token}});
                user.token = token//give token back to client, dont store on database
                res.status(200).send({message: user.fname + ' Logged in', "user":user })
      
              }else{
                res.status(400).send({message: "Email or password does not match"})
                //wrong password
              }
            }catch(erorr){
              console.log(erorr)
            }finally{
              if (client) {
                await client.close();
              }
            }      
          }
      })



/*  EXAMPLE BODY For register http
      request: {
        "fname":"Damien",
        "lname":"Cruz",
        "email":"Damien@fake.email",
        "password":"@Test12345"
      }

      response:{
        message: "useful information"
        user: {
           _id: "user-id"
          email: 'Damien@fake.email',
          password: '$HashedAndSaltedPassword',
          fname: 'Damien',
          lname: 'Cruz',
          token: "sample-jwt-token"
        }
      }
      Note: user may be null if registration fails 
*/
app.post('/register',upload.single("avatar"),async (req,res)=>{
    const file = req.file
    const FNAME = req.body.fname//todo sanitize
    const LNAME = req.body.lname
    const EMAIL = req.body.email.toLowerCase();
    const PASSWORD = req.body.password
      if( !isStringProvided(EMAIL) || !isStringProvided(PASSWORD) || !isStringProvided(FNAME) || !isStringProvided(LNAME)){
        //send error code missing email or password 
        res.status(400).send({
          message: "Missing required information"
      })}else if(!isPasswordValidFormat(PASSWORD)){
        res.status(400).send({
          message: "Password is not formated Properly"
        })} else{
            let result = await sendRegistrationToDb(EMAIL,PASSWORD,FNAME,LNAME,file)
            if(result.success){
              res.status(200).send({
             message:"registration set",
             token: result.token
            })
            }else{
              res.status(500).send({
                message: "registration failed"
              })
            }
            
      }
  })
app.post('/currentuser',auth,(req,res)=>{
  res.status(200).send(req.body.user)
})





  /*
request:{
  email:"damien@example.com",
  currentpassword:"@Test12345",
  newpassword: "@Computer123"
}


status 400
response: {
  message: "info on why it failed"
}
or 
status 200
{
  message: "Password Updated"
}
*/
  app.post('/changepassword',async (req,res)=>{
    const EMAIL = req.body.email.toLowerCase();
    const CURRENT_PASSWORD = req.body.currentpassword;
    const NEW_PASWORD = req.body.newpassword;
    if(CURRENT_PASSWORD == NEW_PASWORD){
      res.status(400).send({
        message: "New Password Cannot Match Old Password"
      })
    }else if(isPasswordValidFormat(NEW_PASWORD)){
      //also check if old password is correct for email
      //Hash and salt new password and set it as the users password
      try{
          await client.connect();
          const collection = client.db("upcycling").collection(process.env.dbCollectionName);
          //get information about user from database
          let user = await collection.findOne({email:EMAIL});
          console.log("current user")
          console.log(user)
          if(!user){
            //user acount not found
            res.sendStatus(400)
          }else if(bcrypt.compareSync(CURRENT_PASSWORD, user.password)){//compare hashed value from data base to provided password
            //todo update user in database
            let newhash = bcrypt.hashSync(NEW_PASWORD, 10);
            await collection.findOneAndUpdate(user,{$set:{password: newhash}});
            console.log(newhash)
            res.status(200).send({message:"Password Updated"})
            //insert into user document here
          }else{
            //wrong password
            console.log("Wrong Password")
            res.status(400).send({message: "Wrong Paassword"})
          }
        }catch(erorr){
          console.log(erorr)
        }finally{
          if (client) {
            await client.close();
          }
        }      
      
    }else{
      res.sendStatus(400)
    }
  })
  
  
  //edit profile
  //connect to db, find user(already signed in), replace changed info
  app.post('/modifyprofile', auth, async (req,res)=>{
    let success;
    //Take new info
    const FNAME = req.body.fname//todo sanitize
    const LNAME = req.body.lname
    USERID = new ObjectId(req.body.user._id);
    try {
      await client.connect();
      const collection = client.db("upcycling").collection(process.env.dbCollectionName);
      //get users old info and replace,
      const updateUser = await collection.updateOne({_id: USERID}, {$set:{fname:FNAME, lname:LNAME}})
      console.log(updateUser);
      success = true;
    }
    catch (error) {
      console.log(error)
      errorMessage = error.message;
    }
    finally{
      if(client){
        await client.close();
      }
    }
    if(success){
      res.status(200).send("User info has been updated");
    }else{
      res.status(500).send("Internal server error: " + errorMessage);
    }
  
  })
}



async function sendRegistrationToDb(EMAIL, PASSWORD, FNAME, LNAME, FILE) {
    let ret = {success:false, token: null}      
    try{
          // store hash in the database
            await client.connect();
            const collection = client.db("upcycling").collection(process.env.dbCollectionName);
            const existingUser = await collection.findOne({email:EMAIL});
            console.log(existingUser);
            if(existingUser){
              console.log("User Exists");
            }else{
              const hash = bcrypt.hashSync(PASSWORD, 10);
              let result
              if(FILE != undefined){
                result = await collection.insertOne({ email: EMAIL, password: hash, fname: FNAME, lname: LNAME , pfp:FILE.id});
              }else{
                result = await collection.insertOne({ email: EMAIL, password: hash, fname: FNAME, lname: LNAME , pfp:null});
              }
              
              console.log(result);
              if (result.acknowledged) { //erorr here
                console.log('Registration data saved successfully');
                ret.success = true;
                let id = result.insertedId;
                const token = jwt.sign(
                  { user_id: id, },
                  process.env.TOKEN_KEY,
                  {
                    expiresIn: "2h",
                  })
                  ret.token = token
                  ret.success = true
              }else {
                throw new Error('Failed to save registration data');
              }
        }}
        catch(error){
          console.error('An error occurred while saving registration data:', error);
  
        }finally{
        // Disconnect from the database
          if (client) {
            await client.close();
          }
          return ret;
        }
    } 























//helper functions
/**
 * checks if a string param has been provided
 * @param {*} str 
 */
function isStringProvided(str){
    return str !== undefined && str.length > 0
  }


/*
Passwords should be 8-20 characters in length
Must contain at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 symbol: !@#$%^&*~?
Must not repeat the same character more than 3 times in a row
Symbols not allowed: <>"='{}`()
*/
function isPasswordValidFormat(thePassword){
    return (thePassword.length >= 8 && thePassword.length <= 20 &&
           !hasThreeConsecutiveLetters(thePassword) &&
           hasRequiredCharacters(thePassword));
}


function hasThreeConsecutiveLetters(str) {
  for (let i = 0; i < str.length - 2; i++) {
    if (str[i] === str[i + 1] && str[i + 1] === str[i + 2]) {
      return true;
    }
  }
  return false;
}

function hasRequiredCharacters(str) {
  const numberRegex = /\d/;
  const uppercaseRegex = /[A-Z]/;
  const lowercaseRegex = /[a-z]/;
  const symbolRegex = /[!@#$%^&*~?]/;
  const forbiddenSymbolsRegex = /[<>"='{}()`]/;

  return (
    numberRegex.test(str) &&
    uppercaseRegex.test(str) &&
    lowercaseRegex.test(str) &&
    symbolRegex.test(str) &&
    !forbiddenSymbolsRegex.test(str)
  );
}