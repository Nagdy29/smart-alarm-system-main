async function login(){

const username = document.getElementById("username").value
const password = document.getElementById("password").value

try{

const res = await fetch(window.location.origin + "/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({username,password})
})

const data = await res.json()

if(data.success){

window.location.href = "/dashboard.html"

}else{

alert("❌ Wrong username or password")

}

}catch(err){

console.log(err)
alert("❌ Server not reachable")

}

}