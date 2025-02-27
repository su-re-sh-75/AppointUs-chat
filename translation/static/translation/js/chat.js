document.addEventListener('DOMContentLoaded', function(){
    const fileInput = document.getElementById('file-upload');
    const fileDisplay = document.getElementById('file-list');
    const popover = document.getElementById('file-popover');
    const closeBtn = document.getElementById('close-popover');

    fileInput.addEventListener('change', function(event) {
        const fileList = event.target.files;
        fileDisplay.innerHTML = '';

        if (fileList.length > 0) {
            for (let file of fileList) {
                let listItem = document.createElement('li');
                listItem.textContent = file.name;
                fileDisplay.appendChild(listItem);
            }
            popover.classList.remove('hidden');
        } else {
            popover.classList.add('hidden');
        }
    });

    // Close popover on "X" button click
    closeBtn.addEventListener('click', function() {
        popover.classList.add('hidden');
        fileDisplay.innerHTML = '';
        fileInput.value = '';
    });
    const chatbox = document.querySelector("#chatbox");

    // Function to scroll to the bottom of the chatbox
    function scrollToBottom(time=0) {
        setTimeout(function(){
            chatbox.scrollTop = chatbox.scrollHeight;
        }, time);
    }

    // Scroll to bottom when the page is loaded
    scrollToBottom(100);

    const roomName = document.getElementById("room-data").getAttribute("data-room-name");
    const currentUser = document.getElementById("room-data").getAttribute("data-current-user");

    const chatSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/chat/" + roomName + "/"
    );

    chatSocket.onopen = function (e) {
        console.log("The connection was set up successfully!");
    };
    chatSocket.onclose = function (e) {
        console.log("Something unexpected happened!" + e);
    };

    document.querySelector("#my_input").focus();
    document.querySelector("#my_input").onkeyup = function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        document.querySelector("#submit_button").click();
    }
    };

    document.querySelector("#submit_button").onclick = function (e) {
        var messageInput = document.querySelector("#my_input").value;
        var fileInput = document.querySelector("#file-upload");
        var file = fileInput.files[0];
    
        if (messageInput.length == 0 && (!file || fileDisplay.innerHTML === '')) {
            e.preventDefault();
            alert("Type a message or select a file");
        } else {
            let now = new Date();
            let senttime = now.toISOString();
    
            if (messageInput.length > 0) {
                console.log("Sending Message:", { 
                    message: messageInput,
                    username: currentUser,
                    room_name: roomName,
                    senttime: senttime
                });
    
                chatSocket.send(JSON.stringify({
                    message: messageInput,
                    username: currentUser,
                    room_name: roomName,
                    senttime: senttime
                }));
                
                document.querySelector("#my_input").value = ""; 
            }
    
            if (file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    const base64FileData = reader.result.split(",")[1];
    
                    const fileMessage = {
                        type: "file",
                        file: base64FileData,
                        file_name: file.name,
                        username: currentUser,
                        room_name: roomName,
                        senttime: senttime,
                    };
    
                    console.log("Sending File:", fileMessage);
                    chatSocket.send(JSON.stringify(fileMessage));
    
                    fileInput.value = "";
                    fileDisplay.innerHTML = "";
                };
            }
        }
    };
    

    // Update the onmessage function to update the chat list
    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);

        if (data.type === "text") {
        // Display the new message in the chatbox
            const chatbox = document.querySelector("#chatbox");
            const noMessages = document.querySelector("#no-messages");
            const messageTime = new Date(data.senttime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            console.log("Received Message:", { 
                message: data.message,
                username: data.username,
                room_name: data.room_name,
                senttime: data.senttime
            });
            if (noMessages) {
                noMessages.style.display = "none";
            }

            const div = document.createElement("div");
            div.className =
                "chat " +
                (data.sender === currentUser
                ? "chat-sender"
                : "chat-receiver");
            
            div.innerHTML = `<div class="chat-bubble">${data.message}</div><time class="text-base-content/80 chat-footer">${messageTime}</time>`;
            chatbox.appendChild(div);

            // Scroll to the bottom of the chatbox
            scrollToBottom(100);

            // Update the last message in the sidebar
            
            const chatEntry = document.querySelector(`a[data-id="${data.room_name}"]`);
            
            if (chatEntry) {
                // Find and update the last message preview
                const lastMessageElement = chatEntry.querySelector("#last-message");
                lastMessageElement.innerHTML = 
                    (data.username === currentUser ? "You: " : "") +
                    data.message.substring(0, 20); // Truncate to 20 chars

                // Find and update the timestamp
                const timestampElement = chatEntry.querySelector(".text-nowrap");
                const messageTime = new Date(data.senttime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: "Asia/Kolkata"
                });
                timestampElement.textContent = messageTime;

                // update the chats list sorting by the last message timestamp in descending order
                const chats = document.querySelectorAll("#contact-list-item");
                const chatsArray = Array.from(chats);
                const chatsSorted = chatsArray.sort((a, b) => {
                    const aTime = a.querySelector("#msg-time").innerHTML;
                    const bTime = b.querySelector("#msg-time").innerHTML;
                    return aTime < bTime ? 1 : -1;
                });

                const contacts = document.querySelector("#contact-list");
                contacts.innerHTML = "";
                chatsSorted.forEach((chat) => {
                    contacts.appendChild(chat);
                });
            }else {
                console.error("No active chat selected");
            }
        } else if(data.type === "file"){
            const chatbox = document.querySelector("#chatbox");
            const fileName = data.file_name;

            const div = document.createElement("div");
            div.className = "chat " + (data.username === currentUser ? "chat-sender" : "chat-receiver");
            div.innerHTML = `
                <div class="chat-bubble">
                    <button class="border-base-100 w-52 overflow-hidden rounded-md border" aria-label="Image Button">
                        <img class="w-full" src="/media/uploads/${fileName}" alt="Image attachment" />
                    </button>
                </div>
                <time class="text-base-content/80 chat-footer">${new Date(data.senttime).toLocaleTimeString()}</time>
            `;
            // <a href="${fileUrl}" target="_blank" class="text-blue-500">${fileName}</a>

            chatbox.appendChild(div);
            scrollToBottom(100);

        } else {
            console.error("Message or sender data is missing:", data);
        }
    };
})