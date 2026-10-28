// Conteúdo fixo do IEM: assuntos de Matemática do ENEM, métodos de prova e flashcards iniciais.

export const AREAS = {
  MT: { nome: 'Matemática', longo: 'Matemática e suas Tecnologias' },
};

// Assuntos usados na classificação das 670 questões de Matemática do ENEM (2009 a 2023).
// metodo: como atacar esse tipo de questão na prova.
export const TOPICOS = [
  { nome: 'Funções', metodo: 'Identifique o tipo (afim, quadrática, exponencial, logarítmica) pela forma como a grandeza cresce. Monte a lei com dois pontos do enunciado e teste nas alternativas. Em gráfico, leia os eixos e as unidades antes de tudo.' },
  { nome: 'Razão e proporção', metodo: 'Escreva as grandezas lado a lado com unidades e decida se são direta ou inversamente proporcionais antes de montar a regra de três. Em escala, converta tudo para a mesma unidade primeiro. Área escala com o quadrado e volume com o cubo.' },
  { nome: 'Aritmética', metodo: 'Leia o comando final antes do texto. Organize os dados numa tabela curta. Em MMC e MDC, pense em "quando volta a coincidir" (MMC) e "maior pedaço igual" (MDC). Confira se a resposta pede número inteiro.' },
  { nome: 'Geometria plana', metodo: 'Desenhe e marque as medidas na figura. Procure triângulos retângulos (Pitágoras) e semelhantes (razão entre lados). Áreas compostas: some e subtraia figuras simples.' },
  { nome: 'Geometria espacial', metodo: 'Identifique o sólido e a fórmula de volume. Converta unidades no começo (1 dm³ = 1 L, 1 m³ = 1.000 L). Em planificação e vista, imagine o sólido girando e elimine alternativas que mudam a posição das faces.' },
  { nome: 'Porcentagem e juros', metodo: 'Use fatores: aumento de p% multiplica por (1 + p/100), desconto multiplica por (1 − p/100). Aumentos sucessivos multiplicam os fatores, nunca somam. Juros compostos: M = C(1 + i)ᵗ.' },
  { nome: 'Estatística', metodo: 'Ordene os dados antes de achar a mediana. Média ponderada: multiplique cada valor pelo peso e divida pela soma dos pesos. Em "qual a nota mínima", chame a incógnita de x e monte a média.' },
  { nome: 'Gráficos e tabelas', metodo: 'Leia título, eixos e legenda antes dos números. Taxa de variação = diferença dividida pelo intervalo. Desconfie de eixos que não começam no zero.' },
  { nome: 'Probabilidade', metodo: 'Defina o espaço amostral. "E" multiplica, "ou" soma (se forem excludentes). "Pelo menos um" é 1 menos a probabilidade de nenhum. Condicional: o espaço amostral encolhe para o que já aconteceu.' },
  { nome: 'Análise combinatória', metodo: 'Desenhe os espaços e use o princípio multiplicativo. Pergunte: a ordem importa? Se sim, arranjo ou permutação; se não, combinação. Elementos repetidos dividem pelo fatorial das repetições.' },
  { nome: 'Grandezas e unidades', metodo: 'Escreva as conversões como frações que valem 1 (ex.: 1 h / 60 min) e cancele unidades. Notação científica: ajuste a vírgula e compense no expoente.' },
  { nome: 'Sequências (PA e PG)', metodo: 'Ache o padrão com os três primeiros termos: diferença constante é PA, razão constante é PG. Teste a fórmula do termo geral com n = 1 e n = 2 antes de usar.' },
  { nome: 'Trigonometria', metodo: 'No triângulo retângulo, escolha seno, cosseno ou tangente pelo par de lados envolvidos. Em funções periódicas (roda-gigante, maré), ache amplitude, período e valor médio.' },
  { nome: 'Geometria analítica', metodo: 'Marque os pontos no plano. Distância entre pontos é Pitágoras. Reta: coeficiente angular = Δy / Δx. Circunferência: (x − a)² + (y − b)² = r².' },
];
export const MATERIAS = { MT: Object.fromEntries(TOPICOS.map((t) => [t.nome, t.nome])) };
export const nomeMateria = (area, d) => d;
export const topico = (nome) => TOPICOS.find((t) => t.nome === nome);

// ENEM 2026: a prova de Matemática é no 2º dia, 15 de novembro (INEP).
export const ENEM_PADRAO = '2026-11-15';

// Degraus da escada "Rumo ao 45", pelo nível de cada questão na escala do ENEM (parâmetro b da TRI).
export const DEGRAUS = [
  { id: 1, rot: 'Base', de: -Infinity, ate: 700, desc: 'Questões que quem tira 37 não pode errar. Aqui o objetivo é zero erro bobo.' },
  { id: 2, rot: '700 a 750', de: 700, ate: 750, desc: 'Médias-difíceis. Muitos pontos se perdem aqui por interpretação.' },
  { id: 3, rot: '750 a 800', de: 750, ate: 800, desc: 'Difíceis. Exigem montar o problema com calma.' },
  { id: 4, rot: '800 a 850', de: 800, ate: 850, desc: 'Muito difíceis. É onde se ganha a diferença entre 40 e 45.' },
  { id: 5, rot: '850 a 900', de: 850, ate: 900, desc: 'As que quase ninguém acerta. Treine o raciocínio, não a decoreba.' },
  { id: 6, rot: 'Topo (900+)', de: 900, ate: Infinity, desc: 'As questões mais difíceis já aplicadas no ENEM.' },
];
export const degrauDe = (nivel) => (nivel == null ? null : DEGRAUS.find((d) => nivel >= d.de && nivel < d.ate));

// Métodos de prova reunidos de orientações de professores de cursinho e do próprio INEP sobre a TRI.
export const METODOS = [
  { t: 'Prova em duas voltas', d: 'Na primeira volta, resolva só o que você resolve em até 3 minutos e marque o resto. Na segunda volta, ataque as marcadas. Assim nenhuma questão fácil fica para trás por falta de tempo.' },
  { t: 'Coerência na TRI', d: 'A TRI dá mais nota para quem acerta as fáceis e médias. Errar uma fácil e acertar uma difícil parece chute e vale menos. Para sair de 37 para 45, o primeiro passo é não errar nenhuma da base.' },
  { t: 'Leia o comando primeiro', d: 'Leia a pergunta final antes do texto. Você passa a ler o enunciado sabendo o que procurar e gasta menos tempo.' },
  { t: 'Estime antes de calcular', d: 'Faça uma conta aproximada e veja a ordem de grandeza. Muitas vezes isso já elimina três alternativas.' },
  { t: 'Teste as alternativas', d: 'Quando a pergunta é "qual valor satisfaz", substitua as alternativas no enunciado em vez de resolver a equação. Comece pela do meio.' },
  { t: 'Unidades no começo', d: 'Converta tudo para a mesma unidade antes de qualquer conta. Erro de unidade é um dos mais comuns em Matemática do ENEM.' },
  { t: 'Desenhe', d: 'Geometria, caminhos, escalas e vistas: um rabisco rápido evita erro de interpretação.' },
  { t: 'Chute consciente', d: 'Nunca deixe em branco. No fim, para as que sobraram, elimine o que for absurdo e escolha entre as que restam.' },
  { t: 'Gabarito por blocos', d: 'Passe as respostas para o cartão a cada bloco de questões, não tudo no final.' },
  { t: 'Revise o erro, não a questão', d: 'No caderno de erros, anote o motivo (conteúdo, interpretação, atenção, cálculo, tempo). O motivo que mais se repete é o que precisa de treino.' },
];

// Flashcards iniciais: fórmulas e métodos de cada assunto. Chave 'MT|Assunto'.
export const CARDS_INICIAIS = {
  'MT|Funções': [
    ['Função afim: forma e significado de a e b', '$f(x) = ax + b$. a é a taxa de variação (quanto y muda quando x aumenta 1). b é o valor quando x = 0.'],
    ['Como achar a lei de uma função afim com dois pontos', '$a = \\dfrac{y_2 - y_1}{x_2 - x_1}$, depois substitua um ponto para achar b.'],
    ['Vértice da parábola', '$x_v = -\\dfrac{b}{2a}$ e $y_v = -\\dfrac{\\Delta}{4a}$, com $\\Delta = b^2 - 4ac$.'],
    ['Quando a parábola tem máximo e quando tem mínimo?', 'a < 0: concavidade para baixo, tem máximo. a > 0: para cima, tem mínimo. Lucro máximo e área máxima saem do vértice.'],
    ['Raízes da quadrática (Bhaskara)', '$x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$'],
    ['Soma e produto das raízes', '$x_1 + x_2 = -\\dfrac{b}{a}$ e $x_1 \\cdot x_2 = \\dfrac{c}{a}$'],
    ['Função exponencial no ENEM', '$f(t) = f_0 \\cdot k^t$. Cresce (k > 1) ou decai (0 < k < 1) multiplicando sempre pelo mesmo fator.'],
    ['Meia-vida', 'Depois de n meias-vidas sobra $Q_0 \\cdot \\left(\\tfrac{1}{2}\\right)^n$.'],
    ['Definição de logaritmo', '$\\log_b a = x \\iff b^x = a$'],
    ['Propriedades do logaritmo', '$\\log(ab) = \\log a + \\log b$; $\\log\\dfrac{a}{b} = \\log a - \\log b$; $\\log a^n = n \\log a$'],
    ['Como resolver $2^x = 10$ com log', 'Aplique log dos dois lados: $x \\log 2 = 1$, então $x = \\dfrac{1}{\\log 2} \\approx \\dfrac{1}{0{,}30} \\approx 3{,}3$.'],
    ['Função definida por partes (conta de água, táxi)', 'Calcule cada faixa separadamente e some. No gráfico, cada faixa é um segmento com inclinação diferente.'],
  ],
  'MT|Razão e proporção': [
    ['Escala', 'Escala = medida no desenho ÷ medida real, na mesma unidade. 1 : 100 → 1 cm no desenho vale 100 cm reais.'],
    ['Se a escala de comprimento é k, a de área e a de volume são…', 'Área: $k^2$. Volume: $k^3$.'],
    ['Diretamente proporcionais', 'A razão é constante: $\\dfrac{y}{x} = k$. Uma dobra, a outra dobra.'],
    ['Inversamente proporcionais', 'O produto é constante: $x \\cdot y = k$. Uma dobra, a outra cai pela metade.'],
    ['Regra de três composta: método', 'Coloque a incógnita numa coluna, compare cada grandeza com ela (direta ou inversa) e inverta as inversas antes de multiplicar.'],
    ['Divisão proporcional (sociedade, herança)', 'Some as partes, divida o total pela soma e multiplique por cada parte.'],
    ['Velocidade média', '$v = \\dfrac{\\Delta s}{\\Delta t}$. Para converter km/h em m/s, divida por 3,6.'],
    ['Densidade e concentração', 'Densidade = massa ÷ volume. Concentração = quantidade de soluto ÷ volume da solução.'],
    ['Torneiras e trabalhadores juntos', 'Some as vazões (ou o trabalho por hora): $\\dfrac{1}{t} = \\dfrac{1}{t_1} + \\dfrac{1}{t_2}$.'],
  ],
  'MT|Aritmética': [
    ['MMC na prática', 'Use quando quer saber quando eventos periódicos voltam a coincidir (ônibus, remédios, luzes).'],
    ['MDC na prática', 'Use quando quer dividir em partes iguais do maior tamanho possível, sem sobra.'],
    ['Critério de divisibilidade por 3 e por 9', 'Soma dos algarismos divisível por 3 (ou por 9).'],
    ['Critério de divisibilidade por 4', 'Os dois últimos algarismos formam um número divisível por 4.'],
    ['Potências: produto, quociente e potência de potência', '$a^m \\cdot a^n = a^{m+n}$; $\\dfrac{a^m}{a^n} = a^{m-n}$; $(a^m)^n = a^{mn}$'],
    ['Potência de expoente negativo', '$a^{-n} = \\dfrac{1}{a^n}$'],
    ['Divisão de frações', 'Multiplica a primeira pelo inverso da segunda.'],
    ['Dízima periódica 0,333… em fração', '$\\dfrac{1}{3}$. Em geral, 0,abab… = $\\dfrac{ab}{99}$.'],
    ['Sistema de duas equações: método rápido', 'Some ou subtraia as equações para sumir uma incógnita (adição), ou isole uma e substitua.'],
    ['Inequação: quando inverter o sinal?', 'Ao multiplicar ou dividir os dois lados por um número negativo.'],
  ],
  'MT|Geometria plana': [
    ['Teorema de Pitágoras', '$a^2 = b^2 + c^2$, com a sendo a hipotenusa.'],
    ['Ternas pitagóricas que mais caem', '3, 4, 5; 5, 12, 13; 8, 15, 17 e seus múltiplos (6, 8, 10…).'],
    ['Semelhança de triângulos', 'Ângulos iguais → lados proporcionais. Razão das áreas = (razão dos lados)².'],
    ['Área do triângulo', '$A = \\dfrac{b \\cdot h}{2}$. Com dois lados e o ângulo entre eles: $A = \\dfrac{a \\, b \\, \\text{sen}\\,\\theta}{2}$.'],
    ['Área do trapézio', '$A = \\dfrac{(B + b) \\cdot h}{2}$'],
    ['Área do losango', '$A = \\dfrac{D \\cdot d}{2}$'],
    ['Círculo: área e comprimento', 'Área $\\pi r^2$. Comprimento $2 \\pi r$.'],
    ['Área do setor circular de ângulo θ (graus)', '$A = \\dfrac{\\theta}{360°} \\cdot \\pi r^2$'],
    ['Soma dos ângulos internos de um polígono de n lados', '$S = (n - 2) \\cdot 180°$'],
    ['Hexágono regular de lado L', 'É formado por 6 triângulos equiláteros. Área $= \\dfrac{3 L^2 \\sqrt{3}}{2}$.'],
    ['Diagonal do quadrado e altura do triângulo equilátero', 'Diagonal: $L\\sqrt{2}$. Altura: $\\dfrac{L\\sqrt{3}}{2}$.'],
  ],
  'MT|Geometria espacial': [
    ['Volume do prisma e do cilindro', '$V = A_{base} \\cdot h$. Cilindro: $V = \\pi r^2 h$.'],
    ['Volume da pirâmide e do cone', '$V = \\dfrac{A_{base} \\cdot h}{3}$'],
    ['Volume da esfera', '$V = \\dfrac{4}{3} \\pi r^3$. Área da superfície: $4 \\pi r^2$.'],
    ['Litros e metros cúbicos', '1 dm³ = 1 L. 1 m³ = 1.000 L. 1 cm³ = 1 mL.'],
    ['Paralelepípedo: volume e diagonal', '$V = a \\cdot b \\cdot c$. Diagonal $= \\sqrt{a^2 + b^2 + c^2}$.'],
    ['Cubo de aresta a: diagonal', '$a\\sqrt{3}$'],
    ['Relação de Euler', '$V - A + F = 2$ (vértices, arestas, faces de poliedros convexos).'],
    ['Área lateral do cilindro', '$2 \\pi r h$ (o retângulo da planificação).'],
    ['Se dobro todas as medidas de um sólido, o volume…', 'Multiplica por 8 ($2^3$).'],
    ['Tronco de cone ou pirâmide no ENEM', 'Calcule o sólido grande e subtraia o pequeno que foi cortado (são semelhantes).'],
  ],
  'MT|Porcentagem e juros': [
    ['Fator de aumento e de desconto', 'Aumento de 15%: × 1,15. Desconto de 15%: × 0,85.'],
    ['Aumento de 20% seguido de desconto de 20%', '1,2 × 0,8 = 0,96 → 4% a menos que o original.'],
    ['Variação percentual', '$\\dfrac{\\text{novo} - \\text{antigo}}{\\text{antigo}} \\times 100\\%$'],
    ['Juros simples', '$J = C \\cdot i \\cdot t$ e $M = C + J$.'],
    ['Juros compostos', '$M = C (1 + i)^t$'],
    ['Lucro sobre o custo × lucro sobre a venda', 'Sobre o custo: lucro ÷ custo. Sobre a venda: lucro ÷ preço de venda. Confira qual o enunciado pede.'],
    ['Pontos percentuais × porcentagem', 'De 10% para 15% são 5 pontos percentuais, mas um aumento de 50%.'],
    ['Porcentagem de porcentagem', '30% de 40% = 0,3 × 0,4 = 0,12 = 12%.'],
  ],
  'MT|Estatística': [
    ['Média aritmética', 'Soma dos valores ÷ quantidade de valores.'],
    ['Média ponderada', '$\\bar{x} = \\dfrac{\\sum x_i p_i}{\\sum p_i}$'],
    ['Mediana', 'Valor central da lista ordenada. Com quantidade par, média dos dois centrais.'],
    ['Moda', 'Valor que mais se repete. Pode haver mais de uma ou nenhuma.'],
    ['Nota mínima para atingir uma média', 'Chame a nota de x, monte a média com x e resolva a inequação média ≥ meta.'],
    ['Desvio padrão: o que significa', 'Mede a dispersão. Quanto menor, mais regular (homogêneo) é o conjunto.'],
    ['Variância e desvio padrão', 'Variância = média dos quadrados dos desvios em relação à média. Desvio padrão = raiz da variância.'],
    ['Se somo k a todos os valores…', 'Média, mediana e moda aumentam k. O desvio padrão não muda.'],
  ],
  'MT|Gráficos e tabelas': [
    ['Taxa média de variação num gráfico', '$\\dfrac{\\Delta y}{\\Delta x}$ entre os dois pontos pedidos.'],
    ['Maior crescimento absoluto × relativo', 'Absoluto: maior diferença. Relativo: maior diferença dividida pelo valor inicial.'],
    ['Gráfico de setores', 'Ângulo do setor = porcentagem × 360°.'],
    ['Primeira coisa a ler num gráfico', 'Título, unidades dos eixos, escala e legenda. Eixo que não começa no zero exagera diferenças.'],
    ['Gráfico de altura × tempo ao encher um recipiente', 'Onde o recipiente é mais estreito, o nível sobe mais rápido (curva mais inclinada).'],
  ],
  'MT|Probabilidade': [
    ['Probabilidade de um evento', '$P = \\dfrac{\\text{casos favoráveis}}{\\text{casos possíveis}}$'],
    ['Eventos independentes: os dois acontecem', 'Multiplica: $P(A \\cap B) = P(A) \\cdot P(B)$'],
    ['Eventos excludentes: um ou outro', 'Soma: $P(A \\cup B) = P(A) + P(B)$'],
    ['União em geral', '$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$'],
    ['"Pelo menos um"', '1 − P(nenhum).'],
    ['Probabilidade condicional', '$P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}$. O espaço amostral vira só o B.'],
    ['Sem reposição', 'A cada retirada, o total diminui 1 (e os favoráveis também, se o retirado era favorável).'],
    ['Exatamente k sucessos em n tentativas (binomial)', '$C_{n,k} \\, p^k (1 - p)^{n-k}$'],
  ],
  'MT|Análise combinatória': [
    ['Princípio fundamental da contagem', 'Etapas independentes: multiplique o número de opções de cada etapa.'],
    ['Permutação simples', '$P_n = n!$'],
    ['Permutação com repetição (anagramas com letras repetidas)', '$\\dfrac{n!}{a! \\, b! \\cdots}$'],
    ['Arranjo (a ordem importa)', '$A_{n,p} = \\dfrac{n!}{(n - p)!}$'],
    ['Combinação (a ordem não importa)', '$C_{n,p} = \\dfrac{n!}{p! \\, (n - p)!}$'],
    ['Como saber se a ordem importa', 'Troque dois escolhidos de lugar. Se virou outra coisa (senha, pódio), importa. Se é o mesmo grupo (comissão, salada), não importa.'],
    ['Permutação circular', '$(n - 1)!$'],
    ['Caminhos em malha (só direita e cima)', '$\\dfrac{(d + c)!}{d! \\, c!}$, com d passos para a direita e c para cima.'],
  ],
  'MT|Grandezas e unidades': [
    ['Notação científica', '$a \\times 10^n$ com $1 \\le a < 10$.'],
    ['Prefixos: micro, mili, quilo, mega, giga', 'micro $10^{-6}$, mili $10^{-3}$, quilo $10^3$, mega $10^6$, giga $10^9$.'],
    ['Conversão de área', '1 m² = 10.000 cm². 1 km² = 1.000.000 m². 1 hectare = 10.000 m².'],
    ['Conversão de volume', '1 m³ = 1.000.000 cm³ = 1.000 L.'],
    ['Horas decimais', '0,5 h = 30 min; 0,1 h = 6 min; 1,25 h = 1 h 15 min.'],
    ['Polegada e pé', '1 polegada ≈ 2,54 cm. 1 pé = 12 polegadas.'],
  ],
  'MT|Sequências (PA e PG)': [
    ['Termo geral da PA', '$a_n = a_1 + (n - 1) r$'],
    ['Soma dos n termos da PA', '$S_n = \\dfrac{(a_1 + a_n) \\, n}{2}$'],
    ['Termo geral da PG', '$a_n = a_1 \\cdot q^{n-1}$'],
    ['Soma dos n termos da PG', '$S_n = \\dfrac{a_1 (q^n - 1)}{q - 1}$'],
    ['Soma infinita da PG com |q| < 1', '$S = \\dfrac{a_1}{1 - q}$'],
    ['Padrão de figuras (palitos, quadradinhos)', 'Conte as três primeiras figuras. Diferença constante → PA. Teste a fórmula na figura 1 e 2.'],
  ],
  'MT|Trigonometria': [
    ['Seno, cosseno e tangente', 'sen = oposto/hipotenusa; cos = adjacente/hipotenusa; tg = oposto/adjacente.'],
    ['Valores de 30°, 45° e 60°', 'sen: $\\tfrac12, \\tfrac{\\sqrt2}{2}, \\tfrac{\\sqrt3}{2}$. cos: $\\tfrac{\\sqrt3}{2}, \\tfrac{\\sqrt2}{2}, \\tfrac12$. tg: $\\tfrac{\\sqrt3}{3}, 1, \\sqrt3$.'],
    ['Relação fundamental', '$\\text{sen}^2 x + \\cos^2 x = 1$'],
    ['Radianos', '$\\pi$ rad = 180°.'],
    ['Função $f(t) = A + B \\, \\text{sen}(ct)$: máximo, mínimo e período', 'Máximo $A + |B|$, mínimo $A - |B|$, período $\\dfrac{2\\pi}{c}$.'],
    ['Lei dos cossenos', '$a^2 = b^2 + c^2 - 2bc \\cos \\hat{A}$'],
  ],
  'MT|Geometria analítica': [
    ['Distância entre dois pontos', '$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$'],
    ['Ponto médio', '$M = \\left(\\dfrac{x_1 + x_2}{2}, \\dfrac{y_1 + y_2}{2}\\right)$'],
    ['Coeficiente angular da reta', '$m = \\dfrac{y_2 - y_1}{x_2 - x_1}$. Equação: $y - y_0 = m (x - x_0)$.'],
    ['Retas paralelas e perpendiculares', 'Paralelas: mesmo m. Perpendiculares: $m_1 \\cdot m_2 = -1$.'],
    ['Equação da circunferência', '$(x - a)^2 + (y - b)^2 = r^2$, centro (a, b) e raio r.'],
  ],
};
