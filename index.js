const express = require('express')
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config()
const cors=require('cors')
const app = express()
const port = process.env.PORT || 5000
// const services=require("./service.json");
// const products=require('./product.json');
app.use(cors());
app.use(express.json())

// dbuser:genius-car-user
// password:2jskaaRFDxVUke1f
const uri = `mongodb+srv://${process.env.db_name}:${process.env.password}@cluster0.3w5podw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
function veryfyjwt(req,res,next){
  const jwttokens=req.headers.authorization;
  if(!jwttokens){
    return res.status(401).send({message:'unauthorized access'})
  }
  const token=jwttokens.split(' ')[1];
  jwt.verify(token,process.env.access_token,function(error,decoded){
    if(error){
      return res.status(401).send({message:'unauthorized access'});
    }
req.decoded=decoded;
next();
  })
}
async function run(){
    await client.connect();
    try{
        console.log('connected with mongodb');
        const collection = client.db("geniuscar").collection("services");
        const customercollection=client.db("geniuscar").collection("order");
        const productcollection=client.db("geniuscar").collection("product");
        app.post('/jwt',(req,res)=>{
          const user=req.body;
          console.log(user);
          const token=jwt.sign(user, process.env.access_token,{expiresIn:'1h'});
          res.send({token})

        })
        app.get('/services/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:new ObjectId(id)};
            const service=await collection.findOne(query);
            res.send(service);
        })
        app.get('/checkout/:id',async(req,res)=>{
          const id=req.params.id;
          const query={_id:new ObjectId(id)};
          const service=await collection.findOne(query);
          res.send(service);
      })
        app.get("/services",async(req,res)=>{
            const query={};
            const cursor=collection.find(query);
            const users=await cursor.toArray();
            const count=await collection.estimatedDocumentCount();
            // res.send({count,users});
            res.send(users);
        })
        app.get('/products',async(req,res)=>{
          const query={};
            const cursor=productcollection.find(query);
            const products=await cursor.toArray();
          res.send(products);
        })
        app.get("/orders",veryfyjwt, async(req,res)=>{
          // console.log(req.headers.authorization);
          const decoded=req.decoded;
          console.log(decoded);
          if(decoded.email!==req.query.email){
            res.status(403).send({message:'unauthorized access'});
          }
          let query={};
          if(req.query.email){
            query={
              email:req.query.email
            }
          }
          const cursor=customercollection.find(query);
          const order=await cursor.toArray();
          res.send(order);
      })
        app.post('/orders',async(req,res)=>{
            console.log('post apoi called');
            const use=req.body;
            const result=await customercollection.insertOne(use);
            // use._id=result.insertedId;
            res.send(use);
            console.log(use);
        
        })
        app.put('/users/:id',async(req,res)=>{
            const id=req.params.id;
            const filter={_id:new ObjectId(id)};
            const user=req.body;
            console.log(user);
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                  name:user.name,
                  email:user.email,
                  proff:user.proff
                },
              };
              const result=await collection.updateOne(filter,updateDoc,options);
              console.log(result);
              res.send(result);
            
        })
        app.delete('/orders/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:new ObjectId(id)}
            const result=await customercollection.deleteOne(query);
            res.send(result);
            console.log(result);
        })

    }
    catch(error){
        console.log(error.message);
    }
}
run();

app.get('/', (req, res) => {
  res.send('Hello genius car server')
})
// app.get('/services',(req,res)=>{
//   res.send(services);
// })
// app.get('/products',(req,res)=>{
//   res.send(products);
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})