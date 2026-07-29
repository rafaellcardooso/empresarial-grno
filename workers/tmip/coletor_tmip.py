import paramiko
import pandas as pd

HOST = "10.53.16.35"
USER = "inventa"
PASS = "Compaq.20"

arquivo_remoto = "/inventa/PauloCesar/mais6HorasNorte.csv"
arquivo_local = "/usr/local/empresarial/workers/tmip/dados/mais6HorasNorte.csv"

transport = paramiko.Transport((HOST, 22))
transport.connect(username=USER, password=PASS)

sftp = paramiko.SFTPClient.from_transport(transport)
sftp.get(arquivo_remoto, arquivo_local)

sftp.close()
transport.close()

df = pd.read_csv(arquivo_local)
print(df.head())
