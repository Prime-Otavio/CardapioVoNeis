export const brl = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Data de "hoje" no fuso do Brasil (America/Sao_Paulo), no formato YYYY-MM-DD.
// Não usar new Date().toISOString() para isso: o toISOString() devolve UTC,
// e à noite (depois das ~21h no Brasil) ele já virou o dia seguinte — o que
// fazia o caixa ser gravado/procurado na data errada.
export function hojeLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
