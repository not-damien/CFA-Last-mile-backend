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
        //todo return ether gig or gigID
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
    //todo 
    //verify that only the owner can delete
    //remove id from owners gig list
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