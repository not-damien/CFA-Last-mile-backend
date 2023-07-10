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

app.post('/login',(req,res)=>{
    //todo
    //sanitize 

    //validate 

    //on succsess generate new JWT and send in back in response 
    //on failure seend approprate error message and dont update database
})


app.post('/register',(req,res)=>{
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

/*
Passwords should be 8-20 characters in length
Must contain at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 symbol: !@#$%^&*~?
Must not repeat the same character more than 3 times in a row
Symbols not allowed: <>"='{}`()

*/
function isPasswordValidFormat(thePassword){
  //todo currently only validates length
    return thePassword.length >= 8 && thePassword.length <= 20;
      
}