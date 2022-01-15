const socket = io();
//-----NORMALIZR---------
    const users = new normalizr.schema.Entity('users',{},{idAttribute:'_id'});
    const messages = new normalizr.schema.Entity('messages',{
        user:users
    },{idAttribute:'_id'})
    const parentObject = new normalizr.schema.Entity('parent',{
        messages:[messages]
    })
//-----END-------------

let user;
fetch('/currentUser').then(result=>result.json()).then(json=>{
    user = json;
    console.log(user);
})
let input = document.getElementById('message');
input.addEventListener('keyup',(event)=>{
    if(event.key==="Enter"){
        if(event.target.value){
            socket.emit('message',{message:event.target.value})
            event.target.value="";
        }
    }
})
socket.on("messageLog",data=>{
    let p = document.getElementById("log")
    let denormalizedData = normalizr.denormalize(data.result,parentObject,data.entities);
    console.log(denormalizedData);
    let messages= denormalizedData.messages.map(message=>{
        return `<div><span>${message.user.username} dice: ${message.text}</span></div>`
    }).join('');
    p.innerHTML=messages;
})