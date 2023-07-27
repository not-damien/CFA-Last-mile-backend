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
require('./routes/acounts')(app)


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



//isStringProvided functions checks if string is provided
function isStringProvided(str) {
  return str !== undefined && str.trim() !== '';
}


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
  let userResults;
  try {

    const userSearch = req.params.username;
    const query = { $or: [
      {fname: {$regex: new RegExp(userSearch, 'i')}},
      {lname: {$regex: new RegExp(userSearch, 'i')}}
    ]};

    const projection = {_id: 0,email:0, password:0, gigs: 0 };
    
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    userResults = await collection.find(query, { projection }).limit(10).toArray();
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
    res.status(200).json({
      message: "User retrieved successfully",
      userResults:userResults
    })
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
  }
});

/*
Documentation for job filters

reguest: {
  category:"web designer",
  location: "Seattle",
  employment_type: "Full Time",
  min_salary: "$1000",
  max_salary: "$10000"
}
response: {
  message: "Filter results"
  jobs: {
    [
        jobname: 'UX Developer Needed',
        employment_type: 'Full Time',
        pay: $1000,
        catagories: "Web Design","UI/ UX Design",
        discription: "I need a UX devolper to help with a design for a website for my new resturaunt"
        location: "Seattle"
      },
      {
        jobname: "UI Designer",
        employment_type: "Full Time",
        pay: $2000,
        categories: "Web Design","UI/ UX Design",
        description: "This company needs a UI designer to be able to design their product etc"
        location: "Seattle "
      }
    ]
}
*/

app.get('/jobsByFilter/:category/:location/:employee_type/:min_salary/:max_salary', async function(req, res) {

  let success = false;
  let errorMessage;
  let jobsFilter;
  try {
    const CATEGORY = req.params.category;
    const LOCATION = req.params.location;
    const EMPLOYMENT_TYPE = req.params.employee_type;
    const MIN_SALARY = parseFloat(req.params.min_salary);
    const MAX_SALARY = parseFloat(req.params.max_salary);
    

    const projection = {_id: 0,fname:0, lname:0, email:0, password:0};
    const query = { $and: 
      [ 
        {category: {$regex: new RegExp(CATEGORY, 'i')}},
        {location: {$regex: new RegExp(LOCATION, 'i')}},
        {employment_type: {$regex: new RegExp(EMPLOYMENT_TYPE, 'i')}},
        {salary: {$gte: MIN_SALARY, $lt: MAX_SALARY}}
      ]
    }

    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    jobsFilter = await collection.find(query, { projection }).limit(100).toArray();
    console.log(jobsFilter)
    success = true;

  } catch (error) {
    console.log(error);
    errorMessage = error.message;
  } finally{
    if(client){
      await client.close();
    }
  }
  if(success){
    res.status(200).json({
      message: "Jobs were filtered successfully",
      jobsFilter:jobsFilter
    })
  }else{
    res.status(500).send("Internal server error"+ errorMessage)
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


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

// helper functions



/**
 * 
 * @param {*} num 
 * @returns double 
 */
function isNumberProvided(num) {
  return typeof num === 'number' && num !== undefined && !isNaN(num);
}

function arrayRemove(arr, value) { 
    
  return arr.filter(function(ele){ 
      return ele != value; 
  });
}