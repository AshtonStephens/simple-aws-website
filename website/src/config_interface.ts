/**
 * @interface MessageServerConfig
 * @description This interface represents a configuration file for the message server.
 * @property {string} apiEndpoint The API endpoint for the message server.
 */
export interface MessageServerConfig {

    // The API endpoint for the message server.
    readonly apiEndpoint: string;
}