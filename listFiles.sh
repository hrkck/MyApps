#!/bin/bash

# Get a list of all files
files=($(find . -type f -not -path "./node_modules*" -not -path "./scripts*"  -not -name "package-lock.json" -not -name ".gitignore" -not -name "listFiles.sh" -not -name "concatenateFiles.sh"))

# Print total number of files
echo "Total files: ${#files[@]}"

# Print the list of files
echo "File list:"
for file in "${files[@]}"; do
  echo "$file"
done
