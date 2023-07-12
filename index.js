require('dotenv').config();
const express = require('express') 
const cors = require('cors') 
const port = 3000
const app = express()


const uri = `mongodb+srv://${process.env.dbUserName}:${process.env.dbUserPassword}@${process.env.dbClusterName}.${process.env.dbMongoId}.mongodb.net/?retryWrites=true&w=majority`;

const { MongoClient, ServerApiVersion } = require('mongodb');



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// for parsing application/json requests
app.use(express.json())
// for parsing application/x-www-form-urlencoded requests
app.use(express.urlencoded({ extended: true }))
// for allowing different domain origins to make requests to this API
app.use(cors())


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

//isStringProvided functions checks if string is provided
function isStringProvided(str) {
  return str !== undefined && str.trim() !== '';
}



/*  EXAMPLE BODY For register http
      {
        "FNAME":"Damien",
        "LNAME":"Cruz",
        "email":"Damien@fake.email",
        "password":"test12345"
      }
*/
app.use(express.json());

app.post('/register', async (req, res) => {
  const { fname, lname, email, password } = req.body;

  if (!email || !password || !fname || !lname) {
    return res.status(400).send({
      message: "Missing required information"
    });
  }

  if (!isPasswordValidFormat(password)) {
    return res.status(400).send({
      message: "Password is not formatted properly"
    });
  }

  // TODO: Sanitize the input using express-validator or other libraries

  try {
    // Save registration data to the database
    const result = await sendRegistrationToDb(email, password, res);

    if (result.success) {
      // Generate JWT token for the user
      const token = generateJwtToken(email);

      // Send success response with the generated token
      return res.status(200).send({
        success: true,
        message: "Registration successful",
        token: token
      });
    } else {
      // Handle the case when the data couldn't be saved in the database
      return res.status(500).send({
        success: false,
        message: "Failed to save registration data"
      });
    }
  } catch (error) {
    console.error('An error occurred while saving registration data:', error);
    return res.status(500).send({
      success: false,
      message: "An error occurred while saving registration data"
    });
  }
});






app.get('/logout', (req, res) => {
  res.send('Logged Out')
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




async function sendRegistrationToDb(EMAIL, PASSWORD, res) {
  try {
    // Connect to the database
    await client.connect();

    const collection = client.db.collection(process.env.dbCollectionName);

    // Insert the data into the database
    const result = await collection.insertOne({ email: EMAIL, password: PASSWORD });

    if (result.insertedCount === 1) {
      console.log('Registration data saved successfully');
      return { success: true, message: 'Registration data saved successfully' };
    } else {
      throw new Error('Failed to save registration data');
    }
  } catch (error) {
    console.error('An error occurred while saving registration data:', error);
    // Handle the error and send a 500 error response
    res.status(500).send({ success: false, message: 'An error occurred while saving registration data' });
  } finally {
    // Disconnect from the database
    if (client) {
      await client.close();
    }
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