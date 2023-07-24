/**
 * @jest-environment jsdom
 */
import { Configuration, DefaultApi, InlineResponse200, MessageData, createConfiguration } from "../src/.generated-sources/openapi";
import { TEST_EXPORTS } from "../src/index";
jest.mock("../src/.generated-sources/openapi");

// Constants
const TEST_INPUT_TEXT_ELEMENT_ID: string = "testInputTextElementId";
const TEST_OUTPUT_ELEMENT_ID: string = "testOutputElementId";
const TEST_MESSAGE_ID: string = "testMessageId";
const TEST_MESSAGE_MESSAGE: string = "testMessageMessage";
const TEST_INPUT_TEXT_VALUE: string = "testInputTestValueString";
const TEST_MESSAGE_COUNT: number = 4;


// Function to create a message data object
function makeMessageData(id?: string, message?: string): MessageData {
  // Create a new message data object
  const messageData: MessageData = new MessageData();

  // Set the id and message properties
  messageData.id = id;
  messageData.message = message;

  // Return the message data object
  return messageData;
}

// A test suite for the functions called on button press.
describe("TestButtonCalls", () => {
  // Create a mock API object
  let mockApi: DefaultApi = new DefaultApi(createConfiguration());
  let mockApiSupplier: Promise<DefaultApi>;

  beforeEach(() => {
    // Set the document body with some boilerplate HTML.
    mockApiSupplier = new Promise<DefaultApi>((resolve, _) => resolve(mockApi))
    document.body.innerHTML =
      '<div>' +
      `  <input type="text" id="${TEST_INPUT_TEXT_ELEMENT_ID}" value="${TEST_INPUT_TEXT_VALUE}">` +
      `  <p id="${TEST_OUTPUT_ELEMENT_ID}"></p>` +
      '</div>';
  });

  // Test that the `createMessage` function updates and reads the correct elements
  it("Verify that create message updates and reads the correct elements.", async () => {

    // Arrange.
    // Mock the `createMessage` function to return a message data object with the expected values
    jest
      .spyOn(DefaultApi.prototype, 'createMessage')
      .mockImplementation((message?: string, _options?: Configuration) => {
        return new Promise<MessageData>((resolve, _) => {
          // Create a message data object with the expected values
          const messageData = makeMessageData(TEST_MESSAGE_ID, TEST_MESSAGE_MESSAGE);

          // Resolve the promise with the message data object
          resolve(messageData);
        });
      });

    // Act.
    // Create a message with the `createMessage` function
    await TEST_EXPORTS.createMessage(
      TEST_INPUT_TEXT_ELEMENT_ID,
      TEST_OUTPUT_ELEMENT_ID,
      mockApiSupplier);

    // Assert.
    expect(document.getElementById(TEST_OUTPUT_ELEMENT_ID).innerHTML)
      .toEqual(TEST_MESSAGE_ID);
    expect(DefaultApi.prototype.createMessage)
      .toBeCalledWith(TEST_INPUT_TEXT_VALUE);
  });

  // Test that the `getMessage` function updates and reads the correct elements
  it("Verify that get message updates and reads the correct elements.", async () => {

    // Arrange.
    jest
      .spyOn(DefaultApi.prototype, 'createMessage')
      .mockImplementation((message?: string, _options?: Configuration) => {
        return new Promise<MessageData>((resolve, _) => {
          // Create a message data object with the expected values
          const messageData = makeMessageData(TEST_MESSAGE_ID, TEST_MESSAGE_MESSAGE);

          // Resolve the promise with the message data object
          resolve(messageData);
        });
      });

    // Act.
    await TEST_EXPORTS.createMessage(
      TEST_INPUT_TEXT_ELEMENT_ID,
      TEST_OUTPUT_ELEMENT_ID,
      mockApiSupplier);

    // Assert.
    expect(document.getElementById(TEST_OUTPUT_ELEMENT_ID).innerHTML)
      .toEqual(TEST_MESSAGE_ID);
    expect(DefaultApi.prototype.createMessage)
      .toBeCalledWith(TEST_INPUT_TEXT_VALUE);
  });

  it("Verify that get message count reads the correct element.", async () => {

    //Arrange.
    jest
      .spyOn(DefaultApi.prototype, 'getMessages')
      .mockImplementation((_options?: Configuration) => {
        return new Promise<InlineResponse200>((resolve, _) => {
          const response: InlineResponse200 = new InlineResponse200();
          response.messageCount = TEST_MESSAGE_COUNT;
          resolve(response);
        });
      });

    // Act.
    await TEST_EXPORTS.getMessageCount(
      TEST_OUTPUT_ELEMENT_ID,
      mockApiSupplier);

    // Assert.
    expect(document.getElementById(TEST_OUTPUT_ELEMENT_ID).innerHTML)
      .toEqual(TEST_MESSAGE_COUNT.toString());
    expect(DefaultApi.prototype.getMessages)
      .toBeCalledTimes(1);
  });

  it("Test invisible error handling for missing HTML Element.", async () => {

    // Arrange.
    const fakeElement: string = "badElementId";
    const originalDocument: Document = document;

    // Act.
    await TEST_EXPORTS.createMessage(fakeElement, fakeElement, mockApiSupplier);
    await TEST_EXPORTS.getMessage(fakeElement, fakeElement, mockApiSupplier);
    await TEST_EXPORTS.getMessageCount(fakeElement, mockApiSupplier);

    // Assert.
    expect(document).toEqual(originalDocument);
  });

});
