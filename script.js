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
        
        // 1. Disable button immediately
        startBtn.disabled = true;
        updateStatus("Requesting camera permissions...");

        // 2. Request Camera IMMEDIATELY (This triggers the browser prompt)
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30 }
            },
            audio: false
        }).then(stream => {
            
            // 3. Camera allowed! Show it locally.
            video.srcObject = stream;
            video.play(); // Ensure playback starts
            startBtn.style.display = "none"; // Hide the button
            updateStatus("Camera active! Connecting to network...");

            // 4. NOW initialize the network connection
            const peer = new Peer(undefined, {
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });

            peer.on('open', id => {
                updateStatus("Connected to network. Calling monitor...");
                
                const call = peer.call(MONITOR_ID, stream);

                call.on("close", () => updateStatus("Monitor disconnected"));
                call.on("error", (err) => updateStatus("Call error: " + err));
                
                updateStatus("System Online. Streaming...");
            });

            peer.on('error', err => {
                console.error(err);
                updateStatus("Network Error: " + err.type);
            });

        }).catch(err => {
            console.error("Camera Error:", err);
            updateStatus("Camera access denied or error!");
            alert("Could not start camera. Please ensure you clicked 'Allow' and are using HTTPS or localhost.");
            startBtn.disabled = false; // Re-enable button to try again
        });
    });
}
