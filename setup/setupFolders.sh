while read -r line; do
echo $line
mkdir -p $line
done < setup/folders.txt