require('dotenv').config();
const express = require('express') 
const cors = require('cors') 
const port = 3000
const app = express()
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
app.use(express.json())
app.use(cors())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.dbUserName}:${process.env.dbUserPassword}@${process.env.dbClusterName}.${process.env.dbMongoId}.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


/*
token: "cdnksdksdjncksnkjcsndndkc"

user{
  info about the user 
}
*/


app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 "+ req.body.user.fname);
});






app.get('/', (req, res) => {
  res.send('Hello World!')
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
    const EMAIL = req.body.email
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

    //todo
    //sanitize 

    //validate 

    //on succsess generate new JWT and send in back in response 
    //on failure seend approprate error message and dont update database
})

//isStringProvided functions checks if string is provided
function isStringProvided(str) {
  return str !== undefined && str.trim() !== '';
}



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
app.post('/register',async (req,res)=>{
  const FNAME = req.body.fname
  const LNAME = req.body.lname
  const EMAIL = req.body.email
  const PASSWORD = req.body.password
    if( !isStringProvided(EMAIL) || !isStringProvided(PASSWORD) || !isStringProvided(FNAME) || !isStringProvided(LNAME)){
      //send error code missing email or password 
      res.status(400).send({
        message: "Missing required information"
    })}else if(!isPasswordValidFormat(PASSWORD)){
      res.status(400).send({
        message: "Password is not formated Properly"
      })} else{
          let result = await sendRegistrationToDb(EMAIL,PASSWORD,FNAME,LNAME,res)
          res.status(200).send({
           message:"registration set",
           token: result.token
          })
    }
    




  //todo
  //sanitize 


  //on succsess generate new user in database JWT and send in back in response 
  //on failure seend approprate error message and dont update database
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
  const EMAIL = req.body.email;
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




app.get('/logout', (req, res) => {
  res.send('Logged Out')
})


/*
example bodyy 
reguest: {
  jobname: 'UX Developer Needed',
  pay: 500,
  categories: ["Web Design","UI/ UX Design"],
  description: "I need a UX devolper to help with a design for a website for my new resturaunt"
}
response: {
  message: "useful information"
  gig: {
    _id: "gig-id"
    jobname: 'UX Developer Needed',
    pay: 500,
    catagories, ["Web Design","UI/ UX Design"],
    discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
}
}
check if the user is already logged in
if not logged in then return false and redirect to login
if logged in then return true and continue with creategig
before sending information create a gig id with a function and then send information to database.
*/
app.post('/creategig', auth, async (req,res)=>{
    JOBNAME = req.body.jobname;
    PAY = req.body.pay;
    CATEGORIES = req.body.categories;
    DESCRIPTION = req.body.description;
    USER = req.body.user;
  if(!isStringProvided(JOBNAME) || !isStringProvided(CATEGORIES) || !isStringProvided(DESCRIPTION) || !isNumberProvided(PAY)){
    res.status(400).send({
      message: "Missing required information"
    })
  }else{
    let result = await sendGigToDatabase(JOBNAME, PAY, CATEGORIES, DESCRIPTION, USER)
    console.log(result)
    if(result.success){
      res.status(200).send({
      message: "Gig successfully submitted"
    })
    }else{
      res.status(500).send({
        message: "Gig submittion failed"
      })
    }
    
    
    
  }

});



/*
request:{
  email: "DamienCruz@computingforall.com",
  password: "fakepassword",
  gigid: "123456",  //each gig should have a uniqe id 

}
response:
200
{
  message: ok
}
or 
400
{
  message: "it failed and heres why"
}

*/

app.delete('/deletegig',async(req,res)=>{
  GIGID = new ObjectId(req.body._id);
  let success = false;
  let errorMessage;
  try {
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    const deleteGig = await collection.deleteOne({_id: GIGID})
    console.log(deleteGig);
    success = true;
  } catch (error) {
    console.log(error)
    errorMessage = error.message;
  }
  finally{
    if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).send("Gig has been deleted successfully");
  }else{
    res.status(500).send("Internal server error: " + errorMessage);
  }

})

  //todo 
  //verfiy password/email match the one tied to the gig
  //on sucsess send 200 and delete 
  //on fail send 400 error 
  



/*
request:{
  email: "DamienCruz@computingforall.com",
  password: "fakepassword",
  gigid: "123456",
  gig:{
    jobname: 'UX Developer Needed',
    pay: 500,
    catagories, ["Web Design","UI/ UX Design"],
    discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
    }
}
response:
200
{
  message: ok
  gig:{
    _id: "gig-id"
    jobname: 'UX Developer Needed',
    pay: 500,
    catagories, ["Web Design","UI/ UX Design"],
    discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
    }
}
or 
400
{
  message: "it failed and heres why"
}

*/


/*
example bodyy 
{
  jobname: 'UX Developer Needed',
  pay: 500,
  catagories, ["Web Design","UI/ UX Design"],
  discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
}
*/

/*
request:{
  email: "DamienCruz@computingforall.com",
  password: "fakepassword",
  gigid: "123456",
  gig:{
    jobname: 'UX Developer Needed',
    pay: 500,
    catagories, ["Web Design","UI/ UX Design"],
    discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
    }
}
response:
200
{
  message: ok
  gig:{
    _id: "gig-id"
    jobname: 'UX Developer Needed',
    pay: 500,
    catagories, ["Web Design","UI/ UX Design"],
    discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
    }
}
or 
400
{
  message: "it failed and heres why"
}

*/



app.get('/gigbyid',async (req,res)=>{
  GIGID = new ObjectId(req.body._id);
  let gig = {}
  let success = false;
  let errorMessage;
  try {
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    
    gig = await collection.findOne({_id: GIGID});
    console.log(gig)
    success = true;
  } catch (error) {
    console.log(error)
    errorMessage = error.message;
  }
  finally{
    if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).send(gig);
  }else{
    res.status(500).send("Internal server error: " + errorMessage);
  }
})
/*
example bodyy 
{
  jobname: 'UX Developer Needed',
  pay: 500,
  catagories, ["Web Design","UI/ UX Design"],
  discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
}
*/
app.post('/modifygig',auth ,async(req,res)=>{
  //todo
  //pass to auth check
  //get user's list of gigs 
  //compare list to provided 
  //if match
    //proceed with delete
    //and remove id from user's list on db
  //if not match send error

  GIGID = new ObjectId(req.body._id);
  JOBNAME = req.body.jobname;
  PAY = req.body.pay;
  CATEGORIES = req.body.categories;
  DESCRIPTION = req.body.description;
  USER = req.body.user;
  GIGLIST = USER.gigs;

  let success = false;
  let errorMessage;
  try {
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    
    if(GIGLIST != null){
      console.log(GIGLIST)
      console.log(GIGID)
      if(GIGLIST.find(element => element.toHexString() == GIGID.toHexString())){
        const updateGig = await collection.updateOne({_id: GIGID}, {$set:{jobname:JOBNAME, pay:PAY, categories:CATEGORIES, description:DESCRIPTION}})
        console.log(updateGig);
        success = true;
      }
  }
  } catch (error) {
    console.log(error)
    errorMessage = error.message;
  }
  finally{
    if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).send("Gig has been updated");
  }else{
    res.status(500).send("Internal server error: " + errorMessage);
  }

})


app.get('/readgig/:gigId',async(req, res) => {
  let success = false;
  try {
    const gigId = req.params.gigId;
    const objectId = new ObjectId(gigId);
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    const readGigResult = await collection.find({_id:objectId}).toArray();
    console.log(readGigResult);
    success = true;
  } catch (error) {
    console.log(error);
  } 
    finally{
      if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).send("gig retrieval completed");
  }else{
    res.status(500).send("Internal server error: ");
  }

});


//GET Users By Name //
/*
request:{
  fname: "Damien"
}
response:
200
{
  message: ok
  usersList:{
    fname: "Damien",
    lname: "Cruz"
    }
}
or 
400
{
  message: "it failed and heres why"
}
*/

app.get('/usersByName/:username', async function(req, res){
  let success = false;
  let errorMessage;
  try {

    const userSearch = req.params.username;
    const query = { $or: [
      {fname: {$regex: new RegExp(userSearch, 'i')}},
      {lname: {$regex: new RegExp(userSearch, 'i')}}
    ]};

    const projection = {_id: 0,email:0, password:0, gigs: 0 };
    
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    const userResults = await collection.find(query, { projection }).limit(10).toArray();
    console.log(userResults);
    success = true;
    
  }catch (error) {
    console.log(error);
    errorMessage = error.message;
  }
  finally{
    if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).send("user retrieved successfully");
  }else{
    res.status(500).send("Internal Server Error"+ errorMessage);
    
  }

})

//GET Users By Name //
/*
request:{
  categories: "UX/UI designer"
}
response:
200
{
  message: ok
  gigsResults:{
    gig:"UX/UI designer",
    gig:"UI designer"
    }
}
or 
400
{
  message: "it failed and heres why"
}
*/
app.get('/gigsLookUp/:gigsSearch', async function(req, res){
  let success = false;
  let errorMessage;
  let gigsResults;
  try {

    const gigsSearch = req.params.gigsSearch;
    const query = { categories: { $regex: new RegExp(gigsSearch, 'i') } };
    const projection = {_id: 0,fname:0, lname:0, email:0, password:0};
    
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    gigsResults = await collection.find(query, { projection }).limit(10).toArray();
    console.log(gigsResults);
    success = true;
    
  }catch (error) {
    console.log(error);
    errorMessage = error.message;
  }
  finally{
    if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).json({
      message: "The gigs were retrieved successfully",
      gigsResults:gigsResults
    });
  }else{
    res.status(500).send("Internal Server Error"+ errorMessage);
    
  }});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




async function sendRegistrationToDb(EMAIL, PASSWORD, FNAME, LNAME, res) {
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
            const result = await collection.insertOne({ email: EMAIL, password: hash, fname: FNAME, lname: LNAME });
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

/**
 * Sending gig to the database, if checks if the gig already exists. 
 */

async function sendGigToDatabase(JOBNAME, PAY, CATEGORIES, DESCRIPTION, USER) {
let result = {success: false};
  try {
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    const ExistingGig = await collection.findOne({jobname: JOBNAME, email: USER.email});
    if (ExistingGig) {
      console.log("The Gig already exists")
    }else{
      const GigResult = await collection.insertOne({jobname: JOBNAME, pay: PAY, categories: CATEGORIES, description: DESCRIPTION, email: USER.email});
      /*
        {
          acknowledged: true,
          insertedId: "ccfownefjnfksn122303nsn"
        }

      */
      console.log(GigResult)
      if(GigResult.acknowledged){
        result.success = true;
        await collection.findOneAndUpdate(USER,{$push:{"gigs": GigResult.insertedId}});
        console.log("The gig submitted successfully")
        
      }else{
        throw new Error("Failed to submit the gig");
      }
    }
    

  } catch (error) {
    console.error("An error occurred while submitting the gig", error);
  }finally{
     // Disconnect from the database
     if (client) {
      await client.close();
    }
    return result;
  }
}






//db functions 















// helper functions


/**
 * checks if a string param has been provided
 * @param {*} str 
 */
function isStringProvided(str){
  return str !== undefined && str.length > 0
}

/**
 * 
 * @param {*} num 
 * @returns double 
 */
function isNumberProvided(num) {
  return typeof num === 'number' && num !== undefined && !isNaN(num);
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

function arrayRemove(arr, value) { 
    
  return arr.filter(function(ele){ 
      return ele != value; 
  });
}