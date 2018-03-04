import io from "socket.io-client";
var socket = io("http://localhost:3080", { transports: ["websocket"] });
export default socket;
window.socket = socket;
socket.on("connect_error", function(err) {
  console.log(err);
});
socket.on("error", function(err) {
  console.log(err);
});
