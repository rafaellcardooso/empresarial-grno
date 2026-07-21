import asyncio
import re
import os
import requests
import requests.exceptions
import logging
import time
import subprocess
import telegram
from easysnmp import Session
from fpdf import FPDF
from pyvirtualdisplay import Display
from functions.mensagens import get_msg, get_ajuda, get_sobre
from PIL import Image
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import CommandHandler, CallbackQueryHandler, CallbackContext
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Habilita o log
logger = logging.getLogger(__name__)

# Constantes
IMAGE_DIR = "/opt/telegram/sirRede/telegram/img"
FILE_PATH = "/opt/telegram/sirRede/telegram/tools/graficos.txt"
WAIT_TIMEOUT = 30
GRAFICOS_TXT_FILE = "/opt/telegram/sirRede/telegram/tools/graficos.txt"
GRAFICOS_PDF_FILE = "/opt/telegram/sirRede/telegram/tools/graficos.pdf"
username = "telegram"
password = "telegramconsultor"

# Função para aguardar a visibilidade de um elemento (assincrona)
async def wait_for_element_visibility(driver, by, value, timeout=WAIT_TIMEOUT):
    print(f"Esperando elemento: {by}={value} por até {timeout} segundos...")
    wait = WebDriverWait(driver, timeout)
    return await asyncio.to_thread(wait.until, EC.visibility_of_element_located((by, value)))

# Função para capturar screenshot da página (assincrona)
async def capture_screenshot(driver, filename):
    print(f"Capturando screenshot em: {filename}")
    await asyncio.to_thread(driver.save_screenshot, filename)

# Função para redimensionar a janela do navegador (assincrona)
async def resize_browser_window(driver, width, height):
    print(f"Redimensionando janela do navegador para {width}x{height}...")
    await asyncio.to_thread(driver.set_window_size, width, height)
#s
# Função para enviar conclusão (assíncrona)
async def send_conclusao(update, usuario):
    print(f"Enviando mensagem de conclusão para o usuário: {usuario}")
    
    # Verifica se o update é de uma mensagem regular ou de um callback
    message = update.message if update.message else update.callback_query.message

    await message.reply_text(f"*Consulta concluída.*", parse_mode="Markdown")

# Função para enviar ajuda (assíncrona)
async def help_command(update, context, usuario):
    user = update.effective_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    chat = update.effective_chat
    gruponame = chat.title

    print(f"Enviando ajuda para {usuario} no grupo {gruponame}.")
    await update.message.reply_markdown(get_ajuda(usuario, gruponame))

# Função para realizar o login (assíncrona)
async def perform_login(driver, username, password):
    print(f"Realizando login com o usuário: {username}")
    username_field = await wait_for_element_visibility(driver, By.NAME, "user")
    password_field = await wait_for_element_visibility(driver, By.NAME, "password")

    # Preencher os campos de usuário e senha
    username_field.send_keys(username)
    password_field.send_keys(password)

    # Submeter o formulário de login
    password_field.send_keys(Keys.RETURN)

# Função para realizar o logout
async def perform_logout(driver):
    print("Tentando logout via URL direta...")
    try:
        # Abrir a URL de logout
        await asyncio.to_thread(driver.get, 'http://192.168.0.245:3000/logout')
        print("Logout via URL direta executado com sucesso.")
    except Exception as e:
        print(f"Erro no logout via URL direta: {e}")

# Função para processar a consulta
async def processar_consulta(
    update, context, usuario, designacao, pasta, grafico, username, password
):
    print(f"Iniciando consulta para o gráfico: {designacao}")

    if not designacao:
        print("Erro: designacao está vazia!")
        return

    print(f"Enviando mensagem de consulta para o gráfico: {designacao}")

    message = update.message if update.message else update.callback_query.message

    try:
        await message.chat.send_message(
            f"*{usuario}*, exibindo a consulta para o dashboard: *{designacao}*..\nCada consulta dura em média *40s*. Por favor, aguarde!",
            parse_mode="markdown",
        )
    except Exception as e:
        print(f"Erro ao enviar mensagem de consulta: {e}")
        return

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    tentativas = 0

    while tentativas < 3:
        driver = None
        try:
            print(f"Tentativa {tentativas + 1} de realizar consulta.")
            print("Inicializando o driver do Selenium...")
            chromedriver_path = '/usr/local/bin/chromedriver'
            service = Service(chromedriver_path)
            driver = webdriver.Chrome(service=service, options=chrome_options)

            if driver.capabilities:
                print("Driver do Selenium iniciado com sucesso!")

            url = f'http://192.168.0.245:3000/d/claro-sls-{pasta}/{grafico}?&kiosk'
            print(f"Navegando para a URL: {url}")
            driver.get(url)

            print("Aguardando carregamento da página...")
            await asyncio.sleep(10)

            print("Realizando login...")
            await perform_login(driver, username, password)

            print("Redimensionando a janela do navegador...")
            await resize_browser_window(driver, 1920, 1080)

            await asyncio.sleep(10)

            screenshot_path = os.path.join(IMAGE_DIR, f"{designacao}.png")
            print(f"Capturando screenshot para {screenshot_path}...")
            await capture_screenshot(driver, screenshot_path)

            with open(screenshot_path, "rb") as img_file:
                await message.chat.send_document(document=img_file)

            print(f"Imagem {designacao}.png enviada com sucesso.")
            await send_conclusao(update, usuario)
            os.remove(screenshot_path)

            break  # Sucesso, sair do loop

        except (requests.exceptions.RequestException, Exception) as e:
            print(f"Erro ao processar a consulta: {e}")
            await message.reply_text(
                f"*{usuario}*, ocorreu um erro ao processar a consulta: {e}",
                parse_mode="markdown",
            )
            await message.reply_text(
                f"Tentando novamente a consulta para o gráfico: *{designacao}*.",
                parse_mode="markdown",
            )
            tentativas += 1
            await asyncio.sleep(5)

        finally:
            if driver:
                try:
                    await perform_logout(driver)
                    print("Logout realizado com sucesso.")
                except Exception as e:
                    print(f"Erro ao tentar realizar logout: {e}")

                try:
                    driver.quit()
                    print("Sessão do Selenium encerrada com sucesso.")
                except Exception as e:
                    print(f"Erro ao tentar finalizar a sessão do Selenium: {e}")

    if tentativas >= 3:
        print(f"Falha após {tentativas} tentativas de consulta.")
        await message.reply_text(
            f"*{usuario}*, todas as tentativas de consulta falharam.",
            parse_mode="markdown",
        )

# Função para listar as pastas (LINKS, ROTEADORES, etc.)
async def lista_pastas():
    pastas = [
        ('SIR', 'SIR'),
    ]
    keyboard = [[InlineKeyboardButton(pasta_name, callback_data=f"pasta_{pasta_code}")] for pasta_name, pasta_code in pastas]

    # Adicionando o botão de cancelamento
    keyboard.append([InlineKeyboardButton("❌ Cancelar", callback_data="cancelar_selecao")])

    return InlineKeyboardMarkup(keyboard)

# Função para listar os dashboards de acordo com a pasta selecionada
async def lista_dashboards(update, context, pasta_code):
    query = update.callback_query
    await query.answer()  # Responde ao callback para evitar "loading" no botão

    # Dashboards específicos para cada pasta
    dashboards_por_pasta = {
        "SIR": ["REC/RAL"],
    }

    # Pega a lista de dashboards baseada na pasta selecionada
    dashboards = dashboards_por_pasta.get(pasta_code, [])

    if not dashboards:
        logger.warning(f"Nenhum dashboard definido para a pasta: {pasta_code}")

    # Criar os botões para cada dashboard
    keyboard = [[InlineKeyboardButton(dashboard, callback_data=f"dashboard_{pasta_code}_{dashboard}")] for dashboard in dashboards]

    # Adiciona botão de VOLTAR
    keyboard.append([InlineKeyboardButton("⬅️ Voltar", callback_data="voltar_pastas")])

    # Log para depuração
    logger.info(f"Keyboard criado para {pasta_code}: {keyboard}")

    # Edita a mensagem para mostrar os dashboards disponíveis
    if query.message:
        try:
            await query.edit_message_text(
                text=f"Escolha um dashboard para a pasta {pasta_code}:",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Erro ao editar mensagem: {str(e)}")
    else:
        logger.error("A mensagem original não foi encontrada.")
# Função para enviar a seleção de pastas
async def send_consultas(update, context):
    chat = update.effective_chat
    from_username = update.message.from_user.username

    if chat.type != chat.PRIVATE or (chat.type == chat.PRIVATE and from_username == "RafaelSLS"):
        try:
            # Envia a mensagem de seleção de pasta
            pasta_message = await context.bot.send_message(
                update.message.chat_id,
                "Selecione uma pasta:",
                reply_markup=await lista_pastas()  # Chama a função assíncrona para listar as pastas
            )

            # Guarda a referência da mensagem para poder removê-la depois
            context.chat_data['pasta_message_id'] = pasta_message.message_id
        except Exception as e:
            await context.bot.send_message(
                update.message.chat_id,
                f"Ocorreu um erro: {str(e)}"
            )
    else:
        await context.bot.send_message(
            update.message.chat_id,
            "Modo privado desabilitado pelo administrador!",
        )

# Função para remover uma mensagem com os botões
async def remover_mensagem(update, context, message_id_key):
    if message_id_key in context.chat_data:
        try:
            # Verifique se update.message existe
            chat_id = update.message.chat_id if update.message else update.callback_query.message.chat_id

            # Agora tenta deletar a mensagem
            await context.bot.delete_message(
                chat_id=chat_id,
                message_id=context.chat_data[message_id_key]
            )
            logger.info(f"Mensagem removida: {context.chat_data[message_id_key]}")
        except Exception as e:
            logger.error(f"Erro ao tentar deletar a mensagem: {str(e)}")
        del context.chat_data[message_id_key]

# Função para lidar com a seleção de pastas
async def handle_pasta_selection(update: Update, context: CallbackContext):
    query = update.callback_query
    pasta_code = query.data.split('_')[1]  # Extrai o código da pasta

    logger.info(f"Código da pasta selecionada: {pasta_code}")

    # Armazena no contexto para uso futuro
    context.chat_data['selected_pasta'] = pasta_code

    # Agora chama a função para listar os dashboards
    await lista_dashboards(update, context, pasta_code)

# Função para lidar com a seleção dos dashboards
async def handle_dashboard_selection(update: Update, context: CallbackContext):
    user = update.effective_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    query = update.callback_query
    data = query.data

    if data.startswith("dashboard_"):
        pasta_code, dashboard_name = data.split('_')[1], data.split('_')[2]
        logger.info(f"Dashboard selecionado: {dashboard_name} da pasta {pasta_code}")

        await query.edit_message_text(
            f"*{usuario}*, você escolheu o dashboard: *{dashboard_name}*",
            parse_mode="markdown"
        )

        context.chat_data['selected_dashboard'] = dashboard_name
        context.chat_data['selected_pasta'] = pasta_code

        print(f"Selecionado: {pasta_code}, {dashboard_name}")
        print(f"Iniciando consulta para o gráfico...")

        try:
            await send_grf(update, context)
        except Exception as e:
            logger.error(f"Erro ao chamar send_grf: {str(e)}")

        # Tenta remover o inline keyboard só se houver
        if query.message.reply_markup is not None:
            try:
                await query.edit_message_reply_markup(reply_markup=None)
            except telegram.error.BadRequest as e:
                if "Message is not modified" in str(e):
                    pass
                else:
                    raise

        # Tenta responder a callback query, ignorando se já estiver expirada
        try:
            await query.answer()
        except telegram.error.BadRequest as e:
            if "Query is too old" in str(e):
                pass
            else:
                raise

# Função para lidar com o botão voltar
async def handle_voltar_pastas(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()  # Responde ao callback para evitar "loading" no botão

    # Chama a função `lista_pastas` para retornar ao menu principal
    keyboard = await lista_pastas()
    
    if query.message:
        try:
            await query.edit_message_text(
                text="Escolha uma pasta:",
                reply_markup=keyboard
            )
        except Exception as e:
            logger.error(f"Erro ao editar mensagem: {str(e)}")
    else:
        logger.error("A mensagem original não foi encontrada.")


# Função para cancelar a consulta
async def cancelar_selecao(update: Update, context: CallbackContext):
    # Apaga a mensagem do comando enviado
    if update.message:
        # Se a mensagem for do comando "/olt", apaga ela
        await update.message.delete()  # Apaga o comando do usuário

    # Apaga a mensagem do callback query (se houver)
    if update.callback_query:
        await update.callback_query.message.delete()  # Remove a mensagem associada ao botão

    # Envia a mensagem de cancelamento
    chat_id = update.callback_query.message.chat_id  # Obtém o chat_id para enviar a resposta
    await context.bot.send_message(chat_id=chat_id, text="Consulta cancelada.")


# Função para iniciar o envio dos gráficos
async def send_grf(update, context):
    user = update.effective_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    chat = update.effective_chat
    from_username = user.username

    # Verificar se o gráfico foi encontrado
    if 'selected_pasta' not in context.chat_data or 'selected_dashboard' not in context.chat_data:
        await send_consultas(update, context)
        return

    pasta_code = context.chat_data['selected_pasta']
    dashboard_name = context.chat_data['selected_dashboard']

    # Modificar a variável text para apenas o nome do dashboard (sem a pasta)
    text = f"@{dashboard_name.upper()}@"
    graficos_encontrados = []

    # Buscar gráficos no arquivo
    try:
        with open(FILE_PATH, "r") as file:
            # Verifique o que está sendo lido no arquivo
            for line in file:
                print(f"Linha lida do arquivo: {line.strip()}")  # Log para depuração
                if text in line:
                    partes = line.strip().split(";")
                    if len(partes) >= 4:
                        designacao = partes[1]
                        pasta = partes[2]
                        grafico = partes[3]
                        graficos_encontrados.append((designacao, pasta, grafico))
    except Exception as e:
        print(f"Erro ao ler o arquivo: {str(e)}")

    # Verificar se encontramos gráficos
    if graficos_encontrados:
        print(f"Gráficos encontrados: {graficos_encontrados}")
        for designacao, pasta, grafico in graficos_encontrados:
            # Print para verificar se estamos chegando na parte que chama a consulta
            print(f"Chamando processar_consulta para o gráfico: {designacao}, {pasta}, {grafico}")
            try:
                await processar_consulta(update, context, usuario, designacao, pasta, grafico, username, password)
            except Exception as e:
                print(f"Erro ao chamar processar_consulta para o gráfico {designacao}: {str(e)}")
    else:
        print(f"Nenhum gráfico encontrado para o texto: {text}")
        await update.callback_query.message.edit_text(
            f"*{usuario}*, não foi possível encontrar o gráfico: *{text}*.",
            parse_mode="markdown",
        )

# Função assíncrona para enviar mensagem de boas-vindas
async def send_start(update, context):
    user = update.message.from_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    chat = update.effective_chat
    gruponame = chat.title

    if chat.type != chat.PRIVATE or (
        chat.type == chat.PRIVATE and user.username == "RafaelSLS"
    ):
        await update.message.reply_markdown(get_msg(usuario, gruponame))
    else:
        await update.message.reply_text(
            f"*{usuario}*, modo privado desabilitado pelo administrador!",
            parse_mode="markdown",
        )

# Função assíncrona para enviar informações sobre o bot
async def send_sobre(update, context):
    user = update.message.from_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    chat = update.effective_chat
    gruponame = chat.title

    if chat.type != chat.PRIVATE or (
        chat.type == chat.PRIVATE and user.username == "RafaelSLS"
    ):
        await update.message.reply_markdown(get_sobre(usuario, gruponame))
    else:
        await update.message.reply_text(
            f"*{usuario}*, modo privado desabilitado pelo administrador!",
            parse_mode="markdown",
        )

# Função assíncrona para enviar ajuda sobre o bot
async def send_ajuda(update, context):
    user = update.message.from_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    chat = update.effective_chat
    gruponame = chat.title

    if chat.type != chat.PRIVATE or (
        chat.type == chat.PRIVATE and user.username == "RafaelSLS"
    ):
        await update.message.reply_markdown(get_ajuda(usuario, gruponame))
    else:
        await update.message.reply_text(
            f"*{usuario}*, modo privado desabilitado pelo administrador!",
            parse_mode="markdown",
        )

# Função assíncrona para enviar mensagem de aviso
async def aviso(update, context):
    user = update.message.from_user
    usuario = (
        f"{user.first_name.upper()} {user.last_name.upper()}"
        if user.last_name
        else user.first_name.upper()
    )

    chat = update.effective_chat
    gruponame = chat.title

    if chat.type != chat.PRIVATE or (
        chat.type == chat.PRIVATE and user.username == "RafaelSLS"
    ):
        await update.message.reply_text(
            "*Comando inválido!*\n" + get_ajuda(usuario, gruponame),
            parse_mode="markdown",
        )
    else:
        await update.message.reply_text(
            f"*{usuario}*, modo privado desabilitado pelo administrador!",
            parse_mode="markdown",
        )
