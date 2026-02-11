// Constants
const MONITOR_ID = "fnaf-monitor-main";

// ----------------- PAGE DETECTION -----------------
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

    function updateStatus(msg) {
        statusDiv.innerText = `Status: ${msg}`;
    }

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        updateStatus("Requesting Camera...");

        try {
            // 1. Trigger the browser prompt IMMEDIATELY
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });

            // 2. Show the local feed
            video.srcObject = stream;
            video.play();
            btn.style.display = "none";
            updateStatus("Camera Active. Connecting to Network...");

            // 3. Start PeerJS AFTER camera is confirmed
            const peer = new Peer(undefined, {
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });

            peer.on('open', (id) => {
                updateStatus("System Online. Calling Monitor...");
                const call = peer.call(MONITOR_ID, stream);
                
                call.on('error', (err) => updateStatus("Connection Error: " + err));
            });

            peer.on('error', (err) => {
                updateStatus("Network Error: " + err.type);
                btn.disabled = false;
            });

        } catch (err) {
            console.error(err);
            updateStatus("ERROR: Camera Access Denied");
            alert("Camera access denied! Please check your site settings in the URL bar.");
            btn.disabled = false;
        }
    });
}

// ----------------- MONITOR LOGIC -----------------
function initMonitorPage(grid) {
    const peer = new Peer(MONITOR_ID);
    const vhsOverlay = document.getElementById("vhsOverlay");

    peer.on("call", (call) => {
        call.answer();
        call.on("stream", (remoteStream) => {
            const container = document.createElement("div");
            container.style.position = "relative";

            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true;
            video.playsInline = true;
            container.appendChild(video);

            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `CAM ${grid.children.length + 1}`;
            container.appendChild(label);

            grid.appendChild(container);
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            grid.style.display = (grid.style.display === "none") ? "grid" : "none";
        }
    });
}
