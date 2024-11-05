FROM python:3.13-slim

WORKDIR /app

RUN git -C /app/ clone https://github.com/SkyTheCodeMaster/upc-api.git

RUN echo $(ls)

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]