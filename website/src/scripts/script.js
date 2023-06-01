// This file defines the functions for populating the page with responses from
// the message API.

// The `apigClient` variable is a global variable that represents the API client
// and uses hardcoded access keys.
//
// TODO: adjust based on region and stage, ideally within a config.
var apigClient = apigClientFactory.newClient({
    accessKey: 'AKIA2ZSOLEBV4CRDIYSP',
    secretKey: '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',
});

/**
 * Gets the message count from the API.
 */
function getMessageCount() {
    return apigClient.messagesGet().then(function(result) {
        document.getElementById("messagecount").innerHTML = result.data.message_count;
    });
}

/**
 * Sends a message to the API.
 */
function sendMessage() {
    var messageToSend = document.getElementById("messageToSend").value;
    return apigClient.messagesPost(undefined, messageToSend).then(function(result) {
        document.getElementById("sentMessageId").innerHTML = result.data.id;
    });
}

/**
 * Gets a message from the API.
 */
function getMessage() {
    var params = {
        'message_id': document.getElementById("messageToRetrieve").value,
    };
    return apigClient.messagesMessageIdGet(params).then(function(result) {
        document.getElementById("retrievedMessageString").innerHTML = result.data.message;
    });
}
