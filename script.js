// Constants - Ensure this unique ID matches on both PC and Phone
const MONITOR_ID = "fnaf-security-system-unique-123"; 

// PeerJS Configuration with STUN servers for cross-network connectivity
const peerConfig = {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    config: {
        'iceServers': [{ url: 'stun:stun.l.google.com:19302' }]
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startCameraBtn");
    const cameraGrid = document.getElementById("cameraGrid");

    // Detect page type based on specific elements
    if (startBtn) {
        initCameraPage(startBtn);
    } else if (cameraGrid) {
        initMonitorPage(cameraGrid);
    }
});

// ----------------- CAMERA PAGE LOGIC -----------------
function initCameraPage(btn) {
    const video = document.getElementById("localVideo");
    const statusDiv = document.getElementById("cameraStatus");
    let retryInterval = null;

    // Triggered by the user clicking the START button
    btn.addEventListener("click", async () => {
        btn.disabled = true;
        statusDiv.innerText = "Status: Booting...";

        try {
            // Request camera with preference for back camera (environment)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }, 
                    facingMode: "environment"
                },
                audio: false
            });

            // Display local feed on phone
            video.srcObject = stream;
            video.play();
            btn.style.display = "none";

            const peer = new Peer(undefined, peerConfig);

            peer.on('open', () => {
                statusDiv.innerText = "Status: Searching for Monitor...";
                
                // Continuous retry logic so camera can be started before monitor
                const attemptCall = () => {
                    const call = peer.call(MONITOR_ID, stream);
                    
                    // Updates status to "CONNECTED" once monitor answers
                    call.on('stream', () => {
                        statusDiv.innerText = "Status: CONNECTED"; 
                        statusDiv.style.color = "#00ff00";
                        clearInterval(retryInterval);
                    });
                };

                attemptCall();
                retryInterval = setInterval(attemptCall, 3000);
            });

        } catch (err) {
            statusDiv.innerText = "Error: " + err.message;
            btn.disabled = false;
        }
    });
}

// ----------------- MONITOR PAGE LOGIC -----------------
function initMonitorPage(grid) {
    const peer = new Peer(MONITOR_ID, peerConfig);

    peer.on("call", (call) => {
        // Automatically answer incoming camera feeds
        call.answer(); 
        
        call.on("stream", (remoteStream) => {
            // Prevent duplicate entries for the same camera
            if (document.getElementById(call.peer)) return;

            const container = document.createElement("div");
            container.id = call.peer;

            // Create dedicated label bar for the grid layout
            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `CAM ${grid.children.length + 1} - LIVE`;
            container.appendChild(label);

            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true; 
            video.playsInline = true;
            video.muted = true; // Required for reliable autoplay
            container.appendChild(video);

            grid.appendChild(container);
        });
    });

    // Spacebar blackout toggle
    document.addEventListener("keydown", e => {
        if (e.code === "Space") {
            grid.style.display = (grid.style.display === "none") ? "flex" : "none";
        }
    });
}
