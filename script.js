// IMPORTANTE: Esta URL será alterada após o deploy do backend!
const apiUrl = 'https://URL-DO-SEU-BACKEND.onrender.com/api/dados-historicos';

const elementoUmidadeAtual = document.getElementById('umidade-atual' );
const elementoStatusUmidade = document.getElementById('status-umidade');
const contextoGrafico = document.getElementById('grafico-umidade').getContext('2d');
let meuGrafico;

async function buscarDados() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const dados = await response.json();
        
        if (dados.length > 0) {
            const ultimaLeitura = dados[dados.length - 1];
            
            // Calibração (ajuste estes valores com base no seu sensor)
            const valorMaximoSeco = 3200;
            const valorMinimoMolhado = 1500;
            let porcentagem = 100 - ((ultimaLeitura.valor - valorMinimoMolhado) / (valorMaximoSeco - valorMinimoMolhado)) * 100;
            porcentagem = Math.max(0, Math.min(100, porcentagem));

            elementoUmidadeAtual.textContent = `${porcentagem.toFixed(0)}%`;
            elementoStatusUmidade.textContent = porcentagem < 35 ? "Solo seco! Precisa regar." : "Umidade ideal.";
            elementoStatusUmidade.style.color = porcentagem < 35 ? "red" : "green";
        }
        atualizarGrafico(dados);
    } catch (error) {
        console.error("Falha ao buscar dados:", error);
        elementoStatusUmidade.textContent = "Erro ao carregar dados do servidor.";
    }
}

function atualizarGrafico(dados) {
    const labels = dados.map(d => new Date(d.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const valores = dados.map(d => d.valor);

    if (!meuGrafico) {
        meuGrafico = new Chart(contextoGrafico, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Leitura Bruta do Sensor', data: valores, borderColor: '#007bff', tension: 0.1 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } else {
        meuGrafico.data.labels = labels;
        meuGrafico.data.datasets[0].data = valores;
        meuGrafico.update();
    }
}

document.addEventListener('DOMContentLoaded', buscarDados);
setInterval(buscarDados, 20000); // Atualiza a cada 20 segundos
