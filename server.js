const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

app.use(express.static("public"))
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
    res.json({ success: !!user })
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
    users = users.filter(u => u.username !== username)
    res.json({ success:true })
})

// ✅ UPDATE USER
app.put("/update-user/:oldUsername", (req, res) => {
    try {
        const oldUsername = decodeURIComponent(req.params.oldUsername)
        const { username, password } = req.body

        if(!username || !password){
            return res.json({ success:false, message:"Missing data" })
        }

        users = loadUsers()

        const index = users.findIndex(u => u.username === oldUsername)

        if(index === -1){
            return res.json({ success:false, message:"User not found" })
        }

        if(oldUsername === "admin"){
            return res.json({ success:false, message:"Can't edit admin" })
        }

        // check duplicate
        const exists = users.find(u => u.username === username && u.username !== oldUsername)
        if(exists){
            return res.json({ success:false, message:"Username already exists" })
        }

        // ✅ update
        users[index] = { username, password }

        saveUsers(users)

        res.json({ success:true })

    } catch (err) {
        console.error("UPDATE ERROR:", err)
        res.status(500).json({ success:false, message:"Server crash" })
    }
})

// SOCKET
io.on("connection", (socket) => {
    connectedDevices.push(socket.id)
    io.emit("deviceCount", connectedDevices.length)

    socket.on("disconnect", () => {
        connectedDevices = connectedDevices.filter(id => id !== socket.id)
        io.emit("deviceCount", connectedDevices.length)
    })

    socket.on("activateAlarm", () => alarmActive = true)
    socket.on("deactivateAlarm", () => alarmActive = false)

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

server.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://0.0.0.0:3000")
})