FROM python:3.11-slim

WORKDIR /app

RUN ls 1>$2
RUN apt update -y && apt install -y git build-essential

COPY . .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r src/requirements.txt

CMD ["bash", "-c", "ls"]
CMD ["python", "src/main.py"]