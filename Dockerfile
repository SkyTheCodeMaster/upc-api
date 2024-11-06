FROM python:3.11-slim

WORKDIR /app

RUN apt update -y && apt install -y git build-essential

RUN git clone https://github.com/SkyTheCodeMaster/upc-api.git /app/

COPY . .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r src/requirements.txt

CMD ["bash", "-c", "ls"]
CMD ["python", "src/main.py"]