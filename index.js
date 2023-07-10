require('dotenv').config();
const express = require('express') 
const cors = require('cors') 
const port = 3000
const app = express()

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.dbUserName}:${process.env.dbUserPassword}@${process.env.dbClusterName}.${process.env.dbMongoId}.mongodb.net/?retryWrites=true&w=majority`;


app.get('/', (req, res) => {
  res.send('Hello World!')
})



/*  EXAMPLE BODY For login http
      {
        "email":"Damien@fake.email",
        "password":"test12345"
      }
*/

app.post('/login',(req,res)=>{
    const EMAIL = req.body.email
    const PASSWORD = req.body.password
    if( !isStringProvided(EMAIL) || !isStringProvided(PASSWORD)){
      //todo
      //send error code missing email or password 
      res.status(400).send({
        message: "Missing required information"
    })}
    //todo
    //sanitize 

    //validate 

    //on succsess generate new JWT and send in back in response 
    //on failure seend approprate error message and dont update database
})


/*  EXAMPLE BODY For register http
      {
        "FNAME":"Damien",
        "LNAME":"Cruz",
        "email":"Damien@fake.email",
        "password":"test12345"
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
    })}
  if(!isPasswordValidFormat(thePassword)){
    res.status(400).send({
      message: "Password is not formated Properly"
  })}
  //todo
  //sanitize 

  //validate 

  //on succsess generate new user in database JWT and send in back in response 
  //on failure seend approprate error message and dont update database
})


app.get('/logout', (req, res) => {
  res.send('Logged Out')
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




async function sendRegitrationToDb(EMAIL, PASSWORD){
  try {
    //todo connect to db 
    //post collection.insertOne({email:EMAIL, password:PASSWORD})
  } catch (error) {
    //send 500 error
  }finally{
    //unconnect from db
  }
}



//db functions 















// helper functions

/**
 * checks if a string param has been provided
 * @param {*} str 
 */
function isStringProvided(str){
  str !== undefined && str.length > 0
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