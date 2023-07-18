require('dotenv').config();
const express = require('express') 
const cors = require('cors') 
const port = 3000
const app = express()
const bcrypt = require('bcrypt');
app.use(express.json())

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

app.get('/', (req, res) => {
  res.send('Hello World!')
})



/*  EXAMPLE BODY For login http
      {
        "email":"Damien@fake.email",
        "password":"test12345"
      }
*/
app.post('/login',async (req,res)=>{
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
          res.status(200).send({message: user.fname + ' Logged in'})
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
      {
        "fname":"Damien",
        "lname":"Cruz",
        "email":"Damien@fake.email",
        "password":"@Test12345"
      }
*/
app.post('/register',(req,res)=>{
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
          sendRegistrationToDb(EMAIL,PASSWORD,FNAME,LNAME,res)
          res.status(200).send({
           message:"registration set"
          })
    }
    




  //todo
  //sanitize 


  //on succsess generate new user in database JWT and send in back in response 
  //on failure seend approprate error message and dont update database
})

/*
{
  email:"damien@example.com",
  currentpassword:"@Test12345",
  newpassword: "@Computer123"
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
{
  jobname: 'UX Developer Needed',
  pay: 500,
  catagories, ["Web Design","UI/ UX Design"],
  discription, "I need a UX devolper to help with a design for a website for my new resturaunt"
}
*/
app.post('/creategig', async(req,res)=>{

  res.status(500).send('Not Te implemented')
})



/*
{
  email: "DamienCruz@computingforall.com",
  password: "fakepassword",
  gigid: "123456",  //each gig should have a uniqe id 

}
*/

app.delete('/deletegig',async(req,res)=>{
  
  //todo 
  //verfiy password/email match the one tied to the gig
  //on sucsess send 200 and delete 
  //on fail send 400 error 
  
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

app.post('/modifygig',async(req,res)=>{

  GIGID = new ObjectId(req.body._id);
  JOBNAME = req.body.jobname;
  PAY = req.body.pay;
  CATEGORIES = req.body.categories;
  DESCRIPTION = req.body.description;
  
  let success = false;
  let errorMessage;
  try {
    await client.connect();
    const collection = client.db("upcycling").collection(process.env.dbCollectionName);
    const updateGig = await collection.updateOne({_id: GIGID}, {$set:{jobname:JOBNAME, pay:PAY, categories:CATEGORIES, description:DESCRIPTION}})
    console.log(updateGig);
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
    res.status(200).send("Gig has been updated");
  }else{
    res.status(500).send("Internal server error: " + errorMessage);
  }
})







app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




async function sendRegistrationToDb(EMAIL, PASSWORD, FNAME, LNAME, res) {
  let success = false;      
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
              success = true;
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
        return success;
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