const chatBot = require("./chatBot");

exports.index = (socket) => {
  socket.on("NEW_CHAT_MESSAGE", (message) =>
    newChatMessage({ socket, message })
  );
};

const newChatMessage = async ({ socket, message }) => {
  socket.emit("INCOMING_MESSAGE::" + message.entityID, {
    type: "TYPING",
  });

  var response = await chatBot.chatAnswer({
    text: message.data,
    entityID: message.entityID,
    type: message.userType,
    socket,
  });

  setTimeout(() => {
    socket.emit("INCOMING_MESSAGE::" + message.entityID, {
      type: "MESSAGE",
      text: response,
    });
  }, 500);
};
