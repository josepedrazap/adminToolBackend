const chatBot = require("./chatBot");

exports.index = socket => {
  socket.on("newChatMessage", message => newChatMessage({ socket, message }));
};

const newChatMessage = async ({ socket, message }) => {
  message = JSON.parse(message);

  socket.emit(
    "newChatMessage_" + message.entityID,
    JSON.stringify({
      type: "typing"
    })
  );
  var response = await chatBot.chatAnswer(message.text);

  setTimeout(() => {
    socket.emit(
      "newChatMessage_" + message.entityID,
      JSON.stringify({
        type: "message",
        text: response
      })
    );
  }, 500);
};
