import io from "socket.io-client";
var socket = io("http://localhost:3080");
export default socket;
window.socket = socket;
socket.on("connect_error", function(err) {
  console.log(err);
});
