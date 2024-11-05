FROM python:3.13-slim

WORKDIR /app

RUN apt update && apt install -y git

RUN git -C /app/ clone https://github.com/SkyTheCodeMaster/upc-api.git

RUN echo $(ls)

COPY . .

RUN pip install --no-cache-dir -r src/requirements.txt


CMD ["python", "main.py"]