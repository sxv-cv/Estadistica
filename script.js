document.getElementById('responseForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const input = document.getElementById('responseTimes').value;
    const responseTimes = input.split(',').map(num => parseFloat(num.trim())).filter(n => !isNaN(n));

    if (responseTimes.length === 0) {
        alert('Por favor ingrese tiempos válidos.');
        return;
    }

    const isGrouped = responseTimes.length > 20;
    const mean = calculateMean(responseTimes);
    const percentiles = calculatePercentiles(responseTimes);
    const variance = calculateVariance(responseTimes);
    const stdDeviation = Math.sqrt(variance);
    const fisherCoefficient = calculateFisherCoefficient(responseTimes);
    const frequencyTable = isGrouped ? calculateGroupedFrequency(responseTimes) : calculateCompleteFrequency(responseTimes);

    // Mostrar los resultados después de calcular
    document.getElementById('results').style.display = 'grid';

    displayResults(mean, percentiles, variance, stdDeviation, fisherCoefficient, frequencyTable, responseTimes);
});

function calculateMean(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
}

function calculatePercentiles(data) {
    const sorted = data.slice().sort((a, b) => a - b);
    const percentiles = [10, 25, 50, 75, 90].map(p => {
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    });
    return {
        p10: percentiles[0],
        p25: percentiles[1],
        p50: percentiles[2],
        p75: percentiles[3],
        p90: percentiles[4]
    };
}

function calculateVariance(data) {
    const mean = calculateMean(data);
    return data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
}

function calculateFisherCoefficient(data) {
    const mean = calculateMean(data);
    const stdDeviation = Math.sqrt(calculateVariance(data));
    const skewness = data.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / data.length;
    return skewness / Math.pow(stdDeviation, 3);
}

function calculateCompleteFrequency(data) {
    const frequencyMap = {};
    data.forEach(value => {
        frequencyMap[value] = (frequencyMap[value] || 0) + 1;
    });
    const sortedEntries = Object.entries(frequencyMap).sort(([a], [b]) => a - b);
    const totalEntries = data.length;
    let cumulativeFrequency = 0;
    const frequencyTable = sortedEntries.map(([value, frequency]) => {
        cumulativeFrequency += frequency;
        return {
            value: Number(value),
            frequency: frequency,
            cumulativeFrequency,
            relativeFrequency: (frequency / totalEntries),
            cumulativeRelativeFrequency: (cumulativeFrequency / totalEntries)
        };
    });
    return frequencyTable;
}

function calculateGroupedFrequency(data) {
    const sorted = data.slice().sort((a, b) => a - b);
    const range = sorted[sorted.length - 1] - sorted[0];
    const numClasses = Math.round(1 + 3.322 * Math.log10(sorted.length));
    const classWidth = Math.ceil(range / numClasses);

    const frequencyTable = [];
    let lowerLimit = sorted[0];
    let cumulativeFrequency = 0;

    for (let i = 0; i < numClasses; i++) {
        const upperLimit = lowerLimit + classWidth;
        const frequency = data.filter(value => value >= lowerLimit && value < upperLimit).length;
        cumulativeFrequency += frequency;
        const relativeFrequency = frequency / data.length;
        const cumulativeRelativeFrequency = cumulativeFrequency / data.length;

        frequencyTable.push({
            interval: `${lowerLimit.toFixed(2)} - ${upperLimit.toFixed(2)}`,
            frequency,
            cumulativeFrequency,
            relativeFrequency,
            cumulativeRelativeFrequency
        });

        lowerLimit = upperLimit;
    }

    return frequencyTable;
}

function calculateMode(data) {
    const frequencyMap = {};
    data.forEach(value => {
        frequencyMap[value] = (frequencyMap[value] || 0) + 1;
    });
    const maxFrequency = Math.max(...Object.values(frequencyMap));
    const modes = Object.keys(frequencyMap).filter(value => frequencyMap[value] === maxFrequency);
    return modes.length === data.length ? 'No hay moda' : modes.join(', ');
}

function displayResults(mean, percentiles, variance, stdDeviation, fisherCoefficient, frequencyTable, data) {
    // Mostrar resultados de cada estadístico con interpretaciones
    document.getElementById('frequencyTable').innerHTML = generateFrequencyTableHTML(frequencyTable);
    document.getElementById('mean').textContent = `${mean.toFixed(2)} (Media: Promedio de los datos)`;
    document.getElementById('p50').textContent = `${percentiles.p50.toFixed(2)} (Mediana: Valor medio)`;
    document.getElementById('mode').textContent = `${calculateMode(data)} (Moda: Valor más frecuente)`;
    document.getElementById('p10').textContent = `${percentiles.p10.toFixed(2)} (Percentil 10: Valor bajo)`;
    document.getElementById('p25').textContent = `${percentiles.p25.toFixed(2)} (Cuartil 1: 25% de los datos)`;
    document.getElementById('p75').textContent = `${percentiles.p75.toFixed(2)} (Cuartil 3: 75% de los datos)`;
    document.getElementById('p90').textContent = `${percentiles.p90.toFixed(2)} (Percentil 90: Valor alto)`;

    document.getElementById('variance').textContent = `${variance.toFixed(2)} (Varianza: Dispersión de los datos en torno a la media)`;
    document.getElementById('stdDeviation').textContent = `${stdDeviation.toFixed(2)} (Desviación estándar: Variabilidad de los datos)`;
    document.getElementById('fisherCoefficient').textContent = `${fisherCoefficient.toFixed(2)} (Coeficiente de Asimetría de Fisher: Grado de asimetría en la distribución)`;
    document.getElementById('range').textContent = `${calculateRange(data)} (Rango: Diferencia entre el valor máximo y mínimo)`;
    document.getElementById('iqr').textContent = `${calculateIQR(data)} (Rango Intercuartílico: Diferencia entre Q3 y Q1)`;
}

function calculateRange(data) {
    const sorted = data.slice().sort((a, b) => a - b);
    return sorted[sorted.length - 1] - sorted[0];
}

function calculateIQR(data) {
    const sorted = data.slice().sort((a, b) => a - b);
    const q1 = calculatePercentiles(data).p25;
    const q3 = calculatePercentiles(data).p75;
    return q3 - q1;
}

function generateFrequencyTableHTML(frequencyTable) {
    let tableHTML = `<table>
                        <tr>
                            <th>${frequencyTable[0].interval ? 'Intervalo' : 'Valor (x)'}</th>
                            <th>Frecuencia Absoluta (f<sub>i</sub>)</th>
                            <th>Frecuencia Acumulada (F<sub>i</sub>)</th>
                            <th>Frecuencia Relativa (h<sub>i</sub>)</th>
                            <th>Frecuencia Relativa Acumulada (H<sub>i</sub>)</th>
                        </tr>`;
    
    frequencyTable.forEach(row => {
        tableHTML += `<tr>
                        <td>${row.interval || row.value}</td>
                        <td>${row.frequency}</td>
                        <td>${row.cumulativeFrequency}</td>
                        <td>${(row.relativeFrequency * 100).toFixed(2)}%</td>
                        <td>${(row.cumulativeRelativeFrequency * 100).toFixed(2)}%</td>
                      </tr>`;
    });
    
    tableHTML += `</table>`;
    return tableHTML;
}
