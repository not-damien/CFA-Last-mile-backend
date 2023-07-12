const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'plaintextPassword';
const someOtherPlaintextPassword = 'not_bacon';




//how to hash a password
bcrypt.hash("plaintextPassword", 10, function(err, hash) {
    // store hash in the database
    console.log(hash)
});


//two ways to compare passwords 
bcrypt.compare(myPlaintextPassword, '$2b$10$PCmGyXtmrwVQpQ1KJt4oweQe26OXdGHlzHRmkNB1hy/Eu5NZmGuFK', function(err, result) {
  console.log(result) 
});


comparePassword(myPlaintextPassword, '$2b$10$PCmGyXtmrwVQpQ1KJt4oweQe26OXdGHlzHRmkNB1hy/Eu5NZmGuFK').then(function(result){
    console.log(result)
  })


// compare password
async function comparePassword(plaintextPassword, hash) {
    const result = await bcrypt.compare(plaintextPassword, hash);
    return result;
}

