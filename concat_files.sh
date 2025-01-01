#!/bin/bash

# List of file paths and glob patterns
patterns=(
    "/src/*.js"
    "/src/**/*.js"
	"/src/**/*.css"
    "tailwind.config.js",
    ".github/workflows/deploy.yml"
)

# Output file
output_file="source_code.txt"

# Empty the output file if it exists or create it
> "$output_file"

# Function to process a file
process_file() {
    local file_path="$1"
    echo "Processing: $file_path"
    echo "// $file_path" >> "$output_file"
    echo "" >> "$output_file"
    cat "$file_path" >> "$output_file"
    echo "" >> "$output_file"
    echo "" >> "$output_file"
}

# Counter for processed files
processed_files=0

# Process each pattern in the list
for pattern in "${patterns[@]}"; do
    echo "Processing pattern: $pattern"
    # Use find with -path for double-star patterns, and regular glob for others
    if [[ $pattern == *"**"* ]]; then
        while IFS= read -r -d $'\0' file; do
            if [[ "$file" != *"/node_modules/"* ]]; then
                process_file "$file"
                ((processed_files++))
            fi
        done < <(find . -path "*${pattern#**/}" -type f -print0 | sort -z)
    else
        for file in $pattern; do
            if [[ -f "$file" && "$file" != *"/node_modules/"* ]]; then
                process_file "$file"
                ((processed_files++))
            fi
        done
    fi
done

echo "Concatenation complete. $processed_files files processed."
echo "Output written to $output_file"