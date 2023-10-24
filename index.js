const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL);

const UserSchema = new Schema({
  username: String
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true })); // to grab body of request
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//FCC test: make a GET request to /api/users to get a list of all users.
app.get("/api/users", async (req, res) => {
  const users = await User.find({}).select(" _id username");
  if(!users){
    res.send ("No users");
  }else{
    res.json(users); 
  }
});


//"async and await make promises easier to write" async makes a function return a Promise. await makes a function wait for a Promise.
app.post("/api/users", async (req, res) => {
  console.log(req.body)
  const userObj = new User({ username: req.body.username });
  try {
    const user = await userObj.save()
    console.log(user);
    res.json(user)
  } catch (err) {
    console.log(err);
  }
});



app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  //const description = req.body.description;
  //const duration = req.body.duration;
  //const date = req.body.date;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.send("No user found");
    } else {
      const exerciseObj = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date() // if theres a date , add it else use todays date
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString() //turning into date obj first then formatting it 
      })
    }
  } catch (err) {
    console.log(err);
    res.send("there was an error saving the exercise")
  }
});

//FCC test:make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user

app.get("/api/users/:_id/logs", async(req, res) => {
  const id = req.params._id;
  const {from, to, limit} = req.query; // have to make query from " from , to , limit"
  const user= await User.findById(id);
  if(!user){
    res.send("could not find user");
    return;
  }
  let dateObj = {}
    if (from){
      dateObj["$gte"] = new Date(from)
    }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if (from || to){
    filter.date= dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()

  }))

  res.json({
    username: user.username,
    count: exercises.length,
    _id:user._id,
    log
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
