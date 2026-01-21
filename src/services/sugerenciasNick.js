export function generarSugerenciasCreativas(nickBase) {
  const base = nickBase.trim();

  const patrones = [
    (b) => `${b}x`,
    (b) => `x${b}`,
    (b) => `${b}_nova`,
    (b) => `${b}_alpha`,
    (b) => `${b}_cloud`,
    (b) => `${b}.x`,
    (b) => `x.${b}`,
    (b) => b.replace(/a/gi, '4'),
    (b) => b.replace(/e/gi, '3'),
    (b) => `${b}_mix`,
  ];

  const indices = [];
  while (indices.length < 2) {
    const i = Math.floor(Math.random() * patrones.length);
    if (!indices.includes(i)) indices.push(i);
  }

  return indices.map((i) => patrones[i](base));
}
