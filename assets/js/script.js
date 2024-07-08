const valoresMoneda = document.querySelector("#valoresMoneda");
const resultado = document.querySelector(".resultado");
const botonBuscar = document.querySelector("#boton-buscar");
const montoCLP = document.querySelector("#montoCLP");
const urlApi = "https://mindicador.cl/api";
let chart = null;

async function traerValores() {
    try {
        const res = await fetch(urlApi);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Request failed", error);
        return null;
    }
}

async function renderValores() {
    const valores = await traerValores();
    if (!valores) {
        valoresMoneda.innerHTML = "<option>Error al cargar valores</option>";
        return;
    }

    let template = "";

    for (const valor in valores) {
        if (valores.hasOwnProperty(valor) && typeof valores[valor] === "object") {
            template += `<option value="${valores[valor].codigo}">${valores[valor].nombre}</option>`;
        }
    }

    valoresMoneda.innerHTML = template;
}

async function convertirMoneda(event) {
    const valoresCambio = await traerValores();
    if (!valoresCambio) {
        resultado.innerHTML = "Error al obtener los valores de cambio";
        return;
    }

    const valorSelect = valoresMoneda.value;
    const cantidad = parseFloat(montoCLP.value);

    if (isNaN(cantidad) || cantidad <= 0) {
        resultado.innerHTML = "Por favor, introduce un monto válido";
        return;
    }

    const conversion = valoresCambio[valorSelect]?.valor;
    if (conversion) {
        const cambio = (cantidad / conversion).toFixed(2);
        resultado.innerHTML = `Resultado:$ ${cambio}`;
        renderizarGrafico(valorSelect); // Actualizar gráfico después de la conversión
    } 
}

botonBuscar.addEventListener("click", convertirMoneda);

renderValores();

async function renderizarGrafico(codigo) {
    try {
        const res = await fetch(`${urlApi}/${codigo}`);
        const info = await res.json();
        const data = info.serie.slice(0, 10).reverse(); // Obtener los últimos 10 días

        const labels = data.map(item => item.fecha.substring(0, 10));
        const valores = data.map(item => item.valor);

        const ctx = document.getElementById('myChart').getContext('2d');

        if (chart) {
            chart.destroy();
        }

        // Crear el gráfico
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: "Historial últimos 10 días",
                    backgroundColor: 'rgba(255, 255, 255, 1)', // Fondo blanco
                    borderColor: 'rgba(255, 0, 0, 1)', // Línea roja
                    borderWidth: 2,
                    fill: false,
                    data: valores
                }]
            },
            options: {
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Valor'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 0, 0, 1)' // Color del texto de la leyenda rojo
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    },
                    point: {
                        radius: 3,
                        backgroundColor: 'rgba(255, 0, 0, 1)'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener el historial de la moneda', error);
        resultado.innerHTML += '<br>Error al obtener el historial de la moneda';
    }
}
