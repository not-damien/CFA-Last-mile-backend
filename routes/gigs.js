require('dotenv').config();
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

module.exports = function (app){
    app.get('/hellogigs', (req, res) => {
        res.send('Hello World!')
    })
    /*
    {
        "jobname": "something something sum",
        "pay": 700,
        "categories": "Design",
        "description": "UX devolper to help with a design for a website for my new resturaunt",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjRjMmNjYzM1MjRhZjFjNzE3OWQwNTM0IiwiaWF0IjoxNjkwNDk3MDg5LCJleHAiOjE2OTA1MDQyODl9.TYez8LlBxn571iMsB-AIuC_v3cjo5-sY4nDIKLDkAzU"
    }
    {
    "message": "Gig successfully submitted"
    }
    */
    app.post('/creategig', auth, async (req,res)=>{
        JOBNAME = req.body.jobname;
        CATEGORIES = req.body.categories;
        REMOTE = req.body.remote;
        DURATION = req.body.duration;
        PAY = req.body.pay;
        DESCRIPTION = req.body.description;
        EMPLOYER = req.body.employer;
        USER = req.body.user;
      if(!isStringProvided(JOBNAME) || !isStringProvided(CATEGORIES) || !isStringProvided(DESCRIPTION) || !isNumberProvided(PAY)){
        res.status(400).send({
          message: "Missing required information"
        })
      }else{

        let result = await sendGigToDatabase(JOBNAME, CATEGORIES, REMOTE, DURATION,PAY,DESCRIPTION, EMPLOYER, USER)
        console.log(result)
        if(result.success){
          res.status(200).send({
          message: "Gig successfully submitted!",
          "_id": result.insertedId
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

app.get('/gigbyid/:gigId',async (req,res)=>{
    GIGID = new ObjectId(req.params.gigId);
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
      res.status(200).send({message: "gig found","gig":gig});
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
    GIGID = new ObjectId(req.body._id);
    JOBNAME = req.body.jobname;
    CATEGORIES = req.body.categories;
    REMOTE = req.body.remote;
    DURATION = req.body.duration;
    PAY = req.body.pay;
    DESCRIPTION = req.body.description;
    EMPLOYER = req.body.employer;
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
          const updateGig = await collection.updateOne({_id: GIGID}, {$set:{jobname: JOBNAME, categories: CATEGORIES, remote: REMOTE, duration:DURATION, pay: PAY, description: DESCRIPTION, employer: EMPLOYER}})
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




/*
request:{
  token: "kmecnwocknwekncdpo2o3930fdno23d23d23f",
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

app.delete('/deletegig',auth,async(req,res)=>{
    GIGID = new ObjectId(req.body._id);
    USER = req.body.user;
    USERID = new ObjectId(req.body.user._id)
    GIGLIST = USER.gigs;
    let success = false;
    let errorMessage;
    try {
      if(GIGLIST != null && GIGLIST.length != 0){
        if(GIGLIST.find(element => element.toHexString() == GIGID.toHexString())){  //verify that gig belongs to owner
          await client.connect();
          const collection = client.db("upcycling").collection(process.env.dbCollectionName);
          const deleteGig = await collection.deleteOne({_id: GIGID})//delete gig from database
          await collection.findOneAndUpdate(USER,{$set:{"gigs":arrayRemove(GIGLIST,GIGID)}} )//remove id from owners gig list
          console.log(deleteGig);
          success = true;
        }else{
          console.log(" user doesn't own this gig")
          errorMessage = " user doesn't own this gig"
        }
      }else{
        //user doesn't own any gigs
        console.log(" user doesn't own any gigs")
        errorMessage = " user doesn't own any gigs"
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
      res.status(200).send("Gig has been deleted successfully");
    }else{
      res.status(500).send("Internal server error: " + errorMessage);
    }
  
  })
}





/**
 * Sending gig to the database, if checks if the gig already exists. 
 */
async function sendGigToDatabase(JOBNAME, CATEGORIES, REMOTE, DURATION, PAY, DESCRIPTION, EMPLOYER, USER) {
    let result = {success: false};
      try {
        await client.connect();
        const collection = client.db("upcycling").collection(process.env.dbCollectionName);
        const ExistingGig = await collection.findOne({jobname: JOBNAME, email: USER.email});
        if (ExistingGig) {
          console.log("The Gig already exists")
        }else{
          const timestamp = new Date(); // Current timestamp
          const GigResult = await collection.insertOne({jobname: JOBNAME, categories: CATEGORIES,remote: REMOTE, duration:DURATION, pay: PAY, description: DESCRIPTION, employer: EMPLOYER, email: USER.email, timestamp: timestamp});
          /*
            {
              acknowledged: true,
              insertedId: "ccfownefjnfksn122303nsn"
            }
          */
          console.log(GigResult)
          if(GigResult.acknowledged){
            result.success = true;
            result.insertedId = GigResult.insertedId
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
  

//helper functions
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

  function arrayRemove(arr, value) { 
    
    return arr.filter(function(ele){ 
        return ele.toHexString() != value.toHexString(); 
    });
  }