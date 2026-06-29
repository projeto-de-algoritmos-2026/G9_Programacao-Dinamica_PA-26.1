from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
 
# Algoritmos
def knapsack(cursos, limiteHoras):
    n = len(cursos)
    W = int(limiteHoras)

    # Cria tabela dp[i][w] = máximo ganho usando os primeiros i cursos com w horas
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        cursoCurrent = cursos[i - 1]
        peso = int(cursoCurrent["horas"])
        valor = int(cursoCurrent["ganho"])

        for w in range(W + 1):
            # Não inclui o curso i
            dp[i][w] = dp[i - 1][w]

            # Inclui o curso i se couber
            if peso <= w:
                ganhoComCurso = dp[i - 1][w - peso] + valor
                if ganhoComCurso > dp[i][w]:
                    dp[i][w] = ganhoComCurso

    # Rastreia quais cursos foram selecionados
    selecionados = []
    w = W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selecionados.append(cursos[i - 1])
            w -= int(cursos[i - 1]["horas"])

    selecionados.reverse()

    # Cursos descartados
    nomesSelec = {c["nome"] for c in selecionados}
    descartados = [c for c in cursos if c["nome"] not in nomesSelec]

    totalGanho = sum(c["ganho"] for c in selecionados)
    totalHoras = sum(c["horas"] for c in selecionados)

    return {
        "selecionados": selecionados,
        "descartados": descartados,
        "totalGanho": totalGanho,
        "totalHoras": totalHoras,
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/recomendar", methods=["POST"])
def recomendar():
    dados = request.get_json()

    cursos = dados.get("cursos", [])
    limiteHoras = dados.get("limiteHoras", 0)

    if not cursos:
        return jsonify({"erro": "Nenhum curso cadastrado."}), 400

    if limiteHoras <= 0:
        return jsonify({"erro": "Limite de horas deve ser maior que zero."}), 400

    # Etapa 1: Knapsack — seleciona melhores cursos dentro do limite
    resultadoKnapsack = knapsack(cursos, limiteHoras)

    return jsonify({
        "knapsack": {
            "selecionados": resultadoKnapsack["selecionados"],
            "descartados": resultadoKnapsack["descartados"],
            "totalGanho": resultadoKnapsack["totalGanho"],
            "totalHoras": resultadoKnapsack["totalHoras"],
        },
        "limiteHoras": limiteHoras,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
