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
        var files = fileInput.files;
    
        if (messageInput.length == 0 && (!files || fileDisplay.innerHTML === '')) {
            e.preventDefault();
            alert("Type a message or select a file");
        } else {
            let now = new Date();
            let senttime = now.toISOString();
    
            if (messageInput.length > 0) {
                console.log("Sending Message:", { 
                    type: "text",
                    message: messageInput,
                    username: currentUser,
                    room_name: roomName,
                    senttime: senttime
                });
    
                chatSocket.send(JSON.stringify({
                    type: "text",
                    message: messageInput,
                    username: currentUser,
                    room_name: roomName,
                    senttime: senttime
                }));
                
                document.querySelector("#my_input").value = ""; 
            }
    
            if (files.length > 0) {
                let filePromises = [];
    
                for (let file of files) {
                    let reader = new FileReader();
                    let filePromise = new Promise((resolve) => {
                        reader.onload = function () {
                            resolve({
                                file: reader.result.split(",")[1],
                                file_name: file.name
                            });
                        };
                        reader.readAsDataURL(file);
                    });
                    filePromises.push(filePromise);
                }
    
                Promise.all(filePromises).then((fileMessages) => {
                    chatSocket.send(JSON.stringify({
                        type: "files",
                        files: fileMessages,  
                        username: currentUser,
                        room_name: roomName,
                        senttime: senttime,
                    }));
    
                    fileInput.value = "";
                    fileDisplay.innerHTML = "";
                    popover.classList.add('hidden');
                });
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

            console.log("Received Message:", data);

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
                    data.message.substring(0, 20); 

                // Find and update the timestamp
                const timestampElement = chatEntry.querySelector("#msg-time");
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
            console.log(data)
            const chatbox = document.querySelector("#chatbox");
            const fileName = data.file_name;
            const messageTime = new Date(data.senttime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            const fileSize = data.file_size;
            const fileExtension = data.file_extension;

            const div = document.createElement("div");
            div.className = "chat " + (data.username === currentUser ? "chat-sender" : "chat-receiver");
            const imageExtensions = ["JPEG", "JPG", "PNG", "GIF", "SVG", "WEBP", "AVIF"];
            if (imageExtensions.includes(fileExtension.toUpperCase())) {
                div.innerHTML = `
                    <div class="chat-bubble">
                        <button class="border-base-100 w-52 overflow-hidden rounded-md border" aria-label="Image Button">
                            <img class="w-full" src="/media/uploads/${fileName}" alt="Image attachment" />
                        </button>
                    </div>
                    <time class="text-base-content/80 chat-footer">${messageTime}</time>
                `;    
            } else {
                div.innerHTML = `
                    <div class="chat-bubble flex flex-col gap-4">
                        <div class="bg-base-100 rounded-md">
                            <button class="flex items-center gap-2 px-3 py-2 max-sm:w-11/12">
                                <div class="flex flex-col gap-2 max-sm:w-5/6">
                                    <div class="flex items-center">
                                        ${fileExtension.toUpperCase() === "PDF" ? '<span class="icon-[tabler--file-type-pdf] text-error me-2.5 size-5"></span>' : ''}
                                        <span class="text-base-content/80 truncate font-medium">${fileName}</span>
                                    </div>
                                    <div class="text-base-content flex items-center gap-1 text-xs max-sm:hidden">
                                        ${fileSize}
                                        <span class="icon-[tabler--circle-filled] mt-0.5 size-1.5"></span>
                                        ${fileExtension.toUpperCase()}
                                    </div>
                                </div>
                                <a class="btn btn-text btn-circle" href="${data.file_url}" download>
                                    <span class="icon-[tabler--download] text-base-content size-6"></span>
                                </a>
                            </button>
                        </div>
                    </div>
                `;
            }

            
            // <a href="${fileUrl}" target="_blank" class="text-blue-500">${fileName}</a>

            chatbox.appendChild(div);
            scrollToBottom(100);

        } else {
            console.error("Message or sender data is missing:", data);
        }
    };

    // update language
    document.getElementById("fav_language").addEventListener("change", function () {

        fetch("{% url 'update_language' %}", {
            method: "POST",
            headers: {
                "X-CSRFToken": "{{ csrf_token }}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `fav_language=${this.value}`
        }).then(response => {
            if (response.ok) {
                const alertMessage = `
                    <div class="absolute top-8 right-4 z-50" id="django-messages">
                        <div class="alert alert-soft alert-info removing:translate-x-5 removing:opacity-0 flex items-center gap-4 transition duration-300 ease-in-out my-2" role="alert" id="dismiss-alert1">
                            ${response.data}
                            <button class="ms-auto leading-none" data-remove-element="#dismiss-alert1" aria-label="Close Button">
                                <span class="icon-[tabler--x] size-5"></span>
                            </button>
                        </div>
                    </div>
                `;
                document.prepend(alertMessage);
            } else {
                const alertMessage = `
                    <div class="absolute top-8 right-4 z-50" id="django-messages">
                        <div class="alert alert-soft alert-error removing:translate-x-5 removing:opacity-0 flex items-center gap-4 transition duration-300 ease-in-out my-2" role="alert" id="dismiss-alert1">
                            ${response.data}
                            <button class="ms-auto leading-none" data-remove-element="#dismiss-alert1" aria-label="Close Button">
                                <span class="icon-[tabler--x] size-5"></span>
                            </button>
                        </div>
                    </div>
                `;
                document.prepend(alertMessage);
            }
        });
    });

    // auto hide django message alerts after 5s
    setTimeout(function () {
        const alertElem = document.getElementById("django-messages");
        if (alertElem){
            alertElem.style.display = "none";
        }
    }, 5000);

})