import re, unicodedata
def norm(s):
    s=unicodedata.normalize('NFD',s.lower())
    return ''.join(c for c in s if unicodedata.category(c)!='Mn')
KW={
 'CN':{
  'Biologia':'celula celulas dna rna gene genes genetic cromossom especie especies ecossistema organismo organismos bacteria bacterias virus fungo fungos proteina proteinas enzima enzimas sangue hormonio hormonios planta plantas fotossintese evolucao selecao natural mutacao vacina doenca doencas infeccao parasita mosquito populacao populacoes biodiversidade cadeia alimentar nicho mitose meiose heranca alelo fenotipo genotipo tecido orgao celular metabolismo respiracao celular ecologic predador presa animal animais vegetal vegetais inseto insetos sistema imunologico anticorpo anticorpos antibiotico nutriente nutrientes clorofila folha raiz semente polinizacao embriao reproducao glicose insulina neuronio intestino figado rim musculo esqueleto mamifero aves peixe anfibio reptil celulose bioma biomas transgenic clonagem dengue zika malaria',
  'Quimica':'reacao reacoes molecula moleculas atomo atomos ion ions ionica ionico acido acidos base bases ph solucao solucoes concentracao mol mols molar estequiometria oxidacao reducao eletrolise pilha eletron eletrons ligacao covalente polimero polimeros organic organica organico hidrocarboneto alcool ester ester carbono composto compostos elemento quimico tabela periodica isotopo radioativ meia-vida catalisador equilibrio quimico entalpia exotermic endotermic combustao combustivel sal sais precipitado titulacao soluvel solubilidade gas carbonico co2 oxigenio hidrogenio nitrogenio sodio cloreto metal metais corrosao funcao organica isomeria amina amida acido carboxilico aldeido cetona fenol detergente sabao saponificacao destilacao filtracao decantacao mistura substancia',
  'Fisica':'velocidade aceleracao forca forcas energia cinetica potencial trabalho potencia newton movimento massa gravidade atrito pressao empuxo densidade temperatura calor termico termica dilatacao onda ondas frequencia comprimento de onda som luz optica lente lentes espelho refracao reflexao circuito corrente eletrica tensao resistencia resistor voltagem watt kwh campo magnetico eletromagnet ima carga eletrica capacitor gerador motor transformador radiacao eletromagnetica fisica quantica nuclear impulso quantidade de movimento colisao queda livre lancamento orbita satelite hertz decibel joule kelvin celsius rendimento maquina termica',
 },
 'CH':{
  'Historia':'seculo historia historico historica colonial colonia imperio imperador republica revolucao ditadura militar escravidao escravo escravos escravizado abolicao guerra guerras feudal feudalismo idade media renascimento iluminismo absolutismo monarquia rei rainha getulio vargas era vargas estado novo independencia proclamacao napoleao nazismo fascismo guerra fria industrial burguesia operario greco romano grecia roma egito mesopotamia cruzadas reforma protestante inquisicao jesuitas bandeirantes quilombo palmares canudos tenentismo inconfidencia cabanagem farroupilha populismo golpe de 1964 ai-5 redemocratizacao constituinte',
  'Geografia':'clima climatico relevo bacia hidrografica rio rios urbanizacao urbano cidade cidades metropole agricultura agropecuaria agronegocio latifundio populacao migracao migratorio demografic globalizacao territorio territorial regiao regioes geografia mapa cartograf escala coordenada latitude longitude solo solos erosao desmatamento cerrado caatinga amazonia mata atlantica bioma biomas energia hidreletrica industria industrializacao economia petroleo mineracao placas tectonicas vulcao terremoto massa de ar efeito estufa aquecimento global chuva acida el nino fuso horario geopolitica fronteira',
  'Filosofia':'filosofo filosofos filosofia platao aristoteles socrates descartes kant hegel nietzsche hume locke rousseau hobbes maquiavel espinosa spinoza sartre marx etica moral razao conhecimento metafisica epistemologia virtude alma existencia ser verdade dialetica empirismo racionalismo contrato social estado de natureza agostinho tomas de aquino pre-socraticos sofistas heraclito parmenides foucault arendt adorno habermas',
  'Sociologia':'sociedade social sociologo sociologia durkheim weber marx trabalho capitalismo classe classes desigualdade movimento social movimentos sociais cidadania direitos cultura cultural identidade etnia racismo preconceito genero feminismo mulher mulheres consumo midia industria cultural bauman globalizacao democracia politica politico estado instituicao indigena indigenas quilombola trabalhador sindicato violencia',
 },
 'LC':{
  'Ingles':'', 'Espanhol':'',
  'Literatura':'poema poemas poeta poesia verso versos estrofe romance romancista conto cronica narrador narrativa personagem literatura literario literaria modernismo modernista romantismo realismo naturalismo parnasianismo simbolismo barroco arcadismo machado de assis drummond bandeira clarice lispector guimaraes rosa graciliano jorge amado cecilia meireles vinicius alencar castro alves oswald mario de andrade cabral manuel bandeira',
  'Artes':'arte artes artista artistas obra pintura pintor escultura musica musical teatro danca cinema fotografia museu exposicao vanguarda cubismo surrealismo impressionismo grafite performance instalacao',
  'Educacao Fisica':'esporte esportes atividade fisica exercicio exercicios corpo corporal atleta atletas jogo jogos futebol ginastica treino treinamento olimpiada olimpico sedentarismo capoeira luta lutas',
  'Portugues':'texto linguagem variacao linguistica norma padrao gramatica verbo substantivo adjetivo pronome conjuncao oracao sintatica funcao da linguagem genero textual coesao coerencia argumento argumentativo propaganda anuncio charge tirinha campanha publicitaria internet rede social digital palavra palavras expressao sentido semantica figura de linguagem metafora ironia',
 },
 'MT':{
  'Geometria espacial':'volume cubo cilindro cone esfera prisma piramide paralelepipedo solido tronco capacidade litros reservatorio caixa d agua tanque planificacao vista superior',
  'Geometria plana':'area perimetro triangulo quadrado retangulo circulo circunferencia raio diametro angulo poligono hexagono losango trapezio teorema de pitagoras semelhanca terreno piso ladrilho',
  'Estatistica':'media mediana moda desvio padrao variancia grafico tabela frequencia pesquisa dados amostra',
  'Probabilidade':'probabilidade chance sorteio aleatoriamente dado honesto evento',
  'Combinatoria':'quantas maneiras combinacoes permutacao arranjo senhas senha anagramas modos distintos',
  'Porcentagem e juros':'porcentagem percentual % juros desconto acrescimo lucro aumento reducao taxa',
  'Razao e proporcao':'razao proporcao proporcional escala grandeza regra de tres velocidade media consumo km por litro densidade',
  'Funcoes':'funcao grafico de funcao linear quadratica exponencial logaritmo parabola reta crescimento decrescimento f(x) eixo',
  'Aritmetica':'numero numeros divisivel multiplo mdc mmc fracao decimal potencia raiz notacao cientifica sistema de numeracao sequencia progressao',
 }
}

SHORT={'dna','rna','ph','mol','ion','gas','co2','sal','rei','som','luz','ima','mdc','mmc','%','kwh'}
STOP={'de','da','do','das','dos','por','agua','sistema','funcao','numero','numeros','grafico','tabela','dados','trabalho','energia','populacao','social','seculo','texto','base','bases','campo','corpo','media','taxa','eixo','reta','area','escala','forca','forcas','massa','cultura','cultural','politica','politico','estado','razao','ser','obra','jogo','jogos','sentido','palavra','palavras','evento','chance'}
KWL={a:{d:[norm(w) for w in v.split() if (len(w)>=4 or norm(w) in SHORT) and norm(w) not in STOP] for d,v in m.items()} for a,m in KW.items()}
RX={a:{d:[re.compile(r'(?<![a-z0-9])'+re.escape(w)) for w in ws] for d,ws in m.items()} for a,m in KWL.items()}
def classify(area,text,lang=None):
    if area=='LC' and lang: return 'Ingles' if lang=='ingles' else 'Espanhol'
    t=norm(text)
    best,bs=None,0
    for d,rs in RX[area].items():
        s=sum(min(len(r.findall(t)),3) for r in rs)
        if s>bs: best,bs=d,s
    if best is None:
        best={'CN':'Biologia','CH':'Sociologia','LC':'Portugues','MT':'Aritmetica'}[area]
    return best
