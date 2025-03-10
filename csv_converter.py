import pandas as pd
import json

# Load the CSV data
df = pd.read_csv("csv.csv")

# Create a dictionary with names as keys and phone numbers as values
phonebook = dict(zip(df['Nama Lengkap'], df['No. Handphone']))

# Update the phone numbers by replacing '886' with '0' and '62' with '0'
updated_phonebook = {
    name: str(phone).replace('886', '0', 1).replace('62', '0', 1)
    if str(phone).startswith(('886', '62')) else str(phone)
    for name, phone in phonebook.items()
}

# Save the updated JSON data to a new file
updated_json_file_path = 'password.json'
with open(updated_json_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(updated_phonebook, json_file, ensure_ascii=False, indent=4)

print(f"Updated phonebook has been saved to {updated_json_file_path}")
