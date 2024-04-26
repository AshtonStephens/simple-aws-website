$version: "2.0"

namespace smithy.example

use aws.protocols#restJson1

@restJson1
@aws.apigateway#integration(
    type: "aws_proxy",
    // Specifies the integration's HTTP method type (for example, POST). For
    // Lambda function invocations, the value must be POST.
    httpMethod: "POST",
    uri: "arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerLambda.Arn}/invocations",
)
@title("Message Service")
service MessageService {
    version: "2024-04-26",
    resources: [
        Message
    ],
    operations: [
        GetMessages
    ]
}

resource Message {
    identifiers: { messageId: String }
    properties: {
        id: String
        message: String
    }
    read: GetMessage
    create: CreateMessage
}

@readonly
@http(method: "GET", uri: "/messages/{messageId}")
operation GetMessage {
    input := for Message {
        @required
        @httpLabel
        $messageId
    }

    output := for Message {
        // "required" is used on output to indicate if the service
        // will always provide a value for the member.
        @required
        $id

        @required
        $message
    }

    errors: [ServiceError, ThrottlingError, NoSuchResource]
}

@http(method: "POST", uri: "/messages")
operation CreateMessage {
    input := for Message {
        @required
        $message
    }

    output := for Message {
        // "required" is used on output to indicate if the service
        // will always provide a value for the member.
        @required
        $id

        @required
        $message
    }

    errors: [ServiceError, ThrottlingError]
}

structure MessageProperties {
    @required
    id: String

    @required
    message: String
}

list Messages {
    member: MessageProperties
}

@readonly
@http(method: "GET", uri: "/messages")
@paginated(inputToken: "nextToken", outputToken: "nextToken", pageSize: "pageSize")
operation GetMessages {
    input := {
        @httpQuery("nextToken")
        nextToken: String

        @httpQuery("pageSize")
        pageSize: Integer
    }

    output := {
        nextToken: String

        @required
        items: Messages
    }

    errors: [ServiceError, ThrottlingError]
}
