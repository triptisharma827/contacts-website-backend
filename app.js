const express = require('express');
const app = express(); 
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Add middleware and routes here
app.get('/',(req,res)=>{
    res.send("Hello From Server");
})

app.use(cors());
app.use(express.json());
mongoose.connect("mongodb+srv://TriptiSharma:dHI9tQhjrRY8xDcz@tripticluster0.nzfkopq.mongodb.net/ContactUsersDB", {
  useNewUrlParser: true,
});
app.get('/api/register',(req,res)=>{
    res.send("Hi");
})
app.post('/api/register',async (req,res)=>{
    console.log(req.body);
    try{
        const newPassword = await bcrypt.hash(req.body.password,10);
        await User.create({
            name: req.body.name,
            email: req.body.mail,
            password: newPassword
        })
        res.status(200).send({ status: 'ok' });
    }
    catch(err){
        console.log(err)
        res.status(300).send({status:'error',error:'duplicate email'});
    }
})

app.post('/api/login', async (req, res) => {

    try{
      const user = await User.findOne({
        email: req.body.mail,
      });

      if(!user){
        return res.status(400).send({ status: 'error', error: 'user not found' });
      }

      const isPasswordValid = await bcrypt.compare(req.body.password,user.password);
      if(!isPasswordValid){
        return res.status(300).send({status:'error',error:'invalid email/password'});
      }
      const token = jwt.sign({
        email: user.email,
        name: user.name
      },'privatekey');
      // console.log(jwt);
  
      res.status(200).send({status:'ok',user:token});
    }catch(err){
        console.log(err);
        res.status(300).send({status:'error',error:'Internal server error'});
      }
    }
  );

  app.get('/api/contacts', async (req, res) => {
    const token = req.headers['x-access-token'];
    try {
      const decoded = jwt.verify(token, 'privatekey');
      const email = decoded.email;
  
      const user = await User.findOne({ email: email });
      if (!user) {
        return res.json({ status: 'error', error: 'User not found' });
      }
  
      return res.json({ status: 'ok', contacts: user.contacts });
    } catch (error) {
      console.log(error);
      res.json({ status: 'error', error: 'Invalid token' });
    }
  });
  

  app.post('/api/contacts', async (req, res) => {
    const token = req.headers['x-access-token'];
    try {
      const decoded = jwt.verify(token, 'privatekey');
      const email = decoded.email;
  
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        {
          $push: {
            contacts: {
              name: req.body.contact.name,
              contactNumber: req.body.contact.contactNumber,
            },
          },
        },
        { new: true }
      );
  
      return res.json({ status: 'ok', contacts: updatedUser.contacts });
    } catch (error) {
      console.log(error);
      res.json({ status: 'error', error: 'invalid token' });
    }
  });

  app.delete('/api/contacts/:id', async (req, res) => {
    const token = req.headers['x-access-token'];
    try {
      const decoded = jwt.verify(token, 'privatekey');
      const email = decoded.email;
      const contactId = req.params.id;
  
      const updatedUser = await User.findOneAndUpdate(
        { email: email, 'contacts._id': contactId },
        { $pull: { contacts: { _id: contactId } } },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.json({ status: 'error', error: 'User or contact not found' });
      }
  
      return res.json({ status: 'ok', contacts: updatedUser.contacts });
    } catch (error) {
      console.log(error);
      res.json({ status: 'error', error: 'Invalid token' });
    }
  });
  
  app.put('/api/contacts/:contactId', async (req, res) => {
    const token = req.headers['x-access-token'];
    try {
      const decoded = jwt.verify(token, 'privatekey');
      const email = decoded.email;
      const contactId = req.params.contactId;
      const { name, contactNumber } = req.body.contact;
  
      const updatedUser = await User.findOneAndUpdate(
        { email: email, 'contacts._id': contactId },
        {
          $set: {
            'contacts.$.name': name,
            'contacts.$.contactNumber': contactNumber,
          },
        },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.json({ status: 'error', error: 'Contact not found' });
      }
  
      return res.json({ status: 'ok', contacts: updatedUser.contacts });
    } catch (error) {
      console.log(error);
      res.json({ status: 'error', error: 'invalid token' });
    }
  });
  
  

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});