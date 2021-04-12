const socket = io()

//elements

const $messageForm = document.querySelector("#message-form")
const $messageFromInput = $messageForm.querySelector("#message-input")
const $messageFormButton = $messageForm.querySelector("#send-message")
const $locationButton = document.getElementById("send-location")
const $messages = document.querySelector("#messages")

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (message) => {
    console.log(message)

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        message: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })

    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    //disable

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFromInput.value = ""
        $messageFromInput.focus()
        //enable

        if (error) {
            return console.log(error)
        }
        
        console.log("Message delivered!")
    })

})

$locationButton.addEventListener("click", (e) => {

    $locationButton.setAttribute("disabled", "disabled")

    if(!navigator.geolocation){
        return alert("Geo location is not supported by your browser")
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, (error) => {

            $locationButton.removeAttribute("disabled")

            if(error){
                return console.log("An error occurred, " + error)
            }

            console.log("Location sent successfully")
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = "/"
    }
})