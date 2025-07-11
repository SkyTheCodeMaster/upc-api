FROM python:3.11-slim

COPY . /app/
WORKDIR /app/src/

RUN apt update -y && apt install -y git build-essential tree

# Clone the repository
#RUN git clone https://github.com/SkyTheCodeMaster/upc-api.git /app/

# Copy the current directory into the cloned repo

# Install requirements
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r ./requirements.txt


# Run the main script
CMD ["python", "main.py"]
