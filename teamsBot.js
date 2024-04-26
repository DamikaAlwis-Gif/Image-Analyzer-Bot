const {
  TurnContext,
  MessageFactory,
  TeamsActivityHandler,
  ActivityTypes,
} = require("botbuilder");

const axios = require("axios");
const messages = require("./messages.json");
const {
  callAIService,
  extractMessageDetails,
  getRequestRecievedMessage,
} = require("./functions");

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
          // Send a welcome message to the user
          await context.sendActivities([
            { type: ActivityTypes.Typing },
            { type: "delay", value: 1000 },
            { type: ActivityTypes.Message, text: messages.WELLCOME_MESSAGE },
          ]);
          await next();
        }
      }
    });

    this.onMessage(async (context, next) => {
      // remove the recipient mention from the message
      TurnContext.removeRecipientMention(context.activity);

      const messageDetails = await extractMessageDetails(context);

      if (messageDetails && messageDetails.error) {
        await context.sendActivity(messageDetails.error);
      } else {
        // const requestReceivedMessage =
        //   getRequestRecievedMessage(messageDetails);

        // await context.sendActivity(requestReceivedMessage);
        await context.sendActivity({ type: ActivityTypes.Typing });

        // send a typing indicator in every 5 seconds
        let intervalId = setInterval(async () => {
          await context.sendActivity({ type: ActivityTypes.Typing });
        }, 5000);

        const response = await callAIService(messageDetails);
        if (response) {
          // clear the interval
          clearInterval(intervalId);
          // send the response
          await context.sendActivity(response);
        }
      }
      await next();
    });
  }
}

module.exports.TeamsBot = TeamsBot;
