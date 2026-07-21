import os
import re

import aiohttp
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# Next.js BFF (aliases /api/rals|recs). Fallback: Flask legado :5007
API_BASE_URL = os.environ.get(
    "EMPRESARIAL_API_URL",
    "http://127.0.0.1:3002/api",
).rstrip("/")

# ---------- Funções de API ----------

async def get_rals():
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE_URL}/rals") as resp:
            resp.raise_for_status()
            data = await resp.json()
            return data.get("data", [])

async def get_recs():
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE_URL}/recs") as resp:
            resp.raise_for_status()
            data = await resp.json()
            return data.get("data", [])

async def resumo_ral(num_recup):
    match = re.search(r'(\d+)', num_recup)
    if not match:
        return f"Número de RAL inválido: {num_recup}"
    num_id = match.group(1)
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/rals/{num_id}") as resp:
                resp.raise_for_status()
                data = await resp.json()
                if data["status"] != "sucesso":
                    return f"RAL {num_id} não encontrada."

                ral = data["data"]
                # --- INÍCIO DA MUDANÇA (RAL) ---
                detalhes = ral.get("detalhes", "Não disponível.")
                # Assumindo que a API retorna o campo 'detalhes' da tabela 'rals'
                # --- FIM DA MUDANÇA (RAL) ---
                resumo = (
                    f"📌 RAL: {ral['num_recup']}\n"
                    f"📅 Abertura: {ral['abertura']}\n"
                    f"👷 Executante: {ral['cf_executante']}\n"
                    f"⚠ Código Anormalidade: {ral['codigo_anormalidade']}\n"
                    f"📝 Descrição: {ral['descricao']}\n"
                    f"⏱ Duração: {ral['duracao']}\n"
                    f"🔄 Status: {ral['status']}\n"
                    f"💡 Tipo RAL: {ral['tipo_ral']}\n"
                    f"⏳ Última Atualização: {ral['ultima_atualizacao']}\n"
                )
                return resumo
    except Exception as e:
        return f"Erro ao consultar RAL {num_recup}: {str(e)}"

async def resumo_rec(num_recup):
    match = re.search(r'(\d+)', num_recup)
    if not match:
        return f"Número da REC inválido: {num_recup}"
    num_id = match.group(1)
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/recs/{num_id}") as resp:
                resp.raise_for_status()
                data = await resp.json()
                if data["status"] != "sucesso":
                    return f"REC {num_id} não encontrada."

                rec = data["data"]
                # --- INÍCIO DA MUDANÇA (REC) ---
                detalhes_title = rec.get("detalhes_title", "Não disponível.")
                # Assumindo que a API retorna o campo 'detalhes_title' da tabela 'recs'
                # --- FIM DA MUDANÇA (REC) ---
                resumo = (
                    f"📌 REC: {rec['num_recup']}\n"
                    f"📅 Abertura: {rec['abertura']}\n"
                    f"👷 Executante: {rec['cf_executante']}\n"
                    f"⚠ Cliente: {rec['cliente']}\n"
                    f"🔄 Status: {rec['status']}\n"
                    f"⏳ Última Atualização: {rec['ultima_atualizacao']}\n"
                        f"\n"
                        f"--- Detalhes do Sistema (Tooltip) ---\n"
                        f"{detalhes_title}"
                )
                return resumo
    except Exception as e:
        return f"Erro ao consultar a REC {num_recup}: {str(e)}"

# ---------- Handlers (mantidos, mas completos abaixo para contexto) ----------

async def send_sir_menu(update, context):
    keyboard = [
        [InlineKeyboardButton("RAL", callback_data="sir_ral")],
        [InlineKeyboardButton("REC", callback_data="sir_rec")],
        [InlineKeyboardButton("❌ Cancelar", callback_data="sir_cancel")]
    ]
    markup = InlineKeyboardMarkup(keyboard)
    if update.message:
        await update.message.reply_text("Escolha uma opção:", reply_markup=markup)
    elif update.callback_query:
        await update.callback_query.edit_message_text("Escolha uma opção:", reply_markup=markup)

async def handle_sir_selection(update, context):
    query = update.callback_query
    await query.answer()
    data = query.data

    # Cancelamento
    if data == "sir_cancel":
        await query.edit_message_text("Operação cancelada.")
        return

    # ---------- Menu RAL ----------
    elif data == "sir_ral":
        rals = await get_rals()
        rals_ativas = [r for r in rals if r.get("status") == "ATIVO"]
        if not rals_ativas:
            await query.edit_message_text("Nenhuma RAL ativa encontrada.")
            return

        cf_dict = {}
        for r in rals_ativas:
            cf = r["cf_executante"]
            cf_dict.setdefault(cf, []).append(r["num_recup"])

        keyboard = [[InlineKeyboardButton(cf, callback_data=f"cf_ral_{cf}")] for cf in sorted(cf_dict.keys())]
        keyboard.append([InlineKeyboardButton("⬅️ Voltar", callback_data="sir_voltar")])
        context.user_data["cf_ral"] = cf_dict
        await query.edit_message_text("Selecione o CF da RAL:", reply_markup=InlineKeyboardMarkup(keyboard))

    elif data.startswith("cf_ral_"):
        cf = data.split("_")[2]
        cf_dict = context.user_data.get("cf_ral", {})
        rals_cf = cf_dict.get(cf, [])
        keyboard = [[InlineKeyboardButton(ral, callback_data=f"ral_{ral}")] for ral in sorted(rals_cf)]
        keyboard.append([InlineKeyboardButton("⬅️ Voltar", callback_data="sir_ral")])
        await query.edit_message_text(f"RALs do CF {cf}:", reply_markup=InlineKeyboardMarkup(keyboard))

    elif data.startswith("ral_"):
        num_ral = data.split("_")[1]
        resumo = await resumo_ral(num_ral)
        # Adicionada a opção de voltar ao menu de RALs do CF
        cf_ral = context.user_data.get("cf_ral", {}) 
        cf_atual = next((cf for cf, rals in cf_ral.items() if num_ral in rals), None)
        
        await query.edit_message_text(resumo)

    # ---------- Menu REC ----------
    elif data == "sir_rec":
        recs = await get_recs()
        recs_ativas = [r for r in recs if r.get("status") == "ATIVO"]
        if not recs_ativas:
            await query.edit_message_text("Nenhuma REC ativa encontrada.")
            return

        cf_dict = {}
        for r in recs_ativas:
            cf = r["cf_executante"]
            cf_dict.setdefault(cf, []).append(r["num_recup"])

        keyboard = [[InlineKeyboardButton(cf, callback_data=f"cf_rec_{cf}")] for cf in sorted(cf_dict.keys())]
        keyboard.append([InlineKeyboardButton("⬅️ Voltar", callback_data="sir_voltar")])
        context.user_data["cf_rec"] = cf_dict
        await query.edit_message_text("Selecione o CF da REC:", reply_markup=InlineKeyboardMarkup(keyboard))

    elif data.startswith("cf_rec_"):
        cf = data.split("_")[2]
        cf_dict = context.user_data.get("cf_rec", {})
        recs_cf = cf_dict.get(cf, [])
        keyboard = [[InlineKeyboardButton(rec, callback_data=f"rec_{rec}")] for rec in sorted(recs_cf)]
        keyboard.append([InlineKeyboardButton("⬅️ Voltar", callback_data="sir_rec")])
        await query.edit_message_text(f"RECs do CF {cf}:", reply_markup=InlineKeyboardMarkup(keyboard))

    elif data.startswith("rec_"):
        num_rec = data.split("_")[1]
        resumo = await resumo_rec(num_rec)
        # Adicionada a opção de voltar ao menu de RECs do CF
        cf_rec = context.user_data.get("cf_rec", {})
        cf_atual = next((cf for cf, recs in cf_rec.items() if num_rec in recs), None)
        
        await query.edit_message_text(resumo)

    # Voltar ao menu inicial
    elif data == "sir_voltar":
        await send_sir_menu(update, context)
