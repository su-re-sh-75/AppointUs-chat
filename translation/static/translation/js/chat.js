document.addEventListener('DOMContentLoaded', function(){
    
    // Files sending
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
    window.scrollToBottom = scrollToBottom;

    // Scroll to bottom when the page is loaded
    scrollToBottom(100);

    const roomName = document.getElementById("room-data").getAttribute("data-room-name");
    const currentUser = document.getElementById("room-data").getAttribute("data-current-user");

    const chatSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/chat/" + roomName + "/"
    );
    window.chatSocket = chatSocket;

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

    document.querySelector("#submit_button").addEventListener('click', function (e){
        var messageInput = document.querySelector("#my_input").value;
        var fileInput = document.querySelector("#file-upload");
        var files = fileInput.files;
    
        if (messageInput.length == 0 && (!files || fileDisplay.innerHTML === '') && !window.recordedBlob) {
            e.preventDefault();
            console.error("Type or record a message or select a file");
        } else {
            // send text msg
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
            // send uploaded files
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
    });
    

    // When msg is received in websocket from backend
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
            div.className = "chat " + (data.sender === currentUser ? "chat-sender" : "chat-receiver");
            
            const displayMessage = (data.sender === currentUser)? data.message : data.translated_message;
            const messageSenderElem = (currentUser === data.sender)? `` : `<div class="chat-header text-base-content/80">${data.sender}</div>`;
            div.innerHTML = `
                ${messageSenderElem}
                <div class="chat-bubble">${displayMessage}</div>
                <time class="text-base-content/80 chat-footer">${messageTime}</time>
            `;
            chatbox.appendChild(div);   

            scrollToBottom(100);

            // Update the last message in the sidebar
            const lastMessageTime = document.querySelector(`#msg-time-${roomName}`);
            const lastMessageContent = document.querySelector(`#last-message-${roomName}`);
            
            lastMessageTime.textContent = messageTime;
            lastMessageContent.classList.remove('items-center');
            lastMessageContent.classList.add('flex');
            lastMessageContent.innerHTML = (data.sender === currentUser)? `<p>You:</p> <p class="truncate w-full">${displayMessage}</p>` : `<p class="truncate w-full">${displayMessage}</p>`;
            
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
            const messageSenderElem = (currentUser === data.sender)? `` : `<div class="chat-header text-base-content/80">${data.sender}</div>`;
            if (imageExtensions.includes(fileExtension.toUpperCase())) {
                div.innerHTML = `
                    ${messageSenderElem}
                    <div class="chat-bubble image-message-bubble flex flex-col gap-4">
                        <button class="image-preview-btn border-base-100 w-52 overflow-hidden rounded-md border" type="button"
                            data-src="${data.file_url}"
                            aria-label="Image Button">
                            <img class="w-full" src="${data.file_url}" alt="Image attachment" />
                        </button>
                    </div>
                    <time class="text-base-content/80 chat-footer">${messageTime}</time>
                `;    
            } else {
                div.innerHTML = `
                    ${messageSenderElem}
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
                    <time class="text-base-content/80 chat-footer">${messageTime}</time>
                `;
            }
            chatbox.appendChild(div);
            if (imageExtensions.includes(fileExtension.toUpperCase())){
                bindImagePreviewEvents(div.querySelector(".image-message-bubble"));
            };
            scrollToBottom(100);

            // update sidebar last message
            const lastMessageTime = document.querySelector(`#msg-time-${roomName}`);
            const lastMessageContent = document.querySelector(`#last-message-${roomName}`);
            
            lastMessageTime.textContent = messageTime;
            lastMessageContent.classList.add('flex', 'items-center');
            lastMessageContent.innerHTML = `
            <svg class="h-6 w-6 pr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-icon lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <p class="truncate w-full">${fileName}</p>
            `;
        } else if (data.type == 'voice'){
            handleReceivedVoiceMessage(data);
        }else {
            console.error("Message or sender data is missing:", data);
        }
    };

    // update language
    document.getElementById("fav_language").addEventListener("change", function () {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        fetch('/update-language/', {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: JSON.stringify({ language: this.value })
        }).then(response => {
            if (response.ok) {
                console.log("Language set successfully")
            } else {
                console.error("Language is not set")
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


    // open, close Image Modal on preview click
    // const modal = document.getElementById("fullscreen-modal");
    // const modalImg = document.getElementById("fullscreen-image");
    // const imgModalCloseBtn = document.getElementById("close-img-modal-btn");
    // const modalBackdrop = document.getElementById("modal-backdrop");
    // const openButtons = document.querySelectorAll(".image-preview-btn");

    // openButtons.forEach((btn, i) => {
    //   btn.addEventListener("click", () => {
    //     const imgSrc = btn.getAttribute("data-src");
    //     if (!imgSrc) {
    //       console.error("❌ Missing image src on clicked button");
    //       return;
    //     }

    //     modalImg.src = imgSrc;
    //     modal.classList.remove("hidden");
    //     modal.classList.add("overlay-open");
    //     document.body.style.overflow = "hidden";
    //   });
    // });

    // const closeImgModal = () => {
    //   modal.classList.add("hidden");
    //   modal.classList.remove("overlay-open");
    //   modalImg.src = "";
    //   document.body.style.overflow = "";
    // };

    // imgModalCloseBtn.addEventListener("click", () => {
    //   closeImgModal();
    // });

    // modal.addEventListener("click", (e) => {
    //   if (e.target === modalBackdrop) {
    //     closeImgModal();
    //   }
    // });

    // document.addEventListener("keydown", (e) => {
    //   if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    //     closeImgModal();
    //   }
    // });

    const modal = document.getElementById("fullscreen-modal");
    const modalImg = document.getElementById("fullscreen-image");
    const imgModalCloseBtn = document.getElementById("close-img-modal-btn");
    const modalBackdrop = document.getElementById("modal-backdrop");

    const closeImgModal = () => {
        modal.classList.add("hidden");
        modal.classList.remove("overlay-open");
        modalImg.src = "";
        document.body.style.overflow = "";
    };

    imgModalCloseBtn.addEventListener("click", closeImgModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) {
            closeImgModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            closeImgModal();
        }
    });

    function bindImagePreviewEvents(bubble) {
        const imgBtn = bubble.querySelector(".image-preview-btn");
        if (!imgBtn) return;
      
        imgBtn.addEventListener("click", () => {
          const imgSrc = imgBtn.getAttribute("data-src");
          if (!imgSrc) {
            console.error("❌ Missing image src on clicked button");
            return;
          }
      
          modalImg.src = imgSrc;
          modal.classList.remove("hidden");
          modal.classList.add("overlay-open");
          document.body.style.overflow = "hidden";
        });
    }
    document.querySelectorAll(".image-message-bubble").forEach((bubble) => {bindImagePreviewEvents(bubble);});
    
})