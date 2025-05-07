document.addEventListener('DOMContentLoaded', function(){

    // Voice recording feature
    const micBtn = document.getElementById('mic-btn');
    const submitBtn = document.getElementById('submit_button');
    const voiceDivElem = document.createElement('div');
    let voiceFilename = null;
    let canRecord = false;
    let isRecording = false;
    let recorder = null;
    let audioChunks = [];

    micBtn.addEventListener('click', toggleMic);

    const roomName = document.getElementById("room-data").getAttribute("data-room-name");
    const currentUser = document.getElementById("room-data").getAttribute("data-current-user");

    function formatFilename() {
        const now = new Date();

        const day = String(now.getDate()).padStart(2, '0');
        const month = now.toLocaleString('en-us', { month: 'short' });
        const year = now.getFullYear();
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${currentUser}_${roomName}_${day}${month}${year}${hours}${minutes}${seconds}`;
    };


    function setupAudio(){
        console.log("Mic setup");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then(setupStream)
                .catch(err => {
                    console.log(err)
                })
        }
    };
    setupAudio();

    function setupStream(stream){
        recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm; codecs=opus',
            audioBitsPerSecond: 128000
        });

        recorder.ondataavailable = e =>{
            audioChunks.push(e.data);
        }

        recorder.onstop = e =>{
            const blob = new Blob(audioChunks, { type: "audio/ogg; codecs=opus"});
            audioChunks = [];
            voiceFilename = `voice_${formatFilename()}.ogg`;
            window.recordedBlob = blob;
            voicePopover.classList.remove('hidden');
            voicePopover.classList.add('flex', 'items-center');
            voiceDivElem.textContent = voiceFilename;
            voiceDivElem.classList.add('truncate','text-sm','text-gray-600','mx-1');
            voiceDivElem.setAttribute('title', `${voiceFilename}`);
            voicePopover.prepend(voiceDivElem);
        }
        canRecord = true;
    };

    function toggleMic(){
        if (!canRecord) return;

        isRecording = !isRecording;
        if (isRecording){
            recorder.start();
            micBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-off-icon lucide-mic-off"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
        }else{
            recorder.stop();
            micBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-icon lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
        }
    };

    const voicePopover = document.getElementById('voice-popover');
    const voiceCloseBtn = document.getElementById('voice-close-popover');

    // Close popover on "X" button click
    voiceCloseBtn.addEventListener('click', function() {
        voicePopover.classList.add('hidden');
        voiceDivElem.textContent = '';
    });

    // send to backend
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject("FileReader failed");
            reader.readAsDataURL(blob);
        });
    };
    const sendVoiceMessage = (base64Audio, filename, username, roomName) => {
        const senttime = new Date().toISOString();
        const voiceData = {
            type: "voice",
            voice_file: base64Audio, 
            voice_filename: filename,
            username: username,
            room_name: roomName,
            senttime: senttime,
        };

        window.chatSocket.send(JSON.stringify(voiceData));
    };

    submitBtn.addEventListener('click', async function() {
        if (!recordedBlob) {
            console.error("No audio in recordedBlob");
            return;
        }
        try {
            const base64Audio = await blobToBase64(recordedBlob);
            sendVoiceMessage(base64Audio, voiceFilename, currentUser, roomName);
            voicePopover.classList.add('hidden');
            voiceDivElem.textContent = '';
        } catch (err) {
            console.error("Error converting blob to base64:", err);
        }
    });
    
    const lastMessageTime = document.querySelector(`#msg-time-${roomName}`);
    const lastMessageContent = document.querySelector(`#last-message-${roomName}`);

    function handleReceivedVoiceMessage(data){
        console.log("Received voice message: ", data);
        const chatbox = document.querySelector("#chatbox");
        const messageTime = new Date(data.senttime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const messageSenderName = (currentUser === data.username) ? "You" : data.username;

        const div = document.createElement("div");
        div.className = "chat " + (data.username === currentUser ? "chat-sender" : "chat-receiver");
        div.innerHTML = `
            <div class="chat-header text-base-content/80">${messageSenderName}</div>
            <div class="chat-bubble voice-message-bubble flex items-center gap-3 px-3 py-2 rounded-lg bg-base-200 w-2/5">
                <button id="voice-play-btn" class="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center shrink-0">
                    <svg id="play-icon" class="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-icon lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    <svg id="pause-icon" class="size-4 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause-icon lucide-pause"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
                </button>
                <input type="range" name="voice-progress" id="voice-progress" class="range range-xs appearance-none bg-white w-full h-1 rounded-lg" aria-label="range" max="100">
                <span id="voice-time" class="text-xs ml-auto"></span>
                
                <audio id="voice-audio" class="hidden" src="${data.voice_file_url}"></audio>
            </div>
        `;
        if (data.username === currentUser){
            div.innerHTML += `<time class="text-base-content/80 chat-footer">${messageTime}</time>`;
        } 
        chatbox.appendChild(div);
        if (data.receiver === currentUser){
            const transcribe_div = document.createElement("div");
            transcribe_div.className = "chat chat-receiver";
            transcribe_div.innerHTML = `
                <div class="chat-bubble">${data.translated_text}</div>
                <time class="text-base-content/80 chat-footer">${messageTime} &bull; <span class="italic">Translated from Audio<span></time>
            `;
            chatbox.appendChild(transcribe_div);
        };
        bindVoiceMessageEvents(div.querySelector(".voice-message-bubble"));
        scrollToBottom(100);

        // Update sidebar
        lastMessageTime.textContent = messageTime;
        lastMessageContent.classList.add('flex', 'items-center');
        lastMessageContent.innerHTML = `
        <svg class="h-6 w-6 pr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-icon lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        <p>${data.voice_duration}</p>
        `;
        
    };
    window.handleReceivedVoiceMessage = handleReceivedVoiceMessage;

    // Voice message playing functionalities 
    function bindVoiceMessageEvents(bubble){
        let progress = bubble.querySelector("#voice-progress");
        let audio = bubble.querySelector("#voice-audio");
        let playBtn = bubble.querySelector("#voice-play-btn");
        let playIcon = bubble.querySelector("#play-icon");
        let pauseIcon = bubble.querySelector("#pause-icon");
        let voiceTimeElem = bubble.querySelector("#voice-time");

        let progressInterval;
        progress.value = 0;
        progress.max = 100;
        voiceTimeElem.textContent = formatPlayTime(0);

        function formatPlayTime(seconds){
            seconds = Math.floor(seconds);
            let mins = Math.floor(seconds / 60);
            seconds = seconds % 60;
            if (seconds < 10) seconds = "0" + seconds;
            return mins + ":" + seconds;
        }

        audio.addEventListener("loadedmetadata", function(){
            progress.max = 100;
            progress.value = 0;
            voiceTimeElem.textContent = formatPlayTime(0);
            clearInterval(progressInterval);
        });

        audio.addEventListener("pause", function () {
            clearInterval(progressInterval);
        });
            
        audio.addEventListener("playing", function(){
            clearInterval(progressInterval); 
            progressInterval = setInterval(()=>{
                progress.value = (audio.currentTime / audio.duration) * 100;
                voiceTimeElem.textContent = formatPlayTime(audio.currentTime);
            }, 500);
        });

        audio.addEventListener("ended", function(){
            clearInterval(progressInterval);
            progress.value = 0;
            voiceTimeElem.textContent = formatPlayTime(0);
            pauseIcon.classList.add("hidden");
            playIcon.classList.remove("hidden");
        });

        playBtn.addEventListener("click", function(){
            document.querySelectorAll("audio").forEach(otherAudio => {
                if (otherAudio !== audio) {
                    otherAudio.pause();
                    otherAudio.currentTime = 0;
                    const parent = otherAudio.closest(".voice-message-bubble");
                    parent.querySelector("#play-icon").classList.remove("hidden");
                    parent.querySelector("#pause-icon").classList.add("hidden");
                    parent.querySelector("#voice-progress").value = 0;
                    parent.querySelector("#voice-time").textContent = formatPlayTime(0);
                }
            });

            if (!pauseIcon.classList.contains("hidden")){
                audio.pause();
                pauseIcon.classList.add("hidden");
                playIcon.classList.remove("hidden");
            }else{
                audio.play();
                playIcon.classList.add("hidden");
                pauseIcon.classList.remove("hidden");
            }
        });

        progress.addEventListener("input", function(){
            audio.currentTime = (progress.value / 100) * audio.duration;
            voiceTimeElem.textContent = formatPlayTime(audio.currentTime);
            audio.play();
            playIcon.classList.add("hidden");
            pauseIcon.classList.remove("hidden");
        });

        if (voiceTimeElem.parentElement.parentElement.classList.contains("chat-sender")){
            voiceTimeElem.classList.add("text-primary-content");
        }else{
            voiceTimeElem.classList.add("text-base-content/80");
        }
    };
    document.querySelectorAll(".voice-message-bubble").forEach((bubble) => bindVoiceMessageEvents(bubble));
});
