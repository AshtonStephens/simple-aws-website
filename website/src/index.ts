import { createConfiguration, DefaultApi, ServerConfiguration } from "./.generated-sources/openapi"
import { MessageServerConfig } from "./config_interface";

/**
 * Gets the configured API.
 *
 * @returns A promise that resolves to the configured API.
 */
function ConfiguredApi(): Promise<DefaultApi> {
  // Fetch the configuration file.
  return fetch("config.json")
    // Convert the response to text.
    .then((result) => result.text())
    // Parse the configuration file into a MessageServerConfig object.
    .then(textResponse => {

      // Read api config.
      const apiConfig: MessageServerConfig = JSON.parse(textResponse);

      // Trim final `/` if included to meet the expectations of our autogenerated client.
      const apiEndpoint: string = apiConfig.apiEndpoint.endsWith("/")
          ? apiConfig.apiEndpoint.substring(0, apiConfig.apiEndpoint.length)
          : apiConfig.apiEndpoint;

      // Create a configuration object for the API.
      const configuration = createConfiguration({
        baseServer: new ServerConfiguration(apiEndpoint, {})
      });

      // Create a new DefaultApi object.
      return new DefaultApi(configuration);
    });
}

function getMessageCount(
  elementIdToSet: string,
  configuredApi: Promise<DefaultApi>
) {
  // Get the HTML element to set the message count to.
  console.log("henlo!");
  const htmlElementToSet: HTMLElement | null = document.getElementById(elementIdToSet);
  if (htmlElementToSet !== null) {
    // Get the configured API.
    configuredApi
      // Get the message count from the API.
      .then((api) => api.getMessages())
      // Convert the message count to a string.
      .then((response) => response.messageCount.toString())
      // Set the message count in the HTML element.
      .then((messageCountString) => htmlElementToSet.innerHTML = messageCountString);
  }
}

/**
 * Creates a message with the input in `messageToSend` and displays the message id assigned by the server
 * in the html element `sentMessageId`.
 */
function createMessage(
  elementIdToGet: string,
  elementIdToSet: string,
  configuredApi: Promise<DefaultApi>
) {
  // Get the HTML elements to set the message ID to.
  const htmlElementWithMessage: HTMLInputElement | null = document.getElementById(elementIdToGet) as HTMLInputElement;
  const htmlElementToSet: HTMLElement | null = document.getElementById(elementIdToSet);

  if (htmlElementToSet !== null && htmlElementWithMessage !== null) {
    // Get the configured API.
    configuredApi
      // Create a message with the given message.
      .then((api) => api.createMessage(htmlElementWithMessage.value))
      // Get the ID of the created message.
      .then((messageData) => messageData.id)
      // Set the message ID in the HTML element.
      .then((messageId) => htmlElementToSet.innerHTML = messageId);
  }
}

/**
 * Gets a message with the id the input `messageId` and displays the message assigned by the server
 * in the html element `messageFromId`.
 */
function getMessage(
  elementIdToGet: string,
  elementIdToSet: string,
  configuredApi: Promise<DefaultApi>
) {
  // Get the HTML elements to set the message to.
  const htmlElementWithId: HTMLInputElement | null = document.getElementById(elementIdToGet) as HTMLInputElement;
  const htmlElementToSet: HTMLElement | null = document.getElementById(elementIdToSet);

  if (htmlElementToSet !== null && htmlElementWithId !== null) {
    configuredApi
      // Get the message with the given ID.
      .then((api) => api.getMessage(htmlElementWithId.value))
      // Get the message.
      .then((messageData) => messageData.message)
      // Set the message in the HTML element.
      .then((messageCountString) => htmlElementToSet.innerHTML = messageCountString);
  }
}

// Export functions used by the main site.
export default {

  /**
   * Gets the message count and displays it in the `messagecount` html element.
   */
  getMessageCount(elementIdToSet: string) {
    return getMessageCount(elementIdToSet, ConfiguredApi());
  },

  /**
   * Creates a message with the input in `messageToSend` and displays the message id assigned by the server
   * in the html element `sentMessageId`.
   */
  createMessage(elementIdToGet: string, elementIdToSet: string) {
    return createMessage(elementIdToGet, elementIdToSet, ConfiguredApi());
  },

  /**
   * Gets a message with the id the input `messageId` and displays the message assigned by the server
   * in the html element `messageFromId`.
   */
  getMessage(elementIdToGet: string, elementIdToSet: string) {
    return getMessage(elementIdToGet, elementIdToSet, ConfiguredApi());
  }
}