FROM python:3.11-slim

WORKDIR /app

RUN apt update -y && apt install -y git build-essential

# Clone the repository
RUN git clone https://github.com/SkyTheCodeMaster/upc-api.git /app/upc-api

# Copy the current directory into the cloned repo
COPY . /app/upc-api/

# Install requirements
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r ./upc-api/src/requirements.txt

# Verify the contents of the directory
RUN ls -R ./upc-api

# Run the main script
CMD ["python", "/app/upc-api/src/main.py"]