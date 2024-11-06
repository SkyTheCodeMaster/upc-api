FROM python:3.11-slim

WORKDIR /app

RUN apt update -y && apt install -y git build-essential

# Clone the repository into a subdirectory
RUN git clone https://github.com/SkyTheCodeMaster/upc-api.git ./upc-api

# Copy the contents of the current directory into the cloned repo
COPY . ./upc-api/

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r ./upc-api/src/requirements.txt

# Verify the contents of the directory
CMD ["bash", "-c", "ls -R ./upc-api"]

# Run the main script
CMD ["python", "./upc-api/src/main.py"]