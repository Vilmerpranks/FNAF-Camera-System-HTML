// Change this to something unique to you
const MONITOR_ID = "fnaf-security-system-001"; 

// STUN servers help devices find each other across different networks (Phone vs PC)
const peerConfig = {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    config: {
        'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' }
        ]
    },
    debug: 1
};

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startCameraBtn");
    const cameraGrid = document.getElementById("cameraGrid");

    if (startBtn) {
        initCameraPage(startBtn);
    } else if (cameraGrid) {
        initMonitorPage(cameraGrid);
    }
});

// ----------------- CAMERA LOGIC -----------------
function initCameraPage(btn) {
    const video = document.getElementById("localVideo");
    const statusDiv = document.getElementById("cameraStatus");
    let retryInterval = null;

    function updateStatus(msg) {
        statusDiv.innerText = `Status: ${msg}`;
    }

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        updateStatus("Initializing Camera...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 },
                    facingMode: "environment" // Uses back camera on phones
                },
                audio: false
            });

            video.srcObject = stream;
            video.play();
            btn.style.display = "none";

            const peer = new Peer(undefined, peerConfig);

            peer.on('open', () => {
                updateStatus("Searching for Monitor... (Open Monitor now)");
                
                // Function to attempt the call
                const attemptCall = () => {
                    console.log("Attempting to connect to monitor...");
                    const call = peer.call(MONITOR_ID, stream);
                    
                    // If we don't get a 'stream' back or error, we keep trying
                    call.on('stream', () => {
                        updateStatus("CONNECTED - STREAMING LIVE");
                        clearInterval(retryInterval);
                    });

                    call.on('error', () => {
                        console.log("Monitor not found yet, retrying...");
                    });
                };

                // Try to call every 3 seconds so you can start Camera FIRST
                attemptCall();
                retryInterval = setInterval(attemptCall, 3000);
            });

        } catch (err) {
            updateStatus("Camera Error: " + err.message);
            btn.disabled = false;
        }
    });
}

// ----------------- MONITOR LOGIC -----------------
function initMonitorPage(grid) {
    const peer = new Peer(MONITOR_ID, peerConfig);

    peer.on('open', (id) => {
        console.log("Monitor Listening on ID: " + id);
    });

    peer.on("call", (call) => {
        console.log("Camera found! Connecting...");
        call.answer(); 
        
        call.on("stream", (remoteStream) => {
            // Check if this camera is already on screen
            if (document.getElementById(call.peer)) return;

            const container = document.createElement("div");
            container.id = call.peer;
            container.style.position = "relative";

            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true; 
            video.playsInline = true;
            video.muted = true; 
            container.appendChild(video);

            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `CAM ${grid.children.length + 1}`;
            container.appendChild(label);

            grid.appendChild(container);
        });
    });
}
