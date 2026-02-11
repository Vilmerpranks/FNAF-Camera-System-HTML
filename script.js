const MONITOR_ID = "fnaf-security-system-001"; 

const peerConfig = {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    config: {
        'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' }
        ]
    }
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
                video: { width: 1280, height: 720, facingMode: "environment" },
                audio: false
            });

            video.srcObject = stream;
            video.play();
            btn.style.display = "none";

            const peer = new Peer(undefined, peerConfig);

            peer.on('open', () => {
                updateStatus("Searching for Monitor...");
                
                const attemptCall = () => {
                    const call = peer.call(MONITOR_ID, stream);
                    
                    // Logic to detect if monitor actually answered
                    call.on('stream', () => {
                        updateStatus("CONNECTED"); // Now correctly updates to Connected
                        clearInterval(retryInterval);
                    });
                };

                attemptCall();
                // Retries every 3 seconds if monitor isn't open yet
                retryInterval = setInterval(attemptCall, 3000);
            });

        } catch (err) {
            updateStatus("Error: " + err.message);
            btn.disabled = false;
        }
    });
}

function initMonitorPage(grid) {
    const peer = new Peer(MONITOR_ID, peerConfig);

    peer.on("call", (call) => {
        call.answer(); 
        
        call.on("stream", (remoteStream) => {
            if (document.getElementById(call.peer)) return;

            const container = document.createElement("div");
            container.id = call.peer;

            // 1. Create the Label Bar first
            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `[ LIVE FEED ] - CAM ${grid.children.length + 1}`;
            container.appendChild(label);

            // 2. Create the Video
            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true; 
            video.playsInline = true;
            video.muted = true; 
            container.appendChild(video);

            grid.appendChild(container);
        });
    });
}
