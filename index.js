const express = require('express')
const app = express()
const port = 3000

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