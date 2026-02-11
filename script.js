const path = window.location.pathname;
const MONITOR_ID = "fnaf-monitor-room";

if (path.includes("monitor.html")) {

    const grid = document.getElementById("cameraGrid");
    const peer = new Peer(MONITOR_ID);

    peer.on("call", call => {
        call.answer();

        call.on("stream", remoteStream => {

            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.autoplay = true;
            video.playsInline = true;

            grid.appendChild(video);

            // Random flicker
            setInterval(() => {
                if (Math.random() < 0.25) {
                    video.classList.add("flicker");
                    setTimeout(() => {
                        video.classList.remove("flicker");
                    }, 200);
                }
            }, 4000);

        });
    });
}


if (path.includes("camera.html")) {

    const video = document.getElementById("localVideo");
    const peer = new Peer();

    navigator.mediaDevices.getUserMedia({
        video: {
            width: 640,
            height: 480,
            facingMode: "environment"
        },
        audio: false
    }).then(stream => {

        video.srcObject = stream;

        peer.on("open", () => {
            peer.call(MONITOR_ID, stream);
        });

    }).catch(() => {
        alert("Camera access denied.");
    });
}
