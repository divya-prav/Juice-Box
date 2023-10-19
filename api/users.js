const express = require('express');
const usersRouter = express.Router();
const bcrypt = require('bcrypt');
const {requireUser} = require('./utils');
const { 
  createUser,
  getAllUsers,
  getUserByUsername,
  getPostsByUser,
} = require('../db');

const jwt = require('jsonwebtoken');
const { JWT_SECRET = 'neverTell' } = process.env;

//GET /api/users
usersRouter.get('/', async (req, res, next) => {
  try {
    const users = await getAllUsers();
  
    res.send({
      users
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

//POST /api/users/login
usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
 
  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password"
    });
  }

  try {
    const user = await getUserByUsername(username);
    

    const hashedPassword = user.password;
    const passwordMatch = await bcrypt.compare(password,hashedPassword);
    
    if (passwordMatch) {
      const token = jwt.sign({ 
        id: user.id, 
        username: username
      }, JWT_SECRET, {
        expiresIn: '1w'
      });

      res.send({ 
        message: "you're logged in!",
        token 
      });
    } else {
      next({ 
        name: 'IncorrectCredentialsError', 
        message: 'Username or password is incorrect'
      });
    }
    delete user.password;
  } catch(error) {
    console.log(error);
    next(error);
  }
});

//POST /api/users/register
usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
   
  try{
    const _user = await getUserByUsername(username);
  
    if (_user) {
      next({
        name: 'UserExistsError',
        message: 'A user by that username already exists'
      });
    }
  }
     
   catch{
    const user = await createUser({
      username,
      password,
      name,
      location,
    });
    
    delete user.password;

    const token =  jwt.sign({ 
      id: user.id, 
      username:user.username
    },JWT_SECRET, {
      expiresIn: '1w'
    });

  

    res.send({ 
      message: "thank you for signing up",
      token 
    });
   }
  } catch ({ name, message }) {
  
    next({ name, message });
  } 
});

//GET /api/users/me
usersRouter.get('/me',requireUser,async (req,res,next) => {
  
  try{
  
    res.send(req.user);
  }catch(error){
    console.log("i m in /me")
    next(error)
  }
})

// GET /api/users/me/posts

usersRouter.get('/me/posts',requireUser,async(req,res,next) =>{
  try{
    const {id} =req.user;
  
    const user = await getPostsByUser(id);
    if(!user){
      next({
        name: 'NoUser',
        message: `Error looking up userId ${id}`
      })
    }
    res.send(user);
  }catch(error){
    next(error)
  }
})

module.exports = usersRouter;