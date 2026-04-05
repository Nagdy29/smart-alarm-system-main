// server.js
const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: "*" } // يسمح لأي جهاز على الشبكة يتصل
})

app.use(express.static("public")) // فولدر المشروع فيه HTML/CSS/JS
app.use(express.json())
app.use(cors())

// USERS DATABASE
let users = [
    { username: "admin", password: "1234" }
]

let connectedDevices = []
let alerts = []
let alarmActive = false

// LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body
    const user = users.find(u => u.username === username && u.password === password)
    if(user) return res.json({ success: true })
    res.json({ success: false })
})

// GET USERS
app.get("/users", (req, res) => res.json(users))

// ADD USER
app.post("/add-user", (req, res) => {
    const { username, password } = req.body
    if(users.find(u => u.username === username))
        return res.json({ success:false, message:"User exists" })
    users.push({ username, password })
    res.json({ success:true })
})

// DELETE USER
app.delete("/delete-user/:username", (req, res) => {
    const { username } = req.params
    if(username === "admin") return res.json({ success:false, message:"Can't delete admin" })
    const index = users.findIndex(u => u.username === username)
    if(index === -1) return res.json({ success:false, message:"User not found" })
    users.splice(index,1)
    res.json({ success:true })
})

// SOCKET.IO
io.on("connection", (socket) => {
    console.log("🔥 DEVICE CONNECTED:", socket.id)
    connectedDevices.push(socket.id)
    io.emit("deviceCount", connectedDevices.length)

    socket.on("disconnect", () => {
        connectedDevices = connectedDevices.filter(id => id !== socket.id)
        io.emit("deviceCount", connectedDevices.length)
    })

    socket.on("activateAlarm", () => {
        alarmActive = true
        io.emit("alarmStatus", { active:true })
    })
    socket.on("deactivateAlarm", () => {
        alarmActive = false
        io.emit("alarmStatus", { active:false })
    })
    socket.on("simulateMotion", () => {
        if(alarmActive){
            const alert = {
                message: "🚨 Motion Detected",
                time: new Date().toLocaleString(),
                devices: connectedDevices.length
            }
            alerts.push(alert)
            io.emit("motionAlert", alert)
        }
    })
})

// 🚀 START SERVER
// استعمل 0.0.0.0 عشان أي جهاز على نفس الشبكة يقدر يدخل
server.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://0.0.0.0:3000")
})