const express = require("express")
const http = require("http")
const path = require("path")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname,"../public")

app.use(express.static(publicDirectory))

io.on("connection", (socket) => {
    console.log("New web socket connection")

    socket.on("join", (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", "Welcome!"))
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `"${user.username}" has joined the room!`))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    
    socket.on("sendMessage", (message, callback) => {

        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(message)) {
            socket.emit("message", generateMessage("Profanity is not allowed"))
            return callback("Profanity is not allowed")
        }
        io.to(user.room).emit("message", generateMessage(user.username, message))
        callback()
        
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit("message", generateMessage("Admin", `"${user.username}" has left the chat`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on("sendLocation", (position, callback) => {

        const user = getUser(socket.id)
        const location = `https://google.com/maps?q=${position.latitude},${position.longtitude}`

        if(!location){
            return callback("Cannot find location")
        }

        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, location))
        callback()
    })

})

server.listen(port, () => {
    console.log("listening on port", port)
})