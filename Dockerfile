FROM python:3.11-slim

WORKDIR /app

RUN apt update -y && apt install -y git build-essential tree

# Clone the repository
RUN git clone https://github.com/SkyTheCodeMaster/upc-api.git /app/

# Copy the current directory into the cloned repo

# Install requirements
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r ./src/requirements.txt

COPY /app/src/ /app/src/

# Run the main script
#CMD ["python", "/app/upc-api/src/main.py"]
CMD ["tree", "/app/"]