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
                    vhsOverlay.style.opacity = Math.random() * 0.1 + 0.05; // occasional VHS overlay
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
    const peer = new Peer();

    // Prompt camera permission immediately
    navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        },
        audio: false
    }).then(stream => {

        video.srcObject = stream;

        peer.on("open", () => {
            peer.call(MONITOR_ID, stream);
        });

    }).catch(() => {
        alert("Camera access denied. Please allow camera permissions!");
    });

    // Prevent sleep is handled by Chromebook OS when plugged in
}

    });
}
