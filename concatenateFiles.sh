#!/bin/bash

# Get a list of all JavaScript files (excluding certain directories and files) and concatenate their content
allCode=$(find . -type f  \
  -not -path "./node_modules*" \
  -not -path "./scripts*" \
  -not -path "./public*" \
  -not -name "package-lock.json" \
  -not -name ".gitignore" \
  -not -name "listFiles.sh" \
  -not -name "concatenateFiles.sh" \
  -exec cat {} +)

# Print the concatenated content to a file
echo "$allCode" > all_code.txt

# Optionally, also display the concatenated content
echo "$allCode"
