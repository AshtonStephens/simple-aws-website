#!/bin/sh

# Command line arguments are provided.
echo "--arg: $2"

# Print out the provided environment variables.
echo "SMITHY_ROOT_DIR: ${SMITHY_ROOT_DIR}"
echo "SMITHY_PLUGIN_DIR: ${SMITHY_PLUGIN_DIR}"
echo "SMITHY_PROJECTION_NAME: ${SMITHY_PROJECTION_NAME}"
echo "SMITHY_ARTIFACT_NAME: ${SMITHY_ARTIFACT_NAME}"
echo "SMITHY_INCLUDES_PRELUDE: ${SMITHY_INCLUDES_PRELUDE}"

# Copy the model from stdin and write it to copy-model.json.
# The process is run in the appropriate working directory for the
# plugin ID's artifact name.
cat >> copy-model.json