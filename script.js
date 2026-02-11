const path = window.location.pathname;
const MONITOR_ID = "fnaf-monitor-main";
let blackout = false;

// ----------------- MONITOR -----------------
if (path.includes("monitor.html")) {

    const grid = document.getElementById("cameraGrid");
    const vhsOverlay = document.getElementById("vhsOverlay");
    const peer = new Peer(MONITOR_ID);

    peer.on("call", call => {
        call.answer();

        call.on("stream", remoteStream => {

            const container = document.createElement("div");
            container.style.position = "relative";

            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true;
            video.playsInline = true;
            video.width = 320;
            video.height = 240;
            container.appendChild(video);

            const label = document.createElement("div");
            label.className = "camera-label";
            label.innerText = `CAM ${grid.children.length + 1}`;
            container.appendChild(label);

            grid.appendChild(container);

            // Random flicker / glitch
            setInterval(() => {
                if (Math.random() < 0.25) {
                    video.classList.add("flicker");
                    vhsOverlay.style.opacity = Math.random() * 0.1 + 0.05;
                    setTimeout(() => {
                        video.classList.remove("flicker");
                        vhsOverlay.style.opacity = 0;
                    }, 200);
                }
            }, 4000);
        });
    });

    // Spacebar blackout toggle
    document.addEventListener("keydown", e => {
        if (e.code === "Space") {
            blackout = !blackout;
            grid.style.display = blackout ? "none" : "grid";
        }
    });
}

// ----------------- CAMERA -----------------
if (path.includes("camera.html")) {

    const video = document.getElementById("localVideo");
    const statusDiv = document.getElementById("cameraStatus");
    const startBtn = document.getElementById("startCameraBtn");

    function updateStatus(msg) {
        statusDiv.innerText = `Status: ${msg}`;
    }

    startBtn.addEventListener("click", () => {

        startBtn.disabled = true;
        updateStatus("Initializing Peer connection...");

        // Explicit PeerJS options for mobile compatibility
        const peer = new Peer(undefined, {
            host: '0.peerjs.com',
            port: 443,
            secure: true
        });

        peer.on('open', id => {
            updateStatus("Peer connected, requesting camera...");

            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            }).then(stream => {

                video.srcObject = stream;
                updateStatus("Camera ready, connecting to monitor...");

                const call = peer.call(MONITOR_ID, stream);

                call.on("close", () => updateStatus("Monitor disconnected"));
                call.on("error", () => updateStatus("Connection error!"));
                updateStatus("Connected to monitor!");

                // Hide start button
                startBtn.style.display = "none";

            }).catch(err => {
                console.error(err);
                updateStatus("Camera access denied!");
                alert("Camera access denied! Please allow permissions.");
            });

        });

        peer.on('error', err => {
            console.error(err);
            updateStatus("PeerJS error: " + err);
            startBtn.disabled = false;
        });

    });
}
