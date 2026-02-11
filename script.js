// Change this slightly to something unique to you so other people don't clash
const MONITOR_ID = "fnaf-security-system-001"; 

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

    function updateStatus(msg) {
        statusDiv.innerText = `Status: ${msg}`;
        console.log(msg);
    }

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        updateStatus("Initializing Camera...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false
            });

            video.srcObject = stream;
            video.play();
            btn.style.display = "none";

            const peer = new Peer(); // Random ID for camera

            peer.on('open', () => {
                updateStatus("Connecting to Monitor...");
                const call = peer.call(MONITOR_ID, stream);
                
                // Timeout if monitor doesn't answer in 5 seconds
                const timeout = setTimeout(() => {
                    updateStatus("Monitor Not Responding. Is the Monitor tab open?");
                    btn.style.display = "inline-block";
                    btn.disabled = false;
                }, 5000);

                call.on('stream', () => {
                    clearTimeout(timeout);
                    updateStatus("LIVE FEED ESTABLISHED");
                });
            });

        } catch (err) {
            updateStatus("Camera Denied.");
            btn.disabled = false;
        }
    });
}

function initMonitorPage(grid) {
    // Setting 'debug: 3' helps us see errors in the console (F12)
    const peer = new Peer(MONITOR_ID, { debug: 2 });

    peer.on('open', (id) => {
        console.log("Monitor Online: " + id);
    });

    peer.on("call", (call) => {
        console.log("Incoming camera feed...");
        
        // We MUST answer and then wait for the stream event
        call.answer(); 
        
        call.on("stream", (remoteStream) => {
            // Check if this video already exists to prevent duplicates
            if (document.getElementById(call.peer)) return;

            const container = document.createElement("div");
            container.id = call.peer;
            container.style.position = "relative";

            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true; 
            video.playsInline = true;
            video.muted = true; // High importance: helps autoplay work
            container.appendChild(video);

            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `CAM ${grid.children.length + 1}`;
            container.appendChild(label);

            grid.appendChild(container);
            console.log("Streaming started!");
        });
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            alert("This Monitor ID is already in use. Please wait 30 seconds and refresh.");
        }
        console.error("PeerJS Error:", err);
    });
}
