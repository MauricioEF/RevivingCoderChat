import express from "express";
import {Server} from 'socket.io';
import __dirname, { normalizeMessages } from "./utils.js";
import { messageService, userService } from "./services/services.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import ios from 'socket.io-express-session';

const app = express();
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`)
})

const baseSession = (session({
    store:MongoStore.create({mongoUrl:'AQUÍ VA EL LINK DE TU BASE DE SESIONES'}),
    resave:false,
    saveUninitialized:false,
    secret:"CoderChat"
}))

const io = new Server(server);
app.use(express.static(__dirname+'/public'))
app.use(express.json());
app.use(baseSession);
io.use(ios(baseSession));



app.get('/currentUser',(req,res)=>{
    res.send(req.session.user)
})
app.post('/register',async (req,res)=>{
    let user = req.body;
    let result = await userService.save(user);
    res.send({message:"User created", user:result})
})
app.post('/login', async(req,res)=>{
    let {email,password} = req.body;
    if(!email||!password) return res.status(400).send({error:"Incomplete fields"})
    const user = await userService.getBy({email:email});//Obtengo al usuario ya de la DB
    if(!user) return res.status(404).send({error:"User not found"});
    if(user.password!==password) return res.status(400).send({error:"Incorrect Password"});
    //Hasta aquí, sabemos que va a haber usuario y que cumple su contraseña.
    req.session.user={
        username:user.username,
        email:user.email
    }
    res.send({status:"logged"})
})
io.on('connection',socket=>{
    socket.broadcast.emit('thirdConnection','Alguien se ha unido al chat')
    socket.on('message',async data=>{
        const user = await userService.findByUsername(socket.handshake.session.user.username)
        let message ={
            user:user._id,
            text:data.message
        }
        await messageService.save(message);
        const messages = await messageService.getAll();
        // const objectToNormalize ={
        //     id:"BaseId",
        //     messages:messages
        // }
        const objectToNormalize = await messageService.getDataToNormalize();
        const normalizedData = normalizeMessages(objectToNormalize);
        console.log(JSON.stringify(normalizedData,null,2));
        io.emit('messageLog',normalizedData);
    })
})
