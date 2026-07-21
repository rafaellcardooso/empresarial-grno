#!/usr/bin/python3
# -*- condig:utf-8 -*-


def get_msg(usuario, gruponame):
    return f'''Olá, *{usuario}*!
Seja bem-vindo(a) ao GRUPO: {gruponame}
Para informações dos meus comandos, digite: /ajuda'''


def get_sobre(usuario, gruponame):
    return f'''Olá, *{usuario}*!
Esse é o grupo: {gruponame}
*(c) 2023 CLARO BRASIL*'''


def get_ajuda(usuario, gruponame):
    return f'''
Comandos disponíveis:
/start - Inicia o bot
/ct - Consulta a Chave do CT
/sobre - Informações sobre o grupo

Para realizar consultas, utilize:

Para realizar consultas, utilize:
/ct _[CHAVE]_ - consulta completa da Coletora.'''
