const MONITOR_ID = "fnaf-security-system-unique-123"; // Make sure this matches on both ends

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

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        statusDiv.innerText = "Status: Booting...";

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }, 
                    facingMode: "environment"
                },
                audio: false
            });

            video.srcObject = stream;
            video.play();
            btn.style.display = "none";

            const peer = new Peer(undefined, peerConfig);

            peer.on('open', () => {
                statusDiv.innerText = "Status: Searching for Monitor...";
                
                const attemptCall = () => {
                    const call = peer.call(MONITOR_ID, stream);
                    
                    // This triggers when the monitor successfully receives the video
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

function initMonitorPage(grid) {
    const peer = new Peer(MONITOR_ID, peerConfig);

    peer.on("call", (call) => {
        call.answer(); // Automatically answer
        
        call.on("stream", (remoteStream) => {
            if (document.getElementById(call.peer)) return;

            const container = document.createElement("div");
            container.id = call.peer;

            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `CAM ${grid.children.length + 1} - LIVE`;
            container.appendChild(label);

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
